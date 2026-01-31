#!/usr/bin/env node

/**
 * Generate changelog using OpenRouter API
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
  console.log("No commits found for the past week. Skipping changelog generation.");
  process.exit(0);
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("Error: OPENROUTER_API_KEY environment variable is not set");
  process.exit(1);
}

const prompt = `Generate a customer-facing changelog for the FTB web app based on these commits from the past week:

${commits}

Follow these rules:
1. ONLY include user-facing changes (features, fixes, improvements users would notice)
2. EXCLUDE: dependency bumps, internal refactors, CI/CD changes, code cleanup, TypeScript fixes, test updates
3. Group related commits into single entries
4. Write descriptions in plain language customers understand
5. Be concise and focus on what users will actually notice

Create a changelog entry with this exact format (YAML frontmatter + markdown):

---
week: "[Month Day, Year]"
date: ${date}
title: "[Brief descriptive title]"
summary: "[One sentence summary]"
isMajor: false
author: "FTB Team"
changes:
  - type: feature|fix|improvement|performance|security|breaking|deprecated
    title: "[Entry name]"
    description: "[User-friendly description]"
---

[Brief paragraph about release highlights - 2-3 sentences max]

If there are no user-facing changes, respond with a changelog that has an empty changes array and note in the summary that this was a maintenance week with no user-facing changes.

IMPORTANT: Return ONLY the changelog content, no additional text or explanation.`;

async function generateChangelog() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://github.com",
        "X-Title": "FTB Weekly Changelog Generator",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2.5",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const changelogContent = data.choices[0]?.message?.content?.trim();

    if (!changelogContent) {
      throw new Error("No content received from OpenRouter API");
    }

    // Ensure the directory exists
    const changelogDir = join(__dirname, "..", "src", "content", "changelog");
    mkdirSync(changelogDir, { recursive: true });

    // Write the changelog file
    const filePath = join(changelogDir, `${date}.md`);
    writeFileSync(filePath, changelogContent, "utf-8");

    console.log(`✓ Changelog generated: ${filePath}`);
  } catch (error) {
    console.error("Error generating changelog:", error.message);
    process.exit(1);
  }
}

generateChangelog();
