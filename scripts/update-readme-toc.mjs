import fs from "node:fs";
import path from "node:path";

const README_PATH = "README.md";
const SUMMARY_PATH = "SUMMARY.md";
const START_MARKER = "<!-- toc -->";
const END_MARKER = "<!-- tocstop -->";
const IGNORED_DIRS = new Set([".git", ".github", ".obsidian", "node_modules"]);
const IGNORED_FILES = new Set([README_PATH, SUMMARY_PATH]);

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function stripDotSlash(markdownPath) {
  return markdownPath.replace(/^\.\//, "");
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

      if (IGNORED_FILES.has(relativePath)) {
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

function buildSummaryLines(sections) {
  const summaryLines = ["# Summary", "", "* [Home](README.md)", ""];

  for (const section of sections) {
    summaryLines.push(`## ${section.title}`);

    for (const file of section.files) {
      summaryLines.push(`* [${file.name}](${stripDotSlash(file.path)})`);
    }

    summaryLines.push("");
  }

  if (summaryLines.length > 0 && summaryLines[summaryLines.length - 1] === "") {
    summaryLines.pop();
  }

  return summaryLines.join("\n").concat("\n");
}

function createEmptyTocBlock() {
  return [START_MARKER, "", END_MARKER].join("\n");
}

function ensureTocBlock(readme) {
  const blockPattern = new RegExp(
    `${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}`,
    "m"
  );
  if (blockPattern.test(readme)) {
    return readme;
  }

  const tocHeadingPattern = /^##\s+(목차|Table of Contents)\s*$/m;
  const headingMatch = readme.match(tocHeadingPattern);

  if (!headingMatch || headingMatch.index === undefined) {
    const normalized = readme.trimEnd();
    return `${normalized}\n\n## 목차\n\n${createEmptyTocBlock()}\n`;
  }

  const headingStart = headingMatch.index;
  const headingText = headingMatch[0];
  const headingEnd = headingStart + headingText.length;

  let contentStart = headingEnd;
  if (readme.startsWith("\r\n", contentStart)) {
    contentStart += 2;
  } else if (readme.startsWith("\n", contentStart)) {
    contentStart += 1;
  }

  const rest = readme.slice(contentStart);
  const nextHeadingRegex = /^##\s+/m;
  const nextHeadingMatch = rest.match(nextHeadingRegex);
  const contentEnd =
    nextHeadingMatch && nextHeadingMatch.index !== undefined
      ? contentStart + nextHeadingMatch.index
      : readme.length;

  const beforeHeading = readme.slice(0, headingStart).trimEnd();
  const headingLine = readme.slice(headingStart, headingEnd).trimEnd();
  const afterToc = readme.slice(contentEnd).trimStart();

  const rebuilt = [
    beforeHeading,
    "",
    headingLine,
    "",
    createEmptyTocBlock(),
    afterToc ? "" : null,
    afterToc || null,
  ]
    .filter((part) => part !== null)
    .join("\n")
    .trimEnd();

  return `${rebuilt}\n`;
}

function updateToc(readme, sections) {
  const ensuredReadme = ensureTocBlock(readme);
  const blockPattern = new RegExp(
    `${escapeRegExp(START_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}`,
    "m"
  );
  if (!blockPattern.test(ensuredReadme)) {
    throw new Error(`Could not find ${START_MARKER} ... ${END_MARKER} block.`);
  }

  const tocLines = buildTocLines(sections);
  const replacement = [
    START_MARKER,
    "",
    ...tocLines,
    "",
    END_MARKER,
  ].join("\n");

  return ensuredReadme.replace(blockPattern, replacement);
}

function writeIfChanged(filePath, nextContent) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  if (current === nextContent) {
    return false;
  }
  fs.writeFileSync(filePath, nextContent, "utf8");
  return true;
}

const sections = collectSections();
if (sections.length === 0) {
  throw new Error("No markdown files found. Refusing to overwrite TOC/SUMMARY.");
}

const readmeOriginal = fs.readFileSync(README_PATH, "utf8");
const readmeUpdated = updateToc(readmeOriginal, sections);
const readmeChanged = writeIfChanged(README_PATH, readmeUpdated);

const summaryContent = buildSummaryLines(sections);
const summaryChanged = writeIfChanged(SUMMARY_PATH, summaryContent);

if (readmeChanged || summaryChanged) {
  console.log("README TOC / SUMMARY updated.");
} else {
  console.log("README TOC / SUMMARY already up to date.");
}
