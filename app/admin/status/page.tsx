'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Card, CardContent, Chip, Button, Select, Option,
  Divider, Modal, ModalDialog, ModalClose, FormLabel, Textarea, Input,
  CircularProgress, Tooltip,
} from '@mui/joy';
import {
  Activity, CheckCircle, AlertTriangle, AlertCircle,
  Plus, RefreshCw, Clock, Wrench, Server, Trash2,
  Zap, Shield, Database, Mail, CreditCard, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminFetch } from '@/lib/admin-fetch';
import { adminCard } from '@/lib/admin-theme';
import {
  COMPONENT_STATUS_LABELS,
  INCIDENT_STATUS_LABELS,
  MAINTENANCE_STATUS_LABELS,
  IMPACT_LABELS,
  CHECK_METADATA,
  formatStatusTime,
  timeAgo,
  type StatusComponent,
  type StatusIncident,
  type StatusMaintenance,
  type ComponentStatus,
  type IncidentImpact,
  type IncidentStatus,
} from '@/lib/status-page';

// ── Colour helpers ────────────────────────────────────────────────────────────

function componentStatusColor(s: ComponentStatus): 'success' | 'warning' | 'danger' | 'neutral' | 'primary' {
  return (
    { operational: 'success', degraded: 'warning', partial_outage: 'warning', major_outage: 'danger', maintenance: 'primary' } as const
  )[s] ?? 'neutral';
}

function incidentStatusColor(s: IncidentStatus): 'warning' | 'primary' | 'success' | 'neutral' {
  return ({ investigating: 'warning', identified: 'primary', monitoring: 'primary', resolved: 'success' } as const)[s] ?? 'neutral';
}

function impactColor(i: IncidentImpact): 'neutral' | 'primary' | 'warning' | 'danger' {
  return ({ none: 'neutral', minor: 'primary', major: 'warning', critical: 'danger' } as const)[i] ?? 'neutral';
}

function checkKeyIcon(checkKey?: string) {
  const map: Record<string, React.ReactNode> = {
    'firestore':        <Database size={14} />,
    'firebase-auth':    <Shield size={14} />,
    'firebase-storage': <Database size={14} />,
    'openai':           <Zap size={14} />,
    'lemonsqueezy':     <CreditCard size={14} />,
    'resend':           <Mail size={14} />,
    'frankfurter':      <Globe size={14} />,
    'web-app':          <Globe size={14} />,
  };
  return checkKey ? (map[checkKey] ?? <Server size={14} />) : <Server size={14} />;
}

// ── Create Incident Modal ─────────────────────────────────────────────────────

function CreateIncidentModal({
  open, onClose, components, onCreated,
}: {
  open: boolean; onClose: () => void; components: StatusComponent[]; onCreated: () => void;
}) {
  const [title, setTitle]         = useState('');
  const [impact, setImpact]       = useState<IncidentImpact>('minor');
  const [message, setMessage]     = useState('');
  const [affected, setAffected]   = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);

  const submit = async () => {
    if (!title || !message) { toast.error('Title and message required'); return; }
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/status/incidents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, impact, message, affectedComponents: affected }),
      });
      if (!res.ok) throw new Error();
      toast.success('Incident created');
      onCreated(); onClose();
      setTitle(''); setMessage(''); setAffected([]); setImpact('minor');
    } catch { toast.error('Failed to create incident'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ width: 520, maxWidth: '95vw' }}>
        <ModalClose />
        <Typography level="title-lg">Create Manual Incident</Typography>
        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
          Use this for incidents not auto-detected by monitoring (e.g. third-party disruptions).
        </Typography>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={2}>
          <Box>
            <FormLabel>Title *</FormLabel>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief description of the issue" />
          </Box>
          <Box>
            <FormLabel>Impact</FormLabel>
            <Select value={impact} onChange={(_, v) => v && setImpact(v as IncidentImpact)}>
              {(['none', 'minor', 'major', 'critical'] as IncidentImpact[]).map(i => (
                <Option key={i} value={i}>{IMPACT_LABELS[i]}</Option>
              ))}
            </Select>
          </Box>
          <Box>
            <FormLabel>Affected Components</FormLabel>
            <Stack direction="row" flexWrap="wrap" gap={0.75} mt={0.5}>
              {components.map(c => (
                <Chip key={c.id} size="sm"
                  variant={affected.includes(c.id) ? 'solid' : 'outlined'}
                  color={affected.includes(c.id) ? 'primary' : 'neutral'}
                  onClick={() => setAffected(prev =>
                    prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                  sx={{ cursor: 'pointer' }}>{c.name}</Chip>
              ))}
            </Stack>
          </Box>
          <Box>
            <FormLabel>Initial Update *</FormLabel>
            <Textarea minRows={3} value={message} onChange={e => setMessage(e.target.value)}
              placeholder="We are investigating an issue with…" />
          </Box>
          <Button loading={loading} onClick={submit} color="danger">Create Incident</Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}

// ── Add Update Modal ──────────────────────────────────────────────────────────

function AddUpdateModal({
  incident, onClose, onUpdated,
}: { incident: StatusIncident | null; onClose: () => void; onUpdated: () => void; }) {
  const [status, setStatus]   = useState<IncidentStatus>('investigating');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (incident) setStatus(incident.status); }, [incident]);

  const submit = async () => {
    if (!incident || !message) { toast.error('Message required'); return; }
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/status/incidents/${incident.id}/updates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, message }),
      });
      if (!res.ok) throw new Error();
      toast.success('Update posted'); onUpdated(); onClose(); setMessage('');
    } catch { toast.error('Failed to post update'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={!!incident} onClose={onClose}>
      <ModalDialog sx={{ width: 480, maxWidth: '95vw' }}>
        <ModalClose />
        <Typography level="title-lg">Post Update</Typography>
        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>{incident?.title}</Typography>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={2}>
          <Box>
            <FormLabel>Status</FormLabel>
            <Select value={status} onChange={(_, v) => v && setStatus(v as IncidentStatus)}>
              {(['investigating', 'identified', 'monitoring', 'resolved'] as IncidentStatus[]).map(s => (
                <Option key={s} value={s}>{INCIDENT_STATUS_LABELS[s]}</Option>
              ))}
            </Select>
          </Box>
          <Box>
            <FormLabel>Message *</FormLabel>
            <Textarea minRows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Update message…" />
          </Box>
          <Button loading={loading} onClick={submit}
            color={status === 'resolved' ? 'success' : 'primary'}>
            {status === 'resolved' ? 'Resolve Incident' : 'Post Update'}
          </Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}

// ── Schedule Maintenance Modal ────────────────────────────────────────────────

function MaintenanceModal({
  open, onClose, components, onCreated,
}: { open: boolean; onClose: () => void; components: StatusComponent[]; onCreated: () => void; }) {
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [impact, setImpact]     = useState<IncidentImpact>('minor');
  const [affected, setAffected] = useState<string[]>([]);
  const [start, setStart]       = useState('');
  const [end, setEnd]           = useState('');
  const [loading, setLoading]   = useState(false);

  const submit = async () => {
    if (!title || !start || !end) { toast.error('Title and dates required'); return; }
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/status/maintenances', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, impact, affectedComponents: affected, scheduledStart: start, scheduledEnd: end }),
      });
      if (!res.ok) throw new Error();
      toast.success('Maintenance scheduled'); onCreated(); onClose();
      setTitle(''); setDesc(''); setAffected([]); setStart(''); setEnd('');
    } catch { toast.error('Failed to schedule maintenance'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ width: 520, maxWidth: '95vw' }}>
        <ModalClose />
        <Typography level="title-lg">Schedule Maintenance</Typography>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={2}>
          <Box>
            <FormLabel>Title *</FormLabel>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Maintenance window description" />
          </Box>
          <Box>
            <FormLabel>Description</FormLabel>
            <Textarea minRows={2} value={description} onChange={e => setDesc(e.target.value)} placeholder="What will be done…" />
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Box flex={1}>
              <FormLabel>Start *</FormLabel>
              <Input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
            </Box>
            <Box flex={1}>
              <FormLabel>End *</FormLabel>
              <Input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
            </Box>
          </Stack>
          <Box>
            <FormLabel>Affected Components</FormLabel>
            <Stack direction="row" flexWrap="wrap" gap={0.75} mt={0.5}>
              {components.map(c => (
                <Chip key={c.id} size="sm"
                  variant={affected.includes(c.id) ? 'solid' : 'outlined'}
                  color={affected.includes(c.id) ? 'primary' : 'neutral'}
                  onClick={() => setAffected(prev =>
                    prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                  sx={{ cursor: 'pointer' }}>{c.name}</Chip>
              ))}
            </Stack>
          </Box>
          <Button loading={loading} onClick={submit} color="primary">Schedule</Button>
        </Stack>
      </ModalDialog>
    </Modal>
  );
}

// ── Incident Row ──────────────────────────────────────────────────────────────

function IncidentRow({
  incident, components, onUpdate, onDelete,
}: { incident: StatusIncident; components: StatusComponent[]; onUpdate: (i: StatusIncident) => void; onDelete: (id: string) => void; }) {
  const [open, setOpen]   = useState(false);
  const [del, setDel]     = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this incident and all updates?')) return;
    setDel(true);
    try {
      await adminFetch(`/api/admin/status/incidents/${incident.id}`, { method: 'DELETE' });
      toast.success('Deleted'); onDelete(incident.id);
    } catch { toast.error('Failed to delete'); }
    finally { setDel(false); }
  };

  const affectedNames = incident.affectedComponents
    .map(id => components.find(c => c.id === id)?.name).filter(Boolean).join(', ');
  const isAuto = (incident as any).auto === true;

  return (
    <Card variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, py: 2, cursor: 'pointer', '&:hover': { bgcolor: 'background.level1' } }}
        onClick={() => setOpen(o => !o)}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5}>
          <Stack spacing={0.5} flex={1} minWidth={0}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip size="sm" color={impactColor(incident.impact)} variant="soft">
                {IMPACT_LABELS[incident.impact]}
              </Chip>
              <Chip size="sm" color={incidentStatusColor(incident.status)} variant="soft">
                {INCIDENT_STATUS_LABELS[incident.status]}
              </Chip>
              {isAuto && (
                <Chip size="sm" color="neutral" variant="outlined" startDecorator={<Activity size={10} />}>
                  Auto-detected
                </Chip>
              )}
              <Typography level="body-sm" fontWeight={600} noWrap>{incident.title}</Typography>
            </Stack>
            {affectedNames && (
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>Affects: {affectedNames}</Typography>
            )}
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              {formatStatusTime(incident.createdAt)}
              {incident.resolvedAt && ` → resolved ${formatStatusTime(incident.resolvedAt)}`}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
            {incident.status !== 'resolved' && (
              <Button size="sm" variant="soft" color="primary"
                onClick={e => { e.stopPropagation(); onUpdate(incident); }}>
                Update
              </Button>
            )}
            <Button size="sm" variant="plain" color="danger" loading={del}
              onClick={e => { e.stopPropagation(); handleDelete(); }}>
              <Trash2 size={14} />
            </Button>
          </Stack>
        </Stack>
      </Box>
      {open && incident.updates.length > 0 && (
        <>
          <Divider />
          <Box sx={{ px: 2.5, py: 2, bgcolor: 'background.level1' }}>
            <Stack spacing={1.5}>
              {[...incident.updates].reverse().map(u => (
                <Box key={u.id}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                    <Chip size="sm" color={incidentStatusColor(u.status)} variant="outlined">
                      {INCIDENT_STATUS_LABELS[u.status]}
                    </Chip>
                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                      {formatStatusTime(u.createdAt)}
                    </Typography>
                  </Stack>
                  <Typography level="body-sm">{u.message}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminStatusPage() {
  const [components, setComponents]     = useState<StatusComponent[]>([]);
  const [incidents, setIncidents]       = useState<StatusIncident[]>([]);
  const [maintenances, setMaintenances] = useState<StatusMaintenance[]>([]);
  const [loading, setLoading]           = useState(true);
  const [triggering, setTriggering]     = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [showMaint, setShowMaint]       = useState(false);
  const [updateTarget, setUpdateTarget] = useState<StatusIncident | null>(null);

  const load = useCallback(async () => {
    try {
      const [compRes, incRes, maintRes] = await Promise.all([
        adminFetch('/api/admin/status/components').then(r => r.json()),
        adminFetch('/api/admin/status/incidents').then(r => r.json()),
        adminFetch('/api/admin/status/maintenances').then(r => r.json()),
      ]);
      setComponents(compRes.components ?? []);
      setIncidents(incRes.incidents ?? []);
      setMaintenances(maintRes.maintenances ?? []);
    } catch { toast.error('Failed to load status data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Manually trigger the cron for immediate check
  const triggerCheck = async () => {
    setTriggering(true);
    try {
      const res = await adminFetch('/api/cron/status-check');
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Check complete in ${data.duration}ms`);
      await load();
    } catch { toast.error('Failed to trigger check'); }
    finally { setTriggering(false); }
  };

  const deleteMaintenance = async (id: string) => {
    if (!confirm('Delete this maintenance window?')) return;
    try {
      await adminFetch(`/api/admin/status/maintenances/${id}`, { method: 'DELETE' });
      setMaintenances(prev => prev.filter(m => m.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const updateMaintenanceStatus = async (id: string, status: string) => {
    try {
      await adminFetch(`/api/admin/status/maintenances/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setMaintenances(prev => prev.map(m => m.id === id ? { ...m, status: status as any } : m));
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const pastIncidents   = incidents.filter(i => i.status === 'resolved');
  const upcomingMaint   = maintenances.filter(m => m.status !== 'completed');
  const operationalCount = components.filter(c => c.status === 'operational').length;

  const groups = Array.from(
    components.reduce((map, c) => {
      map.set(c.group, [...(map.get(c.group) ?? []), c]);
      return map;
    }, new Map<string, StatusComponent[]>()).entries(),
  );

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 960, mx: 'auto' }}>
      <Stack spacing={4}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography level="h3" fontWeight={700}>Status Page</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              All monitoring is fully automated — runs every 5 minutes via cron.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button size="sm" variant="outlined" color="neutral"
              startDecorator={<RefreshCw size={14} />} onClick={load} loading={loading && !triggering}>
              Refresh
            </Button>
            <Button size="sm" variant="soft" color="primary"
              startDecorator={<Activity size={14} />} onClick={triggerCheck} loading={triggering}>
              Run Check Now
            </Button>
            <Button size="sm" component="a" href="/status" target="_blank"
              variant="outlined" color="neutral" startDecorator={<Globe size={14} />}>
              Public Page
            </Button>
          </Stack>
        </Stack>

        {/* Summary cards */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {[
            {
              icon: <Server size={18} />, label: 'Components',
              value: loading ? '—' : `${operationalCount} / ${components.length}`,
              sub: 'operational', color: operationalCount === components.length && !loading ? 'success' as const : 'warning' as const,
            },
            {
              icon: <AlertTriangle size={18} />, label: 'Active Incidents',
              value: loading ? '—' : String(activeIncidents.length),
              sub: activeIncidents.length === 0 ? 'all clear' : `${activeIncidents.length} open`,
              color: activeIncidents.length > 0 ? 'danger' as const : 'success' as const,
            },
            {
              icon: <Wrench size={18} />, label: 'Maintenance',
              value: loading ? '—' : String(upcomingMaint.length),
              sub: upcomingMaint.length === 0 ? 'none scheduled' : 'scheduled',
              color: 'neutral' as const,
            },
            {
              icon: <Clock size={18} />, label: 'Check Interval',
              value: 'Every 5 min',
              sub: 'Vercel cron', color: 'primary' as const,
            },
          ].map(item => (
            <Card key={item.label} sx={{ ...adminCard as object, flex: 1 }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                  <Box sx={{ color: `${item.color}.500` }}>{item.icon}</Box>
                  <Typography level="body-sm" fontWeight={600}>{item.label}</Typography>
                </Stack>
                <Typography level="h3" fontWeight={700}>{item.value}</Typography>
                <Chip size="sm" color={item.color} variant="soft" sx={{ mt: 0.5 }}>{item.sub}</Chip>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {/* Components — read-only, auto-monitored */}
        <Card sx={{ ...adminCard as object }}>
          <CardContent sx={{ p: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center"
              sx={{ px: 3, pt: 2.5, pb: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{
                  width: 36, height: 36, borderRadius: 'md', bgcolor: 'success.softBg',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Activity size={16} style={{ color: 'var(--joy-palette-success-500)' }} />
                </Box>
                <Box>
                  <Typography level="title-md" fontWeight={700}>Live Component Status</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    Auto-monitored every 5 min — statuses update automatically
                  </Typography>
                </Box>
              </Stack>
              <Chip size="sm" color="success" variant="soft" startDecorator={<Zap size={10} />}>
                Fully Automated
              </Chip>
            </Stack>
            <Divider />
            {loading ? (
              <Box sx={{ p: 3 }}><CircularProgress size="sm" /></Box>
            ) : (
              <Box>
                {groups.map(([group, comps]) => (
                  <Box key={group}>
                    <Box sx={{ px: 3, py: 1.25, bgcolor: 'background.level1' }}>
                      <Typography level="body-xs" fontWeight={700}
                        sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {group}
                      </Typography>
                    </Box>
                    {comps.map((comp, i) => {
                      const meta = comp.checkKey ? CHECK_METADATA[comp.checkKey] : null;
                      return (
                        <Box key={comp.id}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between"
                            sx={{ px: 3, py: 1.75 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Box sx={{ color: 'text.tertiary' }}>
                                {checkKeyIcon(comp.checkKey)}
                              </Box>
                              <Box>
                                <Typography level="body-sm" fontWeight={600}>{comp.name}</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {comp.checkKey && (
                                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                      {meta?.label ?? comp.checkKey}
                                    </Typography>
                                  )}
                                  {comp.lastCheckedAt && (
                                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                      · checked {timeAgo(comp.lastCheckedAt)}
                                    </Typography>
                                  )}
                                  {comp.lastLatencyMs != null && (
                                    <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                                      · {comp.lastLatencyMs}ms
                                    </Typography>
                                  )}
                                </Stack>
                              </Box>
                            </Stack>
                            <Chip
                              size="sm"
                              color={componentStatusColor(comp.status)}
                              variant="soft"
                              startDecorator={
                                <Box sx={{
                                  width: 6, height: 6, borderRadius: '50%',
                                  bgcolor: `${componentStatusColor(comp.status)}.500`,
                                }} />
                              }
                            >
                              {COMPONENT_STATUS_LABELS[comp.status]}
                            </Chip>
                          </Stack>
                          {i < comps.length - 1 && <Divider />}
                        </Box>
                      );
                    })}
                    <Divider />
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Incidents */}
        <Card sx={{ ...adminCard as object }}>
          <CardContent sx={{ p: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center"
              sx={{ px: 3, pt: 2.5, pb: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{
                  width: 36, height: 36, borderRadius: 'md', bgcolor: 'danger.softBg',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertCircle size={16} style={{ color: 'var(--joy-palette-danger-500)' }} />
                </Box>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography level="title-md" fontWeight={700}>Incidents</Typography>
                    {activeIncidents.length > 0 && (
                      <Chip size="sm" color="danger" variant="solid">{activeIncidents.length} active</Chip>
                    )}
                  </Stack>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    Auto-detected by monitoring · manually add extra context or resolve manually
                  </Typography>
                </Box>
              </Stack>
              <Button size="sm" color="danger" variant="soft"
                startDecorator={<Plus size={14} />} onClick={() => setShowCreate(true)}>
                Manual Incident
              </Button>
            </Stack>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {loading ? (
                <CircularProgress size="sm" />
              ) : activeIncidents.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <CheckCircle size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                  <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>No active incidents</Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {activeIncidents.map(inc => (
                    <IncidentRow key={inc.id} incident={inc} components={components}
                      onUpdate={setUpdateTarget}
                      onDelete={id => setIncidents(prev => prev.filter(i => i.id !== id))} />
                  ))}
                </Stack>
              )}
            </Box>
            {pastIncidents.length > 0 && (
              <>
                <Divider />
                <Box sx={{ px: 2.5, py: 2 }}>
                  <Typography level="body-xs" fontWeight={700}
                    sx={{ color: 'text.tertiary', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                    Past Incidents ({pastIncidents.length})
                  </Typography>
                  <Stack spacing={1}>
                    {pastIncidents.slice(0, 10).map(inc => (
                      <IncidentRow key={inc.id} incident={inc} components={components}
                        onUpdate={setUpdateTarget}
                        onDelete={id => setIncidents(prev => prev.filter(i => i.id !== id))} />
                    ))}
                  </Stack>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card sx={{ ...adminCard as object }}>
          <CardContent sx={{ p: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center"
              sx={{ px: 3, pt: 2.5, pb: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{
                  width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Wrench size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
                </Box>
                <Box>
                  <Typography level="title-md" fontWeight={700}>Scheduled Maintenance</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    Schedule upcoming maintenance windows to show on the public status page
                  </Typography>
                </Box>
              </Stack>
              <Button size="sm" color="primary" variant="soft"
                startDecorator={<Plus size={14} />} onClick={() => setShowMaint(true)}>
                Schedule
              </Button>
            </Stack>
            <Divider />
            <Box sx={{ p: 2.5 }}>
              {loading ? (
                <CircularProgress size="sm" />
              ) : maintenances.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Clock size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                  <Typography level="body-sm" sx={{ color: 'text.tertiary' }}>No maintenance windows</Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {maintenances.map(m => (
                    <Card key={m.id} variant="outlined" sx={{ p: 0 }}>
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between"
                        sx={{ px: 2.5, py: 2 }} spacing={2}>
                        <Box flex={1} minWidth={0}>
                          <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap">
                            <Chip size="sm"
                              color={m.status === 'completed' ? 'success' : m.status === 'in_progress' ? 'warning' : 'primary'}
                              variant="soft">
                              {MAINTENANCE_STATUS_LABELS[m.status as keyof typeof MAINTENANCE_STATUS_LABELS]}
                            </Chip>
                            <Typography level="body-sm" fontWeight={600}>{m.title}</Typography>
                          </Stack>
                          {m.description && (
                            <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{m.description}</Typography>
                          )}
                          <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                            {formatStatusTime(m.scheduledStart)} → {formatStatusTime(m.scheduledEnd)}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.75} flexShrink={0}>
                          {m.status === 'scheduled' && (
                            <Button size="sm" variant="soft" color="warning"
                              onClick={() => updateMaintenanceStatus(m.id, 'in_progress')}>Start</Button>
                          )}
                          {m.status === 'in_progress' && (
                            <Button size="sm" variant="soft" color="success"
                              onClick={() => updateMaintenanceStatus(m.id, 'completed')}>Complete</Button>
                          )}
                          <Button size="sm" variant="plain" color="danger"
                            onClick={() => deleteMaintenance(m.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </Stack>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </CardContent>
        </Card>
      </Stack>

      <CreateIncidentModal open={showCreate} onClose={() => setShowCreate(false)}
        components={components} onCreated={load} />
      <AddUpdateModal incident={updateTarget} onClose={() => setUpdateTarget(null)} onUpdated={load} />
      <MaintenanceModal open={showMaint} onClose={() => setShowMaint(false)}
        components={components} onCreated={load} />
    </Box>
  );
}
