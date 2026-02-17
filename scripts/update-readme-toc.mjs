import fs from "node:fs";

const README_PATH = "README.md";
const START_MARKER = "<!-- toc -->";
const END_MARKER = "<!-- tocstop -->";

function slugifyHeading(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseSections(lines) {
  const sections = [];
  let currentSection = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^###\s+(.+?)\s*$/);
    if (sectionMatch) {
      currentSection = { title: sectionMatch[1], files: [] };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      continue;
    }

    const fileMatch = line.match(
      /^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*(.*?)\s*\|?\s*$/
    );
    if (!fileMatch) {
      continue;
    }

    currentSection.files.push({
      name: fileMatch[1],
      path: fileMatch[2],
      summary: fileMatch[3].trim(),
    });
  }

  return sections;
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
  const lines = readme.split(/\r?\n/);
  const sections = parseSections(lines);
  const tocLines = buildTocLines(sections);

  const blockPattern = new RegExp(
    `${START_MARKER}[\\s\\S]*?${END_MARKER}`,
    "m"
  );
  if (!blockPattern.test(readme)) {
    throw new Error(`Could not find ${START_MARKER} ... ${END_MARKER} block.`);
  }

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
