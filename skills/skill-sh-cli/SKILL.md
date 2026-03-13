---
name: skill-sh-cli
description: Search, inspect, and compare skills from skills.sh with the local CLI. Use when the user wants to find skills by keyword, browse trending or hot skills, review a skill's SKILL.md content, check weekly installs or security audits, or compare two skills side by side.
---

# skill-sh-cli

Use this skill to operate the `skills-sh` CLI.

## Quick start

Run one of these commands:

```bash
npx skills-sh search golang
npx skills-sh search --category=trending
npx skills-sh show jeffallan/claude-skills/golang-pro
npx skills-sh compare jeffallan/claude-skills/golang-pro affaan-m/everything-claude-code/golang-patterns
npx skills-sh show jeffallan/claude-skills/golang-pro --json
npx skills-sh compare jeffallan/claude-skills/golang-pro affaan-m/everything-claude-code/golang-patterns --md
```

## Instructions

1. If the user wants discovery, use `npx skills-sh search <query>` or `npx skills-sh search --category=trending|hot`.
2. If the user wants details for one skill, use `npx skills-sh show <owner/repo/skillId>`.
3. If the user only needs metadata, use `npx skills-sh show <owner/repo/skillId> --meta-only`.
4. If the user wants a side-by-side evaluation, use `npx skills-sh compare <refA> <refB>`.
5. Prefer `--json` for scripts or structured output and `--md` when the result should be reusable as markdown.
6. When summarizing results, focus on source, weekly installs, first seen, security audits, and the rendered `SKILL.md` content.

## Output formats

All main commands support these formats:

- default pretty terminal output
- `--json` for structured output
- `--md` for markdown output

Examples:

```bash
npx skills-sh search react --json
npx skills-sh search --category=hot --md
npx skills-sh show jeffallan/claude-skills/golang-pro --json
npx skills-sh show jeffallan/claude-skills/golang-pro --md
npx skills-sh compare jeffallan/claude-skills/golang-pro affaan-m/everything-claude-code/golang-patterns --json
npx skills-sh compare jeffallan/claude-skills/golang-pro affaan-m/everything-claude-code/golang-patterns --md
```

## Examples

Search by keyword:

```bash
npx skills-sh search react
npx skills-sh search golang --limit 10
```

Browse categories:

```bash
npx skills-sh search --category=trending
npx skills-sh search --category=hot
```

Inspect a skill:

```bash
npx skills-sh show jeffallan/claude-skills/golang-pro
npx skills-sh show jeffallan/claude-skills/golang-pro --meta-only
npx skills-sh show jeffallan/claude-skills/golang-pro --json
```

Compare two skills:

```bash
npx skills-sh compare jeffallan/claude-skills/golang-pro affaan-m/everything-claude-code/golang-patterns
npx skills-sh compare jeffallan/claude-skills/golang-pro affaan-m/everything-claude-code/golang-patterns --md
```

## Best practices

- Use `show` when the user needs the actual rendered `SKILL.md`, not just search results.
- Use `--meta-only` to avoid dumping long skill content when only summary data is needed.
- Use `compare` for weekly installs, first seen, and security audits; it does not include install commands.
- Use `show` when the install command is needed.

## Requirements

Typical usage:

```bash
npx skills-sh --help
npx skills-sh search golang
```

For local development in this repository:

```bash
bun run dev --help
bun run build
node dist/index.js search golang
```
