import { parse } from 'node-html-parser';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import type { Skill, SearchResponse, SkillDetail, SecurityAudit, PlatformInstall } from './types.js';

const API_BASE = 'https://skills.sh/api';
const HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'skills-sh-cli/1.0.0',
};

const nhm = new NodeHtmlMarkdown({
  codeBlockStyle: 'fenced',
  bulletMarker: '-',
  strongDelimiter: '**',
  textReplace: [
    [/\n{3,}/g, '\n\n'],
  ],
});

export async function searchSkills(query: string, limit = 20): Promise<SearchResponse> {
  const url = `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Search failed: HTTP ${res.status}`);
  return res.json() as Promise<SearchResponse>;
}

export type SearchCategory = 'trending' | 'hot';

export async function fetchCategory(category: SearchCategory, limit = 20): Promise<Skill[]> {
  return fetchSkillsPage(category, limit);
}

export async function fetchSkillDetail(owner: string, repo: string, skillId: string): Promise<SkillDetail> {
  const skillUrl = `https://skills.sh/${owner}/${repo}/${skillId}`;
  const githubUrl = `https://github.com/${owner}/${repo}`;
  const installCmd = `npx skills add ${githubUrl} --skill ${skillId}`;

  let detail: SkillDetail = {
    name: skillId,
    source: `${owner}/${repo}`,
    skillId,
    installs: null,
    weeklyInstalls: null,
    firstSeen: null,
    platforms: [],
    security: { gen_agent_trust_hub: 'unknown', socket: 'unknown', snyk: 'unknown', overall: 'unknown' },
    url: skillUrl,
    githubUrl,
    installCmd,
    content: null,
  };

  // Try undocumented JSON API first
  try {
    const jsonUrl = `${API_BASE}/skills/${owner}/${repo}/${skillId}`;
    const res = await fetch(jsonUrl, { headers: HEADERS });
    if (res.ok) {
      const data = await res.json() as Record<string, unknown>;
      if (data && typeof data === 'object') {
        detail = mergeJsonDetail(detail, data);
      }
    }
  } catch { /* fall through to scrape */ }

  // Fetch HTML as the source of truth for page content and fallback metadata.
  const res = await fetch(skillUrl, {
    headers: { 'Accept': 'text/html', 'User-Agent': 'skills-sh-cli/1.0.0' },
  });
  if (!res.ok) throw new Error(`Could not fetch skill page: HTTP ${res.status}`);

  const html = await res.text();
  return scrapeSkillDetail(detail, html);
}

function mergeJsonDetail(base: SkillDetail, data: Record<string, unknown>): SkillDetail {
  return {
    ...base,
    installs: typeof data.installs === 'number' ? data.installs : base.installs,
    weeklyInstalls: typeof data.weeklyInstalls === 'string' ? data.weeklyInstalls : base.weeklyInstalls,
    firstSeen: typeof data.firstSeen === 'string' ? data.firstSeen : base.firstSeen,
    platforms: Array.isArray(data.platforms) ? data.platforms as PlatformInstall[] : base.platforms,
    security: typeof data.security === 'object' && data.security !== null
      ? data.security as SecurityAudit
      : base.security,
  };
}

function scrapeSkillDetail(base: SkillDetail, html: string): SkillDetail {
  const root = parse(html);
  const text = root.text;

  // Total installs from search-style match
  const installsMatch = text.match(/(\d[\d,]+)\s*(?:total\s*)?installs/i);
  const installs = installsMatch ? parseInt(installsMatch[1].replace(/,/g, ''), 10) : null;

  // Weekly installs / first seen from sidebar stat blocks
  const weeklyInstalls = extractLabeledValue(root, 'Weekly Installs') ?? extractWeeklyFromText(text);

  const firstSeen = extractLabeledValue(root, 'First Seen') ?? extractFirstSeenFromText(text);

  // Security audits — look for Pass/Fail/Warn next to auditor names
  const security = extractSecurity(html, text);

  // Platform installs — platform name followed by install count like 3.9K
  const platforms = extractPlatforms(html);

  // Skill body rendered from SKILL.md
  const content = extractSkillContent(html, root);

  return {
    ...base,
    installs: installs ?? base.installs,
    weeklyInstalls: weeklyInstalls ?? base.weeklyInstalls,
    firstSeen: firstSeen ?? base.firstSeen,
    platforms: platforms.length > 0 ? platforms : base.platforms,
    security,
    content: content ?? base.content,
  };
}

function extractLabeledValue(root: ReturnType<typeof parse>, label: string): string | null {
  const normalizedLabel = normalizeText(label);

  for (const block of root.querySelectorAll('div.bg-background')) {
    const text = normalizeText(block.text);
    if (!text.startsWith(normalizedLabel)) continue;

    const value = text.slice(normalizedLabel.length).trim();
    if (value) return value;
  }

  return null;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function extractSkillContent(html: string, root: ReturnType<typeof parse>): string | null {
  const proseHtml = extractProseHtml(html);
  if (proseHtml) {
    const markdown = nhm.translate(proseHtml).trim();
    if (markdown) return markdown;
  }

  const prose = root.querySelector('div.prose');
  if (!prose) return null;

  const content = prose.structuredText
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return content.length > 0 ? content : null;
}

function extractProseHtml(html: string): string | null {
  const match = html.match(/<div class="prose[^\"]*">([\s\S]*?)<\/div><\/div><\/div><div class="\s*lg:col-span-3">/);
  return match?.[1]?.trim() || null;
}

function extractWeeklyFromText(text: string): string | null {
  const m = text.match(/(\d+\.?\d*[KkMm])\s*Weekly\s+[Ii]nstalls/i);
  return m ? m[1] : null;
}

function extractFirstSeenFromText(text: string): string | null {
  const m = text.match(/First\s+Seen\s+([A-Za-z]{3}\s+\d{1,2},?\s*\d{4})/i);
  return m ? m[1].trim() : null;
}

function extractSecurity(html: string, text: string): SecurityAudit {
  const lower = html.toLowerCase();

  function auditStatus(name: string): 'pass' | 'fail' | 'warn' | 'unknown' {
    // Find the auditor name block and look for Pass/Warn/Fail near it
    const idx = lower.indexOf(name.toLowerCase());
    if (idx === -1) return 'unknown';
    const window = html.slice(idx, idx + 200).toLowerCase();
    if (window.includes('pass')) return 'pass';
    if (window.includes('warn')) return 'warn';
    if (window.includes('fail')) return 'fail';
    return 'unknown';
  }

  // Also try plain text pattern: "PassGen Agent Trust Hub"
  function textStatus(label: string): 'pass' | 'fail' | 'warn' | 'unknown' {
    const pattern = new RegExp(`(pass|fail|warn)\\s*${label}`, 'i');
    const m = text.match(pattern);
    if (m) return m[1].toLowerCase() as 'pass' | 'fail' | 'warn';
    return auditStatus(label);
  }

  const gen = textStatus('Gen Agent Trust Hub');
  const socket = textStatus('Socket');
  const snyk = textStatus('Snyk');

  // Overall: worst of the three
  const rank = (s: string) => s === 'fail' ? 2 : s === 'warn' ? 1 : s === 'pass' ? 0 : -1;
  const worst = [gen, socket, snyk].reduce((a, b) => rank(a) >= rank(b) ? a : b);
  const overall = worst === 'unknown' ? 'unknown' : worst;

  return { gen_agent_trust_hub: gen, socket, snyk, overall };
}

function extractPlatforms(html: string): PlatformInstall[] {
  const root = parse(html);
  const platforms: PlatformInstall[] = [];
  const seen = new Set<string>();

  const knownPlatforms = [
    'opencode', 'codex', 'gemini', 'claude', 'copilot',
    'amp', 'kimi', 'cursor', 'windsurf', 'antigravity',
    'github-copilot', 'gemini-cli', 'kimi-cli', 'claude-code',
  ];

  // Walk all text nodes looking for platform + count pairs
  const allText = root.querySelectorAll('span, div, p');
  for (const el of allText) {
    const t = el.text.trim().toLowerCase();
    if (knownPlatforms.some(p => t === p || t.startsWith(p)) && !seen.has(t)) {
      // Look at next sibling or parent's next child for the count
      const next = el.nextElementSibling;
      if (next) {
        const countText = next.text.trim();
        if (/^\d+\.?\d*[KkMm]?$/.test(countText)) {
          seen.add(t);
          platforms.push({ platform: el.text.trim(), count: countText });
          continue;
        }
      }
      // Try to extract count from same element's text
      const combined = el.parentNode?.text ?? '';
      const countMatch = combined.match(new RegExp(
        el.text.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') +
        '\\s*(\\d+\\.?\\d*[KkMm]?)', 'i'
      ));
      if (countMatch) {
        seen.add(t);
        platforms.push({ platform: el.text.trim(), count: countMatch[1] });
      }
    }
  }

  return platforms;
}

export async function fetchPopular(limit = 20): Promise<Skill[]> {
  // No public JSON API — use multiple short search queries to approximate
  const terms = ['vercel', 'react', 'typescript', 'python', 'go', 'ai', 'api', 'css', 'test', 'sql'];
  const seen = new Set<string>();
  const all: Skill[] = [];

  for (const term of terms) {
    try {
      const data = await searchSkills(term, 50);
      for (const s of data.skills) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          all.push(s);
        }
      }
    } catch { /* skip failed terms */ }
  }

  return all.sort((a, b) => b.installs - a.installs).slice(0, limit);
}

async function fetchSkillsPage(path: 'trending' | 'hot', limit: number): Promise<Skill[]> {
  const res = await fetch(`https://skills.sh/${path}`, {
    headers: { 'Accept': 'text/html', 'User-Agent': 'skills-sh-cli/1.0.0' },
  });
  if (!res.ok) throw new Error(`Could not fetch ${path} page: HTTP ${res.status}`);

  const html = await res.text();
  const matches = html.match(/href="\/([^"\s]+)\/([^"\s]+)\/([^"\s]+)"/g) ?? [];
  const seen = new Set<string>();
  const skills: Skill[] = [];

  for (const match of matches) {
    const parts = match.match(/href="\/([^"\s]+)\/([^"\s]+)\/([^"\s]+)"/);
    if (!parts) continue;

    const [, owner, repo, skillId] = parts;
    if (owner.startsWith('_next')) continue;

    const id = `${owner}/${repo}/${skillId}`;
    if (seen.has(id)) continue;
    seen.add(id);

    skills.push({
      id,
      skillId,
      name: skillId,
      installs: 0,
      source: `${owner}/${repo}`,
    });

    if (skills.length >= limit) break;
  }

  return skills;
}
