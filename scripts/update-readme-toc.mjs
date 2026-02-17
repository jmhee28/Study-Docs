import fs from "node:fs";
import path from "node:path";

const README_PATH = "README.md";
const START_MARKER = "<!-- toc -->";
const END_MARKER = "<!-- tocstop -->";
const IGNORED_DIRS = new Set([".git", ".github", ".obsidian", "node_modules"]);

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function truncateText(text, maxLength = 140) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

function cleanupSummary(text) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTopLevelFolder(markdownPath) {
  const normalized = markdownPath.replace(/^\.\//, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length <= 1) {
    return "(root)";
  }
  return parts[0];
}

function listMarkdownFiles(rootDir = ".") {
  const results = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = normalizePosix(path.relative(".", fullPath));

      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) {
          continue;
        }
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (!entry.name.toLowerCase().endsWith(".md")) {
        continue;
      }

      if (relativePath === README_PATH) {
        continue;
      }

      results.push(`./${relativePath}`);
    }
  }

  return results.sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );
}

function extractSummary(markdownPath) {
  const filePath = markdownPath.replace(/^\.\//, "");
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  let inCodeBlock = false;
  let inFrontMatter = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (index === 0 && line === "---") {
      inFrontMatter = true;
      continue;
    }
    if (inFrontMatter) {
      if (line === "---") {
        inFrontMatter = false;
      }
      continue;
    }

    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock || line.length === 0) {
      continue;
    }

    if (/^!\[.*\]\(.*\)$/.test(line)) {
      continue;
    }
    if (/^\|/.test(line) || /^:?-{3,}:?$/.test(line)) {
      continue;
    }

    const headingMatch = line.match(/^#{1,6}\s+(.*)$/);
    const summaryRaw = headingMatch ? headingMatch[1] : line;
    const summary = cleanupSummary(summaryRaw);
    if (summary.length > 0) {
      return truncateText(summary);
    }
  }

  return "-";
}

function collectSections() {
  const markdownPaths = listMarkdownFiles();
  const grouped = new Map();

  for (const markdownPath of markdownPaths) {
    const sectionTitle = getTopLevelFolder(markdownPath);
    if (!grouped.has(sectionTitle)) {
      grouped.set(sectionTitle, []);
    }

    grouped.get(sectionTitle).push({
      name: path.posix.basename(markdownPath),
      path: markdownPath,
      summary: extractSummary(markdownPath),
    });
  }

  const sectionTitles = Array.from(grouped.keys()).sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );

  return sectionTitles.map((title) => ({
    title,
    files: grouped
      .get(title)
      .sort((a, b) => a.path.localeCompare(b.path, "en", { sensitivity: "base" })),
  }));
}

function buildTocLines(sections) {
  const tocLines = [];
  const escapeTableText = (text) => text.replace(/\|/g, "\\|").trim();

  for (const section of sections) {
    tocLines.push(`### ${section.title}`);
    tocLines.push("");
    tocLines.push("| 파일 | 내용 요약 |");
    tocLines.push("|:-----|:----------|");

    if (section.files.length === 0) {
      tocLines.push("| - | - |");
    } else {
      for (const file of section.files) {
        tocLines.push(
          `| [${file.name}](${file.path}) | ${escapeTableText(file.summary || "-")} |`
        );
      }
    }

    tocLines.push("");
  }

  if (tocLines.length > 0 && tocLines[tocLines.length - 1] === "") {
    tocLines.pop();
  }

  return tocLines;
}

function updateToc(readme) {
  const blockPattern = new RegExp(
    `${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}`,
    "m"
  );
  if (!blockPattern.test(readme)) {
    throw new Error(`Could not find ${START_MARKER} ... ${END_MARKER} block.`);
  }

  const sections = collectSections();
  if (sections.length === 0) {
    throw new Error("No markdown files found. Refusing to overwrite TOC.");
  }

  const tocLines = buildTocLines(sections);
  const replacement = [
    START_MARKER,
    "",
    ...tocLines,
    "",
    END_MARKER,
  ].join("\n");

  return readme.replace(blockPattern, replacement);
}

const original = fs.readFileSync(README_PATH, "utf8");
const updated = updateToc(original);

if (original !== updated) {
  fs.writeFileSync(README_PATH, updated, "utf8");
  console.log("README TOC updated.");
} else {
  console.log("README TOC already up to date.");
}
