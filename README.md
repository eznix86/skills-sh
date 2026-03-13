# skills-sh CLI

A CLI for [skills.sh](https://skills.sh) — search, compare, and security-audit agent skills.
Designed to be **human-friendly**, **LLM-friendly**, and **pipeable**.

## Install

```bash
npm install -g skills-sh-cli
# or run directly
npx skills-sh <command>
```

## Commands

### `search`
```bash
skills-sh search <query> [--limit n] [--json | --md]

# Examples
skills-sh search mapbox
skills-sh search react --limit 5
skills-sh search typescript --json
skills-sh search python --md
```

### `popular`
```bash
skills-sh popular [--limit n] [--json | --md]

skills-sh popular --limit 10
skills-sh popular --json
```

### `details`
```bash
skills-sh details <owner/repo/skillId> [--json | --md]

skills-sh details wshobson/agents/api-design-principles
skills-sh details wshobson/agents/api-design-principles --json
skills-sh details wshobson/agents/api-design-principles --md
```

### `compare`
```bash
skills-sh compare <owner/repo/skillId> <owner/repo/skillId> [--json | --md]

skills-sh compare mapbox/mapbox-agent-skills/mapbox-style-patterns \
                  wshobson/agents/api-design-principles
skills-sh compare ... ... --json
skills-sh compare ... ... --md
```

### `install`
```bash
# Prints raw install command — designed to pipe directly to shell
skills-sh install <owner/repo>
$(skills-sh install mapbox/mapbox-agent-skills)
```

## Output Formats

| Flag | Best for |
|------|----------|
| _(none)_ | Human terminal use — color, aligned columns |
| `--json` | LLM agents, scripts, `jq` piping |
| `--md`   | LLM context injection, docs, reports |

## Security Audits

Every `details` and `compare` response includes results from three independent auditors:

| Auditor | What it checks |
|---------|---------------|
| **Gen Agent Trust Hub** | Agent-specific trust and prompt safety |
| **Socket** | Malicious packages, typosquatting, supply chain |
| **Snyk** | Vulnerabilities, outdated deps, credential exposure |

Overall status is the worst of the three: `pass` > `warn` > `fail`.

> ⚠️ ~13% of all skills on skills.sh contain at least one critical security issue.
> Always check security before installing.

## API Notes

- Search uses `GET https://skills.sh/api/search?q=...&limit=...` (official JSON API)
- Popular uses multiple search queries + sort by installs (no leaderboard JSON API exists)
- Details + security scrapes the skill HTML page at `skills.sh/{owner}/{repo}/{skillId}`

## Dev

```bash
npm install
npm run build
node dist/index.js search mapbox
```
