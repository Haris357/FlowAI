/**
 * FlowBooks AI Status Page
 * Types, helpers, and uptime computation for the public status system.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ComponentStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'maintenance';

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type IncidentImpact = 'none' | 'minor' | 'major' | 'critical';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed';

export interface StatusComponent {
  id: string;
  name: string;
  description?: string;
  group: string;
  status: ComponentStatus;
  order: number;
  /** Maps to a health-check function in the monitoring cron */
  checkKey?: string;
  /** Last recorded latency in ms */
  lastLatencyMs?: number;
  /** Last checked timestamp */
  lastCheckedAt?: string;
  createdAt: string; // ISO string (serialisable across RSC → client)
  updatedAt: string;
}

export interface IncidentUpdate {
  id: string;
  status: IncidentStatus;
  message: string;
  createdAt: string;
}

export interface StatusIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  affectedComponents: string[]; // component IDs
  createdAt: string;
  resolvedAt: string | null;
  updatedAt: string;
  updates: IncidentUpdate[];
}

export interface StatusMaintenance {
  id: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  impact: IncidentImpact;
  affectedComponents: string[];
  scheduledStart: string;
  scheduledEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface DayStatus {
  date: string; // YYYY-MM-DD
  status: ComponentStatus;
}

export interface ComponentUptimeData {
  history: DayStatus[]; // 90 entries, oldest → newest
  uptime: number;       // percentage with 1 decimal
}

export interface StatusPageData {
  status: ComponentStatus;
  components: StatusComponent[];
  incidents: StatusIncident[];
  maintenances: StatusMaintenance[];
  uptimeHistory: Record<string, ComponentUptimeData>;
  updatedAt: string;
}

// ── Labels ───────────────────────────────────────────────────────────────────

export const OVERALL_STATUS_LABELS: Record<ComponentStatus, string> = {
  operational:    'All Systems Operational',
  degraded:       'Minor Service Issues',
  partial_outage: 'Partial System Outage',
  major_outage:   'Major System Outage',
  maintenance:    'Scheduled Maintenance',
};

export const COMPONENT_STATUS_LABELS: Record<ComponentStatus, string> = {
  operational:    'Operational',
  degraded:       'Degraded Performance',
  partial_outage: 'Partial Outage',
  major_outage:   'Major Outage',
  maintenance:    'Under Maintenance',
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  investigating: 'Investigating',
  identified:    'Identified',
  monitoring:    'Monitoring',
  resolved:      'Resolved',
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  scheduled:   'Scheduled',
  in_progress: 'In Progress',
  completed:   'Completed',
};

export const IMPACT_LABELS: Record<IncidentImpact, string> = {
  none:     'None',
  minor:    'Minor',
  major:    'Major',
  critical: 'Critical',
};

// ── Tailwind colour maps ─────────────────────────────────────────────────────

export const STATUS_COLORS: Record<
  ComponentStatus,
  { bg: string; text: string; dot: string; bar: string; border: string }
> = {
  operational: {
    bg:     'bg-green-50 dark:bg-green-950/30',
    text:   'text-green-700 dark:text-green-400',
    dot:    'bg-green-500',
    bar:    'bg-green-500',
    border: 'border-green-200 dark:border-green-800',
  },
  degraded: {
    bg:     'bg-yellow-50 dark:bg-yellow-950/30',
    text:   'text-yellow-700 dark:text-yellow-400',
    dot:    'bg-yellow-500',
    bar:    'bg-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  partial_outage: {
    bg:     'bg-orange-50 dark:bg-orange-950/30',
    text:   'text-orange-700 dark:text-orange-400',
    dot:    'bg-orange-500',
    bar:    'bg-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  major_outage: {
    bg:     'bg-red-50 dark:bg-red-950/30',
    text:   'text-red-700 dark:text-red-400',
    dot:    'bg-red-500',
    bar:    'bg-red-500',
    border: 'border-red-200 dark:border-red-800',
  },
  maintenance: {
    bg:     'bg-blue-50 dark:bg-blue-950/30',
    text:   'text-blue-700 dark:text-blue-400',
    dot:    'bg-blue-500',
    bar:    'bg-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getOverallStatus(
  components: Pick<StatusComponent, 'status'>[],
): ComponentStatus {
  if (components.some(c => c.status === 'major_outage'))   return 'major_outage';
  if (components.some(c => c.status === 'partial_outage')) return 'partial_outage';
  if (components.some(c => c.status === 'degraded'))       return 'degraded';
  if (components.some(c => c.status === 'maintenance'))    return 'maintenance';
  return 'operational';
}

export function impactToStatus(impact: IncidentImpact): ComponentStatus {
  return (
    {
      none:     'operational',
      minor:    'degraded',
      major:    'partial_outage',
      critical: 'major_outage',
    } satisfies Record<IncidentImpact, ComponentStatus>
  )[impact];
}

/** Compute 90-day uptime history for a component from incident records. */
export function computeUptimeHistory(
  componentId: string,
  incidents: Pick<StatusIncident, 'affectedComponents' | 'impact' | 'createdAt' | 'resolvedAt'>[],
  days = 90,
): DayStatus[] {
  const result: DayStatus[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - i);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const affecting = incidents.filter(inc => {
      if (!inc.affectedComponents.includes(componentId)) return false;
      const start = new Date(inc.createdAt);
      const end   = inc.resolvedAt ? new Date(inc.resolvedAt) : new Date();
      return start <= dayEnd && end >= dayStart;
    });

    const statusRank: Record<ComponentStatus, number> = {
      operational: 0, maintenance: 0, degraded: 1, partial_outage: 2, major_outage: 3,
    };
    let worstRank = 0;
    let worstStatus: ComponentStatus = 'operational';
    for (const inc of affecting) {
      const s    = impactToStatus(inc.impact);
      const rank = statusRank[s];
      if (rank > worstRank) { worstRank = rank; worstStatus = s; }
      if (worstRank === 3) break;
    }

    result.push({ date: dayStart.toISOString().split('T')[0], status: worstStatus });
  }

  return result;
}

export function computeUptimePercentage(history: DayStatus[]): number {
  if (!history.length) return 100;
  const good = history.filter(d => d.status === 'operational' || d.status === 'maintenance').length;
  return Math.round((good / history.length) * 1000) / 10;
}

/** Group incidents by calendar date (descending) for the "Past Incidents" section. */
export function groupIncidentsByDate(
  incidents: StatusIncident[],
): { date: string; incidents: StatusIncident[] }[] {
  const map = new Map<string, StatusIncident[]>();

  for (const inc of incidents) {
    const date = inc.createdAt.split('T')[0];
    const existing = map.get(date) ?? [];
    existing.push(inc);
    map.set(date, existing);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, list]) => ({ date, list }))
    .map(({ date, list }) => ({ date, incidents: list }));
}

export function formatStatusDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}

export function formatStatusTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

// ── Default component seed data ──────────────────────────────────────────────

export const DEFAULT_COMPONENT_GROUPS: {
  group: string;
  components: { name: string; description: string; checkKey: string }[];
}[] = [
  {
    group: 'Core Platform',
    components: [
      { name: 'Web Application',  description: 'Main web interface and dashboard',    checkKey: 'web-app' },
      { name: 'API',              description: 'REST API endpoints',                  checkKey: 'web-app' },
      { name: 'Authentication',   description: 'User login and session management',   checkKey: 'firebase-auth' },
    ],
  },
  {
    group: 'AI Features',
    components: [
      { name: 'AI Assistant',        description: 'Natural language accounting AI',       checkKey: 'openai' },
      { name: 'Document Processing', description: 'Invoice and document AI parsing',      checkKey: 'openai' },
      { name: 'AI Reports',          description: 'Intelligent financial insights',        checkKey: 'openai' },
    ],
  },
  {
    group: 'Integrations',
    components: [
      { name: 'Payments',       description: 'Subscription and billing processing',    checkKey: 'lemonsqueezy' },
      { name: 'Email Delivery', description: 'Transactional email notifications',      checkKey: 'resend' },
      { name: 'File Storage',   description: 'Document and attachment storage',        checkKey: 'firebase-storage' },
      { name: 'Exchange Rates', description: 'Currency conversion and exchange rates', checkKey: 'frankfurter' },
    ],
  },
  {
    group: 'Infrastructure',
    components: [
      { name: 'Database', description: 'Firestore data persistence layer',    checkKey: 'firestore' },
      { name: 'CDN',      description: 'Vercel edge network and static assets', checkKey: 'web-app' },
    ],
  },
];

// ── Check key metadata (used by cron + admin UI) ─────────────────────────────

export const CHECK_METADATA: Record<string, {
  label: string;
  impact: IncidentImpact;
  incidentTitle: string;
  recoveryMessage: string;
}> = {
  'firestore': {
    label:           'Firestore Database',
    impact:          'critical',
    incidentTitle:   'Database connectivity issues',
    recoveryMessage: 'Database connectivity has been restored. All services are operating normally.',
  },
  'firebase-auth': {
    label:           'Firebase Authentication',
    impact:          'critical',
    incidentTitle:   'Authentication service disruption',
    recoveryMessage: 'Authentication service has fully recovered.',
  },
  'firebase-storage': {
    label:           'Firebase Storage',
    impact:          'major',
    incidentTitle:   'File storage service degraded',
    recoveryMessage: 'File storage service has recovered. Uploads and downloads are working normally.',
  },
  'openai': {
    label:           'OpenAI API',
    impact:          'major',
    incidentTitle:   'AI features experiencing issues',
    recoveryMessage: 'AI features have been fully restored.',
  },
  'lemonsqueezy': {
    label:           'Lemon Squeezy Payments',
    impact:          'major',
    incidentTitle:   'Payment processing disruption',
    recoveryMessage: 'Payment processing has recovered. Subscriptions and checkouts are functioning normally.',
  },
  'resend': {
    label:           'Resend Email',
    impact:          'minor',
    incidentTitle:   'Email delivery delays',
    recoveryMessage: 'Email delivery has been restored.',
  },
  'frankfurter': {
    label:           'Frankfurter Exchange Rates',
    impact:          'minor',
    incidentTitle:   'Exchange rate service unavailable',
    recoveryMessage: 'Exchange rate data is being fetched normally again.',
  },
  'web-app': {
    label:           'Web Application',
    impact:          'critical',
    incidentTitle:   'Web application availability issues',
    recoveryMessage: 'The web application is fully accessible again.',
  },
};
