'use client';
import {
  Card, CardContent, Stack, Typography, Box, Avatar, Chip,
  IconButton, Dropdown, MenuButton, Menu, MenuItem, Divider,
  CircularProgress,
} from '@mui/joy';
import {
  MoreVertical, Lock, Users as UsersIcon, Download, Trash2,
  ArrowRight, Shield,
} from 'lucide-react';
import type { CompanyRole } from '@/types';
import { ROLE_LABELS } from '@/lib/permissions';

export interface CompanyData {
  id: string;
  name: string;
  businessType: string;
  country: string;
  currency: string;
  ownerId: string;
  createdAt: any;
  updatedAt?: any;
  logo?: string;
  hasPasscode?: boolean;
  passcode?: string;
  collaborators?: string[];
  collaboratorEmails?: string[];
  email?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  fiscalYearStart?: number;
  hasInvoices?: boolean;
  hasEmployees?: boolean;
  tracksInventory?: boolean;
  invoicePrefix?: string;
  invoiceStartNumber?: number;
  description?: string;
  accountsCreated?: boolean;
}

interface CompanyCardProps {
  company: CompanyData;
  viewMode: 'grid' | 'list';
  /** When the user is a member (not owner), pass their role to surface a small badge. */
  role?: CompanyRole;
  /** This card is the one currently being opened — show a spinner overlay. */
  isLoading?: boolean;
  /** Some other card is currently being opened — block interaction with this one. */
  disabled?: boolean;
  onSelect: (company: CompanyData) => void;
  onOpenSecurity: (company: CompanyData, e: React.MouseEvent) => void;
  onOpenUsers: (company: CompanyData, e: React.MouseEvent) => void;
  onBackup: (companyId: string, companyName: string) => void;
  onDelete: (companyId: string, companyName: string) => void;
  index?: number;
}

function formatRelative(ts: any): string | null {
  const date = ts?.toDate ? ts.toDate() : null;
  if (!date) return null;
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.floor(day / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function CompanyMenu({ company, role, onSelect, onOpenSecurity, onOpenUsers, onBackup, onDelete }: Omit<CompanyCardProps, 'viewMode' | 'index' | 'isLoading' | 'disabled'>) {
  const isMember = !!role && role !== 'owner';
  return (
    <Dropdown>
      <MenuButton
        slots={{ root: IconButton }}
        slotProps={{ root: { variant: 'plain', size: 'sm', sx: { '--IconButton-size': '28px' } } }}
        onClick={(e) => e.stopPropagation()}
      >
        <MoreVertical size={15} />
      </MenuButton>
      <Menu placement="bottom-end" sx={{ zIndex: 1100, minWidth: 168 }}>
        <MenuItem onClick={(e) => { e.stopPropagation(); onSelect(company); }}>
          <ArrowRight size={14} /> Open
        </MenuItem>
        {!isMember && (
          <MenuItem onClick={(e) => onOpenSecurity(company, e)}>
            <Shield size={14} /> Security
          </MenuItem>
        )}
        <MenuItem onClick={(e) => onOpenUsers(company, e)}>
          <UsersIcon size={14} /> Team
        </MenuItem>
        {!isMember && (
          <MenuItem onClick={(e) => { e.stopPropagation(); onBackup(company.id, company.name); }}>
            <Download size={14} /> Backup
          </MenuItem>
        )}
        {!isMember && <Divider />}
        {!isMember && (
          <MenuItem color="danger" onClick={(e) => { e.stopPropagation(); onDelete(company.id, company.name); }}>
            <Trash2 size={14} /> Delete
          </MenuItem>
        )}
      </Menu>
    </Dropdown>
  );
}

/* Decorative background elements — cycle through based on index.
   Sit behind the card content at low opacity so the card has visual character
   without overpowering the data. */
const DECORATIONS = [
  // Mini bar chart
  (
    <svg width="100" height="60" viewBox="0 0 100 60">
      <rect x="2" y="35" width="10" height="25" rx="2" fill="currentColor" />
      <rect x="16" y="20" width="10" height="40" rx="2" fill="currentColor" />
      <rect x="30" y="28" width="10" height="32" rx="2" fill="currentColor" />
      <rect x="44" y="10" width="10" height="50" rx="2" fill="currentColor" />
      <rect x="58" y="18" width="10" height="42" rx="2" fill="currentColor" />
      <rect x="72" y="5" width="10" height="55" rx="2" fill="currentColor" />
      <rect x="86" y="12" width="10" height="48" rx="2" fill="currentColor" />
    </svg>
  ),
  // Dots grid
  (
    <svg width="80" height="80" viewBox="0 0 80 80">
      {[0, 1, 2, 3, 4].map(r =>
        [0, 1, 2, 3, 4].map(c => (
          <circle key={`${r}-${c}`} cx={8 + c * 16} cy={8 + r * 16} r="3" fill="currentColor" />
        ))
      )}
    </svg>
  ),
  // Trending line
  (
    <svg width="100" height="50" viewBox="0 0 100 50">
      <polyline points="0,45 15,38 30,42 45,25 60,30 75,15 90,8 100,12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="0,45 15,38 30,42 45,25 60,30 75,15 90,8 100,12 100,50 0,50" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  // Currency symbols
  (
    <svg width="90" height="70" viewBox="0 0 90 70">
      <text x="5" y="25" fontSize="22" fontWeight="bold" fill="currentColor">$</text>
      <text x="35" y="40" fontSize="18" fontWeight="bold" fill="currentColor">€</text>
      <text x="60" y="22" fontSize="20" fontWeight="bold" fill="currentColor">£</text>
      <text x="20" y="58" fontSize="16" fontWeight="bold" fill="currentColor">¥</text>
      <text x="55" y="60" fontSize="22" fontWeight="bold" fill="currentColor">$</text>
    </svg>
  ),
  // Connection nodes
  (
    <svg width="90" height="50" viewBox="0 0 90 50">
      <circle cx="10" cy="25" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="16" y1="25" x2="34" y2="25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="40" cy="25" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="46" y1="25" x2="64" y2="25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="70" cy="25" r="6" fill="currentColor" opacity="0.4" />
      <line x1="40" y1="19" x2="40" y2="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="40" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="40" y1="31" x2="40" y2="42" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="40" cy="45" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  // Receipt sketch
  (
    <svg width="60" height="80" viewBox="0 0 60 80">
      <rect x="5" y="2" width="50" height="70" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="14" x2="38" y2="14" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="24" x2="48" y2="24" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="32" x2="44" y2="32" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="40" x2="40" y2="40" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="52" x2="20" y2="52" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      <line x1="30" y1="52" x2="48" y2="52" stroke="currentColor" strokeWidth="2" />
      <line x1="30" y1="60" x2="48" y2="60" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  ),
];

const cardBaseSx = {
  cursor: 'pointer',
  position: 'relative' as const,
  overflow: 'hidden',
  background: 'var(--joy-palette-background-surface)',
  border: '1px solid',
  borderColor: 'var(--joy-palette-divider)',
  transition: 'border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease',
  boxShadow: 'none',
  '&:hover': {
    borderColor: 'var(--joy-palette-primary-300)',
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 28px rgba(0,0,0,0.06)',
    '& .company-card-arrow': {
      transform: 'translateX(2px)',
      color: 'var(--joy-palette-primary-500)',
    },
    '& .company-card-decoration': {
      opacity: 0.14,
    },
  },
};

/* Loading-state overlay shown while this company is opening. */
function LoadingOverlay({ name }: { name: string }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
        bgcolor: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        '[data-joy-color-scheme="dark"] &': {
          bgcolor: 'rgba(26,25,21,0.72)',
        },
      }}
    >
      <CircularProgress
        size="sm"
        sx={{
          '--CircularProgress-size': '28px',
          '--CircularProgress-trackThickness': '3px',
          '--CircularProgress-progressThickness': '3px',
          color: 'var(--joy-palette-primary-500)',
        }}
      />
      <Typography
        level="body-xs"
        sx={{ color: 'text.secondary', fontWeight: 500, letterSpacing: '0.01em' }}
      >
        Opening {name}…
      </Typography>
    </Box>
  );
}

export default function CompanyCard(props: CompanyCardProps) {
  const { company, viewMode, role, isLoading, disabled, index = 0, onSelect } = props;
  const isMember = !!role && role !== 'owner';
  const updated = formatRelative(company.updatedAt) || formatRelative(company.createdAt);
  const subtitleParts = [company.businessType, company.currency, company.country].filter(Boolean);
  const decoration = DECORATIONS[index % DECORATIONS.length];

  /* When another card is loading, dim this one and disable hover/click. */
  const blockedSx = disabled && !isLoading
    ? { opacity: 0.45, pointerEvents: 'none' as const, transform: 'none', boxShadow: 'none' }
    : null;
  const loadingBorderSx = isLoading
    ? { borderColor: 'var(--joy-palette-primary-400)', boxShadow: '0 0 0 3px rgba(217,119,87,0.12)' }
    : null;

  const handleClick = () => {
    if (disabled || isLoading) return;
    onSelect(company);
  };

  if (viewMode === 'list') {
    return (
      <Card
        variant="plain"
        sx={{
          ...cardBaseSx,
          borderRadius: '14px',
          ...(blockedSx || {}),
          ...(loadingBorderSx || {}),
        }}
        onClick={handleClick}
      >
        <CardContent sx={{ p: 2.25, position: 'relative', zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2.25}>
            <Avatar
              size="md"
              sx={{
                width: 44, height: 44,
                background: 'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                fontWeight: 600,
              }}
            >
              {company.name.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                <Typography level="title-md" fontWeight={600} noWrap sx={{ minWidth: 0 }}>
                  {company.name}
                </Typography>
                {company.hasPasscode && (
                  <Lock size={13} style={{ color: 'var(--joy-palette-warning-500)', flexShrink: 0 }} />
                )}
                {isMember && role && (
                  <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '10px', '--Chip-minHeight': '20px' }}>
                    {ROLE_LABELS[role]}
                  </Chip>
                )}
              </Stack>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
                {subtitleParts.join(' · ')}
              </Typography>
            </Box>
            {updated && (
              <Typography level="body-xs" sx={{ color: 'text.tertiary', flexShrink: 0, display: { xs: 'none', sm: 'block' } }}>
                {updated}
              </Typography>
            )}
            <CompanyMenu {...props} />
          </Stack>
        </CardContent>
        {isLoading && <LoadingOverlay name={company.name} />}
      </Card>
    );
  }

  // Grid (default) — editorial hero card
  return (
    <Card
      variant="plain"
      sx={{
        ...cardBaseSx,
        height: '100%',
        borderRadius: '14px',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
          opacity: 0,
          transition: 'opacity 0.2s ease',
        },
        '&:hover::before': { opacity: 1 },
        ...(blockedSx || {}),
        ...(loadingBorderSx || {}),
      }}
      onClick={handleClick}
    >
      {/* Decorative background — sits behind content, dimmer than content */}
      <Box
        className="company-card-decoration"
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          opacity: 0.08,
          pointerEvents: 'none',
          color: 'var(--joy-palette-primary-500)',
          transition: 'opacity 0.25s ease',
          zIndex: 0,
        }}
      >
        {decoration}
      </Box>

      <CardContent sx={{ p: 2.25, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <Stack spacing={1.5} sx={{ flex: 1 }}>
          {/* Header: avatar + role + menu */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Avatar
              sx={{
                width: 38, height: 38,
                background: 'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                fontSize: '0.92rem', fontWeight: 600,
                boxShadow: '0 4px 12px rgba(217, 119, 87, 0.2)',
              }}
            >
              {company.name.charAt(0)}
            </Avatar>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {isMember && role && (
                <Chip
                  size="sm"
                  variant="outlined"
                  color="neutral"
                  sx={{ fontSize: '9.5px', fontWeight: 500, '--Chip-minHeight': '20px' }}
                >
                  {ROLE_LABELS[role]}
                </Chip>
              )}
              {company.hasPasscode && (
                <Lock size={12} style={{ color: 'var(--joy-palette-warning-500)' }} />
              )}
              <CompanyMenu {...props} />
            </Stack>
          </Stack>

          {/* Title + subtitle */}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              fontWeight={600}
              sx={{ fontSize: '1rem', lineHeight: 1.2, letterSpacing: '-0.005em' }}
              noWrap
            >
              {company.name}
            </Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.25 }} noWrap>
              {subtitleParts.join(' · ')}
            </Typography>
          </Box>

          {/* Description */}
          {company.description ? (
            <Typography
              level="body-xs"
              sx={{
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
              }}
            >
              {company.description}
            </Typography>
          ) : (
            <Typography level="body-xs" sx={{ color: 'text.tertiary', fontStyle: 'italic' }}>
              No description
            </Typography>
          )}
        </Stack>

        {/* Footer: timestamp + open arrow */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            mt: 1.5, pt: 1.25,
            borderTop: '1px solid',
            borderColor: 'var(--joy-palette-divider)',
          }}
        >
          <Typography level="body-xs" sx={{ color: 'text.tertiary', fontSize: '11px' }}>
            {updated ? `Updated ${updated}` : ''}
          </Typography>
          <Box
            className="company-card-arrow"
            sx={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'text.tertiary',
              transition: 'transform 0.18s ease, color 0.18s ease',
            }}
          >
            <ArrowRight size={14} />
          </Box>
        </Stack>
      </CardContent>

      {isLoading && <LoadingOverlay name={company.name} />}
    </Card>
  );
}
