# skills-sh

Search, inspect, and compare skills from [skills.sh](https://skills.sh).

- npm: `https://www.npmjs.com/package/skills-sh`
- repo: `https://github.com/eznix86/skills-sh`

## Install

```bash
npm install -g skills-sh
```

Or run it directly:

```bash
npx skills-sh --help
```

## Companion Skill

This project also has a companion Claude/OpenCode skill named `skills-sh`.

Install it with:

```bash
npx skills add https://github.com/eznix86/skills-sh --skill skills-sh
```

## Commands

### `search`

Search by keyword:

```bash
skills-sh search <query> [--limit n] [--json | --md]
```

Browse built-in categories:

```bash
skills-sh search --category=trending [--limit n] [--json | --md]
skills-sh search --category=hot [--limit n] [--json | --md]
```

Examples:

```bash
skills-sh search golang
skills-sh search react --limit 5
skills-sh search --category=trending
skills-sh search --category=hot --md
skills-sh search typescript --json
```

### `show`

Show metadata and rendered `SKILL.md` content for one skill:

```bash
skills-sh show <owner/repo/skillId> [--meta-only] [--json | --md]
```

Alias:

```bash
skills-sh details <owner/repo/skillId>
```

Examples:

```bash
skills-sh show jeffallan/claude-skills/golang-pro
skills-sh show jeffallan/claude-skills/golang-pro --meta-only
skills-sh show jeffallan/claude-skills/golang-pro --json
skills-sh show jeffallan/claude-skills/golang-pro --md
```

`show` includes:

- weekly installs
- first seen
- security audits
- platform usage
- source links
- install command
- rendered `SKILL.md` content unless `--meta-only` is used

### `compare`

Compare two skills side by side:

```bash
skills-sh compare <owner/repo/skillId> <owner/repo/skillId> [--json | --md]
```

Examples:

```bash
skills-sh compare jeffallan/claude-skills/golang-pro affaan-m/everything-claude-code/golang-patterns
skills-sh compare jeffallan/claude-skills/golang-pro affaan-m/everything-claude-code/golang-patterns --json
skills-sh compare jeffallan/claude-skills/golang-pro affaan-m/everything-claude-code/golang-patterns --md
```

`compare` focuses on:

- source
- weekly installs
- first seen
- security audits

It intentionally does not include install commands.

## Output formats

| Flag | Best for |
| --- | --- |
| _(none)_ | Human terminal output |
| `--json` | Scripts, agents, `jq` |
| `--md` | Markdown reports or reusable context |

## Security audits

`show` and `compare` include results from three auditors:

| Auditor | What it checks |
| --- | --- |
| Gen Agent Trust Hub | Agent-specific trust and prompt safety |
| Socket | Malicious packages, typosquatting, supply chain |
| Snyk | Vulnerabilities and dependency issues |

Overall status is the worst of the three: `pass` > `warn` > `fail`.

## How it works

- Keyword search uses `GET https://skills.sh/api/search?q=...&limit=...`
- Category search reads the `trending` and `hot` pages from `skills.sh`
- `show` scrapes the skill page and extracts rendered `SKILL.md` content
- `compare` fetches both skills and formats the important metadata side by side

## Development

```bash
bun install
bun run typecheck
bun run build
bun run dev search golang
bun run dev show jeffallan/claude-skills/golang-pro
```

Run the built CLI:

```bash
node dist/index.js search golang
```
