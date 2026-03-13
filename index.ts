#!/usr/bin/env node
import { Command, Option } from 'commander';
import chalk from 'chalk';
import { searchSkills, fetchSkillDetail, fetchCategory } from './api.js';
import { formatSearchResults, formatSkillDetail, formatCompare } from './formatters.js';
import type { OutputFormat } from './types.js';
import type { SearchCategory } from './api.js';

const program = new Command();

// ─── Format flag helper ───────────────────────────────────────────────────────

function getFormat(opts: { json?: boolean; md?: boolean }): OutputFormat {
  if (opts.json) return 'json';
  if (opts.md)   return 'md';
  return 'pretty';
}

const formatOptions = (cmd: Command) =>
  cmd
    .addOption(new Option('--json', 'Output as JSON').conflicts('md'))
    .addOption(new Option('--md',   'Output as Markdown').conflicts('json'));

// ─── CLI setup ────────────────────────────────────────────────────────────────

program
  .name('skills-sh')
  .description('CLI for skills.sh — search, compare, and audit agent skills')
  .version('1.0.0');

// ─── search ──────────────────────────────────────────────────────────────────

formatOptions(
  program
    .command('search [query]')
    .description('Search for skills by keyword')
    .option('-l, --limit <n>', 'Max results', '20')
    .addOption(new Option('--category <name>', 'Browse a category').choices(['trending', 'hot']))
).action(async (query: string | undefined, opts) => {
  const format = getFormat(opts);
  const limit = parseInt(opts.limit, 10);
  const category = opts.category as SearchCategory | undefined;

  if (!query && !category) {
    console.error(chalk.red('Error: provide a search query or use --category=trending|hot'));
    process.exit(1);
  }

  if (format === 'pretty') {
    process.stdout.write(chalk.gray(category ? `  Fetching ${category} skills…\n` : '  Searching…\n'));
  }

  try {
    const skills = category
      ? await fetchCategory(category, limit)
      : (await searchSkills(query as string, limit)).skills;

    if (skills.length === 0) {
      const emptyLabel = category ? category : query;
      console.log(format === 'json'
        ? JSON.stringify({ query: emptyLabel, count: 0, skills: [] })
        : `No results found for "${emptyLabel}"`
      );
      return;
    }
    console.log(formatSearchResults(skills, category ? `category:${category}` : (query as string), format));
  } catch (err) {
    console.error(chalk.red(`Error: ${(err as Error).message}`));
    process.exit(1);
  }
});

// ─── show ────────────────────────────────────────────────────────────────────

formatOptions(
  program
    .command('show <owner/repo/skillId>')
    .alias('details')
    .description('Show metadata and extracted content for a skill')
    .option('--meta-only', 'Show metadata without skill content')
).action(async (ref: string, opts) => {
  const format = getFormat(opts);
  const parts = ref.split('/');

  if (parts.length < 3) {
    console.error(chalk.red('Error: expected format owner/repo/skillId'));
    process.exit(1);
  }

  const [owner, repo, ...rest] = parts;
  const skillId = rest.join('/'); // handles skillIds with colons like react:components

  if (format === 'pretty') process.stdout.write(chalk.gray(`  Fetching ${ref}…\n`));

  try {
    const detail = await fetchSkillDetail(owner, repo, skillId);
    console.log(formatSkillDetail(detail, format, { metaOnly: opts.metaOnly }));
  } catch (err) {
    console.error(chalk.red(`Error: ${(err as Error).message}`));
    process.exit(1);
  }
});

// ─── compare ─────────────────────────────────────────────────────────────────

formatOptions(
  program
    .command('compare <refA> <refB>')
    .description('Compare two skills side by side')
).action(async (refA: string, refB: string, opts) => {
  const format = getFormat(opts);

  function parseRef(ref: string): [string, string, string] {
    const parts = ref.split('/');
    if (parts.length < 3) throw new Error(`Invalid ref "${ref}" — expected owner/repo/skillId`);
    const [owner, repo, ...rest] = parts;
    return [owner, repo, rest.join('/')];
  }

  if (format === 'pretty') process.stdout.write(chalk.gray('  Fetching skills for comparison…\n'));

  try {
    const [aOwner, aRepo, aSkill] = parseRef(refA);
    const [bOwner, bRepo, bSkill] = parseRef(refB);

    const [detailA, detailB] = await Promise.all([
      fetchSkillDetail(aOwner, aRepo, aSkill),
      fetchSkillDetail(bOwner, bRepo, bSkill),
    ]);

    console.log(formatCompare([detailA, detailB], format));
  } catch (err) {
    console.error(chalk.red(`Error: ${(err as Error).message}`));
    process.exit(1);
  }
});

program.parse();
