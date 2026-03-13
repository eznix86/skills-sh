export type OutputFormat = 'pretty' | 'json' | 'md';

export interface Skill {
  id: string;
  skillId: string;
  name: string;
  installs: number;
  source: string;
}

export interface SearchResponse {
  query: string;
  searchType: string;
  skills: Skill[];
  count: number;
  duration_ms: number;
}

export type AuditStatus = 'pass' | 'warn' | 'fail' | 'unknown';

export interface SecurityAudit {
  gen_agent_trust_hub: AuditStatus;
  socket: AuditStatus;
  snyk: AuditStatus;
  overall: AuditStatus;
}

export interface PlatformInstall {
  platform: string;
  count: string;
}

export interface SkillDetail {
  name: string;
  source: string;
  skillId: string;
  installs: number | null;
  weeklyInstalls: string | null;
  firstSeen: string | null;
  platforms: PlatformInstall[];
  security: SecurityAudit;
  url: string;
  githubUrl: string;
  installCmd: string;
  content: string | null;
}
