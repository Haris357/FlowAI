'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import FlowBooksLogo from '@/components/FlowBooksLogo';
import {
  OVERALL_STATUS_LABELS,
  COMPONENT_STATUS_LABELS,
  INCIDENT_STATUS_LABELS,
  MAINTENANCE_STATUS_LABELS,
  STATUS_COLORS,
  groupIncidentsByDate,
  formatStatusDate,
  formatStatusTime,
  timeAgo,
  type StatusPageData,
  type StatusComponent,
  type StatusIncident,
  type ComponentStatus,
} from '@/lib/status-page';

// ── Helpers ──────────────────────────────────────────────────────────────────

function groupComponents(components: StatusComponent[]): { group: string; components: StatusComponent[] }[] {
  const map = new Map<string, StatusComponent[]>();
  for (const comp of components) {
    const list = map.get(comp.group) ?? [];
    list.push(comp);
    map.set(comp.group, list);
  }
  return Array.from(map.entries()).map(([group, comps]) => ({ group, components: comps }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ComponentStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      {status !== 'operational' && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${colors.dot} opacity-60`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colors.dot}`} />
    </span>
  );
}

function UptimeBars({
  history,
  uptime,
}: {
  history: { date: string; status: ComponentStatus }[];
  uptime: number;
}) {
  const [tooltip, setTooltip] = useState<{ date: string; status: ComponentStatus; x: number } | null>(null);

  return (
    <div className="mt-3">
      <div className="flex gap-px h-7 items-end">
        {history.map((day, i) => {
          const colors = STATUS_COLORS[day.status];
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm cursor-default transition-opacity hover:opacity-80 ${colors.bar}`}
              style={{ minWidth: 2, height: '100%' }}
              onMouseEnter={e => {
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setTooltip({ date: day.date, status: day.status, x: rect.left });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          );
        })}
      </div>
      <div className="flex justify-between items-center mt-1.5">
        <span className="text-xs text-gray-400 dark:text-gray-500">90 days ago</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {uptime.toFixed(1)}% uptime
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">Today</span>
      </div>
      {tooltip && (
        <div className="fixed z-50 pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1.5 shadow-lg -translate-y-full -translate-x-1/2 mt-[-8px]"
          style={{ left: tooltip.x }}>
          <div className="font-medium">{tooltip.date}</div>
          <div className="text-gray-300">{COMPONENT_STATUS_LABELS[tooltip.status]}</div>
        </div>
      )}
    </div>
  );
}

function ComponentGroup({
  group,
  components,
  uptimeHistory,
}: {
  group: string;
  components: StatusComponent[];
  uptimeHistory: StatusPageData['uptimeHistory'];
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      {/* Group header */}
      <button
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{group}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {components.map(comp => {
            const colors   = STATUS_COLORS[comp.status];
            const upData   = uptimeHistory[comp.id];
            return (
              <div key={comp.id} className="px-5 py-4 bg-white dark:bg-gray-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <StatusDot status={comp.status} />
                    <div>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {comp.name}
                      </span>
                      {comp.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{comp.description}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                    {COMPONENT_STATUS_LABELS[comp.status]}
                  </span>
                </div>
                {upData && (
                  <UptimeBars history={upData.history} uptime={upData.uptime} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IncidentCard({ incident, components }: { incident: StatusIncident; components: StatusComponent[] }) {
  const [open, setOpen] = useState(incident.status !== 'resolved');
  const impactColors = STATUS_COLORS[
    ({ none: 'operational', minor: 'degraded', major: 'partial_outage', critical: 'major_outage' } as const)[incident.impact]
  ];
  const affectedNames = incident.affectedComponents
    .map(id => components.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${impactColors.bg} ${impactColors.text}`}>
                {incident.impact.toUpperCase()}
              </span>
              {incident.status !== 'resolved' && (
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide animate-pulse">
                  {INCIDENT_STATUS_LABELS[incident.status]}
                </span>
              )}
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{incident.title}</h3>
            </div>
            {affectedNames && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Affects: {affectedNames}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {timeAgo(incident.createdAt)}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
          <div className="relative ml-3 mt-4">
            {/* Timeline line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
            {[...incident.updates].reverse().map((update, i) => (
              <div key={update.id} className="relative pl-6 pb-5 last:pb-0">
                <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600 border-2 border-white dark:border-gray-950" />
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {INCIDENT_STATUS_LABELS[update.status]}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {formatStatusTime(update.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {update.message}
                </p>
              </div>
            ))}
          </div>
          {incident.resolvedAt && (
            <div className="mt-3 text-xs text-green-600 dark:text-green-400 font-medium">
              Resolved at {formatStatusTime(incident.resolvedAt)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubscribeForm() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/status/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
        You&apos;re subscribed! We&apos;ll notify you of any incidents.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2 flex-wrap">
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="flex-1 min-w-48 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        {loading ? 'Subscribing…' : 'Subscribe'}
      </button>
      {error && <p className="w-full text-xs text-red-500">{error}</p>}
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const [data, setData]       = useState<StatusPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  const overallStatus   = data?.status ?? 'operational';
  const overallColors   = STATUS_COLORS[overallStatus];
  const groups          = data ? groupComponents(data.components) : [];
  const activeIncidents = data?.incidents.filter(i => i.status !== 'resolved') ?? [];
  const upcomingMaint   = data?.maintenances.filter(m => m.status !== 'completed') ?? [];
  const pastGroups      = data ? groupIncidentsByDate(
    data.incidents.filter(i => i.status === 'resolved'),
  ) : [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <FlowBooksLogo size="sm" />
            </Link>
            <span className="text-gray-300 dark:text-gray-700 select-none">/</span>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status</span>
          </div>
          {data && (
            <div className="flex items-center gap-2">
              <StatusDot status={overallStatus} />
              <span className={`text-sm font-medium ${overallColors.text}`}>
                {OVERALL_STATUS_LABELS[overallStatus]}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* ── Overall status banner ───────────────────────────────────────── */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-8 animate-pulse bg-gray-50 dark:bg-gray-900" />
        ) : error ? (
          <div className="rounded-2xl border border-red-200 dark:border-red-900 p-8 bg-red-50 dark:bg-red-950/30 text-center">
            <p className="text-red-600 dark:text-red-400 font-medium">Failed to load status data.</p>
            <button onClick={fetchData} className="mt-2 text-sm text-red-500 underline">Retry</button>
          </div>
        ) : (
          <div className={`rounded-2xl border p-8 ${overallColors.border} ${overallColors.bg} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${overallColors.dot}`}>
                {overallStatus === 'operational' ? (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${overallColors.text}`}>
                  {OVERALL_STATUS_LABELS[overallStatus]}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Last updated {timeAgo(data!.updatedAt)}
                </p>
              </div>
            </div>
            {activeIncidents.length > 0 && (
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-3 py-1.5 rounded-full">
                {activeIncidents.length} active incident{activeIncidents.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* ── Active incidents ────────────────────────────────────────────── */}
        {activeIncidents.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Active Incidents
            </h2>
            <div className="space-y-3">
              {activeIncidents.map(inc => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  components={data!.components}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Upcoming maintenance ────────────────────────────────────────── */}
        {upcomingMaint.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Scheduled Maintenance
            </h2>
            <div className="space-y-3">
              {upcomingMaint.map(m => {
                const affectedNames = m.affectedComponents
                  .map(id => data!.components.find(c => c.id === id)?.name)
                  .filter(Boolean)
                  .join(', ');
                return (
                  <div
                    key={m.id}
                    className="border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4 bg-blue-50 dark:bg-blue-950/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                            {MAINTENANCE_STATUS_LABELS[m.status]}
                          </span>
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{m.title}</h3>
                        </div>
                        {m.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">{m.description}</p>
                        )}
                        {affectedNames && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Affects: {affectedNames}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatStatusTime(m.scheduledStart)} — {formatStatusTime(m.scheduledEnd)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Components ──────────────────────────────────────────────────── */}
        {groups.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
              System Components
            </h2>
            <div className="space-y-3">
              {groups.map(g => (
                <ComponentGroup
                  key={g.group}
                  group={g.group}
                  components={g.components}
                  uptimeHistory={data!.uptimeHistory}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Past incidents ───────────────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Past Incidents
          </h2>
          {pastGroups.length === 0 ? (
            <div className="space-y-px">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return (
                  <div key={i} className="py-3.5 border-b border-gray-100 dark:border-gray-800/50 flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatStatusDate(d.toISOString())}</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">No incidents reported</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {pastGroups.slice(0, 30).map(group => (
                <div key={group.date}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                    {formatStatusDate(group.date)}
                  </h3>
                  <div className="space-y-2">
                    {group.incidents.map(inc => (
                      <IncidentCard key={inc.id} incident={inc} components={data!.components} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Subscribe ───────────────────────────────────────────────────── */}
        <section className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-start gap-3 mb-4">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subscribe to Updates</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Get notified by email when we create, update, or resolve an incident.
              </p>
            </div>
          </div>
          <SubscribeForm />
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2">
            <FlowBooksLogo size="xs" className="opacity-60" />
            <span>FlowBooks AI Status</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              flowbooksai.com
            </Link>
            <a
              href="/api/status"
              target="_blank"
              rel="noreferrer"
              className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              JSON API
            </a>
            <Link href="/contact" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
