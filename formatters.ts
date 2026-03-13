import chalk from 'chalk';
import type { Skill, SkillDetail, OutputFormat } from './types.js';

// ─── Security badge helpers ───────────────────────────────────────────────────

function securityBadgePretty(status: string): string {
  switch (status) {
    case 'pass':    return chalk.green('● pass');
    case 'warn':    return chalk.yellow('● warn');
    case 'fail':    return chalk.red('● fail');
    default:        return chalk.gray('○ unknown');
  }
}

function securityBadgeMd(status: string): string {
  switch (status) {
    case 'pass':    return '✅ pass';
    case 'warn':    return '⚠️  warn';
    case 'fail':    return '❌ fail';
    default:        return '❓ unknown';
  }
}

function overallBadgePretty(status: string): string {
  switch (status) {
    case 'pass':    return chalk.bgGreen.black(' PASS ');
    case 'warn':    return chalk.bgYellow.black(' WARN ');
    case 'fail':    return chalk.bgRed.white(' FAIL ');
    default:        return chalk.bgGray.white(' ? ');
  }
}

// ─── Search results ───────────────────────────────────────────────────────────

export function formatSearchResults(
  skills: Skill[],
  query: string,
  format: OutputFormat
): string {
  const label = query.startsWith('category:')
    ? `Category: "${query.slice('category:'.length)}"`
    : `Search: "${query}"`;

  if (format === 'json') {
    return JSON.stringify({ query, count: skills.length, skills }, null, 2);
  }

  if (format === 'md') {
    const rows = skills.map((s, i) =>
      `| ${i + 1} | \`${s.name}\` | \`${s.source}\` |`
    ).join('\n');
    return [
      `## ${label}`,
      `_${skills.length} result${skills.length !== 1 ? 's' : ''}_`,
      '',
      '| # | Name | Source |',
      '|---|------|--------|',
      rows,
    ].join('\n');
  }

  // Pretty
  const lines = [
    '',
    chalk.bold(`  ${label}`) + chalk.gray(`  ${skills.length} results`),
    '',
  ];

  const maxName = Math.max(...skills.map(s => s.name.length), 4);
  const maxSrc  = Math.max(...skills.map(s => s.source.length), 6);

  lines.push(
    chalk.gray(`  ${'#'.padEnd(3)} ${'Name'.padEnd(maxName + 2)} ${'Source'.padEnd(maxSrc + 2)}`)
  );
  lines.push(chalk.gray('  ' + '─'.repeat(maxName + maxSrc + 12)));

  skills.forEach((s, i) => {
    const num   = chalk.gray(String(i + 1).padEnd(3));
    const name  = chalk.cyan(s.name.padEnd(maxName + 2));
    const src   = chalk.white(s.source.padEnd(maxSrc + 2));
    lines.push(`  ${num} ${name} ${src}`);
  });
  lines.push('');

  return lines.join('\n');
}

// ─── Skill detail ─────────────────────────────────────────────────────────────

export function formatSkillDetail(
  detail: SkillDetail,
  format: OutputFormat,
  opts: { metaOnly?: boolean } = {}
): string {
  const metaOnly = opts.metaOnly ?? false;

  if (format === 'json') {
    return JSON.stringify(metaOnly ? {
      ...detail,
      content: undefined,
    } : detail, null, 2);
  }

  if (format === 'md') {
    const { security: sec } = detail;
    const platforms = detail.platforms.length > 0
      ? detail.platforms.map(p => `| ${p.platform} | ${p.count} |`).join('\n')
      : '| — | — |';

    return [
      `## ${detail.name}`,
      '',
      `- **Source:** \`${detail.source}\``,
      detail.weeklyInstalls ? `- **Weekly:** ${detail.weeklyInstalls}/week` : '',
      detail.firstSeen ? `- **First Seen:** ${detail.firstSeen}` : '',
      '',
      '### Security Audits',
      '',
      `| Auditor | Status |`,
      `|---------|--------|`,
      `| Gen Agent Trust Hub | ${securityBadgeMd(sec.gen_agent_trust_hub)} |`,
      `| Socket              | ${securityBadgeMd(sec.socket)} |`,
      `| Snyk                | ${securityBadgeMd(sec.snyk)} |`,
      `| **Overall**         | ${securityBadgeMd(sec.overall)} |`,
      '',
      '### Installed On',
      '',
      '| Platform | Installs |',
      '|----------|----------|',
      platforms,
      '',
      '### Links',
      '',
      `- skills.sh: ${detail.url}`,
      `- GitHub: ${detail.githubUrl}`,
      '',
      '### Install',
      '',
      `\`\`\`bash`,
      detail.installCmd,
      `\`\`\``,
      !metaOnly && detail.content ? '' : '',
      !metaOnly && detail.content ? '### SKILL.md' : '',
      !metaOnly && detail.content ? '' : '',
      !metaOnly && detail.content ? '```text' : '',
      !metaOnly && detail.content ? detail.content : '',
      !metaOnly && detail.content ? '```' : '',
    ].filter(l => l !== null).join('\n');
  }

  // Pretty
  const { security: sec } = detail;
  const lines = [''];

  lines.push(chalk.bold.cyan(`  ${detail.name}`));
  lines.push(chalk.gray(`  ${detail.source}`));
  lines.push('');

  // Stats row
  const stats: string[] = [];
  if (detail.weeklyInstalls) stats.push(chalk.yellow(`${detail.weeklyInstalls}/week`));
  if (detail.firstSeen) stats.push(chalk.gray(`First seen: ${detail.firstSeen}`));
  lines.push(`  ${chalk.white('Weekly')}     ${stats.join(chalk.gray('  ·  '))}`);
  lines.push('');

  // Security
  lines.push(`  ${chalk.bold('Security')}  ${overallBadgePretty(sec.overall)}`);
  lines.push(`  ${chalk.gray('├')} Gen Agent Trust Hub  ${securityBadgePretty(sec.gen_agent_trust_hub)}`);
  lines.push(`  ${chalk.gray('├')} Socket               ${securityBadgePretty(sec.socket)}`);
  lines.push(`  ${chalk.gray('└')} Snyk                 ${securityBadgePretty(sec.snyk)}`);
  lines.push('');

  // Platforms
  if (detail.platforms.length > 0) {
    lines.push(`  ${chalk.bold('Installed on')}`);
    for (const p of detail.platforms) {
      lines.push(`  ${chalk.gray('·')} ${p.platform.padEnd(20)} ${chalk.yellow(p.count)}`);
    }
    lines.push('');
  }

  // Links
  lines.push(`  ${chalk.gray('skills.sh')}  ${chalk.blue(detail.url)}`);
  lines.push(`  ${chalk.gray('GitHub')}     ${chalk.blue(detail.githubUrl)}`);
  lines.push(`  ${chalk.bold('Install')}    ${chalk.green(detail.installCmd)}`);
  lines.push('');

  if (!metaOnly && detail.content) {
    lines.push(`  ${chalk.bold('SKILL.md')}`);
    lines.push('');
    for (const line of detail.content.split('\n')) {
      lines.push(line.length > 0 ? `  ${line}` : '');
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Compare ──────────────────────────────────────────────────────────────────

export function formatCompare(details: SkillDetail[], format: OutputFormat): string {
  if (format === 'json') {
    return JSON.stringify({
      comparison: details.map(({ installs, installCmd, ...detail }) => detail),
    }, null, 2);
  }

  if (format === 'md') {
    const [a, b] = details;
    const row = (label: string, va: string, vb: string) =>
      `| ${label} | ${va} | ${vb} |`;

    return [
      '## Comparison',
      '',
      `| | \`${a.skillId}\` | \`${b.skillId}\` |`,
      '|---|---|---|',
      row('Source', `\`${a.source}\``, `\`${b.source}\``),
      row('Weekly', a.weeklyInstalls ?? '—', b.weeklyInstalls ?? '—'),
      row('First Seen', a.firstSeen ?? '—', b.firstSeen ?? '—'),
      row('Security Overall', securityBadgeMd(a.security.overall), securityBadgeMd(b.security.overall)),
      row('Gen Agent Trust Hub', securityBadgeMd(a.security.gen_agent_trust_hub), securityBadgeMd(b.security.gen_agent_trust_hub)),
      row('Socket', securityBadgeMd(a.security.socket), securityBadgeMd(b.security.socket)),
      row('Snyk', securityBadgeMd(a.security.snyk), securityBadgeMd(b.security.snyk)),
    ].join('\n');
  }

  // Pretty side-by-side
  const [a, b] = details;
  const lines = ['', chalk.bold('  Comparison'), ''];

  const col = 36;
  const label = (s: string) => chalk.gray(s.padEnd(20));
  const divider = chalk.gray('  ' + '─'.repeat(col * 2 + 6));

  // Header
  lines.push(
    '  ' + ' '.repeat(20) +
    chalk.bold.cyan(a.skillId.padEnd(col)) +
    chalk.bold.cyan(b.skillId)
  );
  lines.push(divider);

  const row = (lbl: string, va: string, vb: string) =>
    `  ${label(lbl)} ${va.padEnd(col)} ${vb}`;

  lines.push(row('Source', chalk.white(a.source), chalk.white(b.source)));
  lines.push(row('Weekly',
    chalk.yellow(a.weeklyInstalls ?? '—'),
    chalk.yellow(b.weeklyInstalls ?? '—')
  ));
  lines.push(row('First Seen',
    chalk.gray(a.firstSeen ?? '—'),
    chalk.gray(b.firstSeen ?? '—')
  ));
  lines.push('');

  // Security
  lines.push(row('Security Overall',
    overallBadgePretty(a.security.overall),
    overallBadgePretty(b.security.overall)
  ));
  lines.push(row('Gen Trust Hub',
    securityBadgePretty(a.security.gen_agent_trust_hub),
    securityBadgePretty(b.security.gen_agent_trust_hub)
  ));
  lines.push(row('Socket',
    securityBadgePretty(a.security.socket),
    securityBadgePretty(b.security.socket)
  ));
  lines.push(row('Snyk',
    securityBadgePretty(a.security.snyk),
    securityBadgePretty(b.security.snyk)
  ));
  lines.push('');

  return lines.join('\n');
}

// ─── Popular list ─────────────────────────────────────────────────────────────

export function formatPopular(skills: Skill[], format: OutputFormat): string {
  if (format === 'json') {
    return JSON.stringify({ count: skills.length, skills }, null, 2);
  }

  if (format === 'md') {
    const rows = skills.map((s, i) =>
      `| ${i + 1} | \`${s.name}\` | \`${s.source}\` |`
    ).join('\n');
    return [
      '## Popular Skills',
      '',
      '| # | Name | Source |',
      '|---|------|--------|',
      rows,
    ].join('\n');
  }

  // Pretty — reuse search formatter
  return formatSearchResults(skills, 'popular', format);
}
