#!/usr/bin/env node

/**
 * Generate changelog using hybrid approach:
 * 1. Rule-based commit parsing and grouping
 * 2. AI enhancement for descriptions
 * Usage: node scripts/generate-changelog.mjs "<commits>" "<date>"
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commits = process.argv[2] || "";
const date = process.argv[3] || new Date().toISOString().split("T")[0];

if (!commits.trim()) {
  console.log(
    "No commits found for the past week. Skipping changelog generation."
  );
  process.exit(0);
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("Error: OPENROUTER_API_KEY environment variable is not set");
  process.exit(1);
}

function parseCommitLine(line) {
  const parts = line.trim().split(/\s+/);
  const hash = parts[0];
  const message = parts.slice(1).join(" ");

  const prMatch = message.match(/\(#(\d+)\)$/);
  const prNumber = prMatch ? prMatch[1] : null;
  const cleanMessage = prMatch
    ? message.replace(prMatch[0], "").trim()
    : message;

  return { hash, message: cleanMessage, prNumber, originalMessage: message };
}

function extractCommitType(message) {
  const typeMatch = message.match(
    /^(feat|fix|refactor|perf|security|docs|chore|test):\s*/i
  );
  if (typeMatch) {
    const typeMap = {
      feat: "feature",
      fix: "fix",
      refactor: "refactor",
      perf: "performance",
      security: "security",
      docs: "docs",
      chore: "chore",
      test: "test",
    };
    return typeMap[typeMatch[1].toLowerCase()] || "improvement";
  }

  if (message.toLowerCase().startsWith("major:")) {
    return "feature";
  }

  return "improvement";
}

function shouldIncludeCommit(commit) {
  const changelogPatterns = [
    /^chore: add changelog for week of/i,
    /^chore: update changelog/i,
    /^chore: merge/i,
  ];

  if (changelogPatterns.some((pattern) => pattern.test(commit.message))) {
    return false;
  }

  if (!commit.message || commit.message.length < 5) {
    return false;
  }

  return true;
}

function groupCommitsByPR(commits) {
  const prGroups = new Map();
  const noPRGroup = [];

  commits.forEach((commit) => {
    if (commit.prNumber) {
      if (!prGroups.has(commit.prNumber)) {
        prGroups.set(commit.prNumber, []);
      }
      prGroups.get(commit.prNumber).push(commit);
    } else {
      noPRGroup.push(commit);
    }
  });

  return { prGroups, noPRGroup };
}

function getGroupType(commits) {
  const types = commits.map((c) => extractCommitType(c.message));

  if (types.some((t) => t === "feature")) return "feature";
  if (types.some((t) => t === "fix")) return "fix";
  if (types.some((t) => t === "security")) return "security";

  const typeFrequency = types.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(typeFrequency).sort((a, b) => b[1] - a[1])[0][0];
}

async function enhanceWithAI(commits, prNumber) {
  const commitMessages = commits
    .map(
      (c) =>
        `${c.message}${c.originalMessage.includes(`(#${prNumber})`) ? "" : ` (#${prNumber})`}`
    )
    .join("\n");

  const prompt = `Analyze these git commits and generate a changelog entry:

${commitMessages}

Return a JSON object with this exact structure:
{
  "title": "Brief title (2-5 words)",
  "description": "Clear description of what changed (2-3 sentences)",
  "type": "feature|fix|improvement|performance|security|breaking|deprecated|refactor|chore|docs",
  "isMajor": boolean
}

Guidelines:
- Focus on what was accomplished, not how
- Be concise but informative
- isMajor: true only for significant user-facing changes (new features, major UX updates, breaking changes)
- type: use conventional commit types based on the commit messages
- Return ONLY the JSON, no additional text`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://github.com",
          "X-Title": "FTB Changelog Enhancer",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-safeguard-20b",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No content from AI");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      title: parsed.title || "Update",
      description: parsed.description || commits[0].message,
      type: parsed.type || getGroupType(commits),
      isMajor: parsed.isMajor || false,
    };
  } catch (error) {
    console.warn(
      `  ⚠ AI enhancement failed for ${prNumber ? `PR #${prNumber}` : "commit group"}: ${error.message}`
    );
    return {
      title: commits[0].message.split(": ")[0] || "Update",
      description: commits.map((c) => c.message).join("; "),
      type: getGroupType(commits),
      isMajor: commits.some((c) =>
        c.message.toLowerCase().startsWith("major:")
      ),
    };
  }
}

function generateYAMLFrontmatter(changes, date) {
  const majorChange = changes.find((c) => c.isMajor);
  const title = majorChange
    ? majorChange.title
    : changes[0]?.title || "Weekly Update";

  const changeTypes = changes.map((c) => c.type);
  const summary = `This week includes ${changes.length} changes: ${changeTypes.filter((v, i, a) => a.indexOf(v) === i).join(", ")}.`;

  const yaml = `---
week: "${new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}"
date: ${date}
title: "${title}"
summary: "${summary}"
isMajor: ${majorChange ? "true" : "false"}
author: "FTB Team"
changes:
${changes
  .map(
    (c) => `  - type: ${c.type}
    title: "${c.title}"
    description: "${c.description.replace(/"/g, '\\"')}"`
  )
  .join("\n")}
---`;

  return yaml;
}

function generateMarkdownBody(changes) {
  const highlights = changes.filter((c) => c.isMajor);

  if (highlights.length > 0) {
    const highlightText = highlights.map((h) => h.title).join(", ");
    return `This week brings significant updates including ${highlightText}. We've made ${changes.length} total changes to improve the platform.`;
  }

  const topChanges = changes
    .slice(0, 3)
    .map((c) => c.title)
    .join(", ");
  return `This week we've implemented ${changes.length} improvements, focusing on ${topChanges}.`;
}

async function main() {
  try {
    const commitLines = commits
      .trim()
      .split("\n")
      .filter((line) => line.trim());

    const parsedCommits = commitLines
      .map(parseCommitLine)
      .filter(shouldIncludeCommit);

    console.log(`\nProcessing ${parsedCommits.length} commits...`);

    if (parsedCommits.length === 0) {
      console.log("No relevant commits found. Skipping changelog generation.");
      process.exit(0);
    }

    const { prGroups, noPRGroup } = groupCommitsByPR(parsedCommits);

    console.log(`  - ${prGroups.size} PR groups`);
    console.log(`  - ${noPRGroup.length} standalone commits`);

    const allGroups = [];

    for (const [prNumber, prCommits] of prGroups) {
      console.log(
        `\nProcessing PR #${prNumber} (${prCommits.length} commits)...`
      );
      const enhanced = await enhanceWithAI(prCommits, prNumber);
      allGroups.push({ ...enhanced, prNumber });
    }

    if (noPRGroup.length > 0) {
      console.log(`\nProcessing ${noPRGroup.length} standalone commits...`);
      const enhanced = await enhanceWithAI(noPRGroup, null);
      allGroups.push({ ...enhanced, prNumber: null });
    }

    allGroups.sort((a, b) => {
      if (a.isMajor && !b.isMajor) return -1;
      if (!a.isMajor && b.isMajor) return 1;
      return 0;
    });

    const yaml = generateYAMLFrontmatter(allGroups, date);
    const markdown = generateMarkdownBody(allGroups);

    const changelogContent = `${yaml}\n\n${markdown}\n`;

    const changelogDir = join(__dirname, "..", "src", "content", "changelog");
    mkdirSync(changelogDir, { recursive: true });

    const filePath = join(changelogDir, `${date}.md`);
    writeFileSync(filePath, changelogContent, "utf-8");

    console.log(`\n✓ Changelog generated: ${filePath}`);
    console.log(
      `  - ${allGroups.length} entries (${allGroups.filter((g) => g.isMajor).length} major)`
    );

    const coverage = (
      (parsedCommits.length / commitLines.length) *
      100
    ).toFixed(1);
    console.log(
      `  - Coverage: ${coverage}% (${parsedCommits.length}/${commitLines.length} commits)`
    );
  } catch (error) {
    console.error("\nError generating changelog:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
