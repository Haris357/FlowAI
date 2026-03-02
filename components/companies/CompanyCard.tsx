'use client';
import {
  Card, CardContent, Stack, Typography, Box, Avatar, Chip,
  IconButton, Dropdown, MenuButton, Menu, MenuItem, Divider, Grid,
} from '@mui/joy';
import {
  MoreVertical, Lock, Users as UsersIcon, Download, Trash2,
  ArrowRight, Shield, Calendar, DollarSign, Briefcase, TrendingUp,
} from 'lucide-react';

export interface CompanyData {
  id: string;
  name: string;
  businessType: string;
  country: string;
  currency: string;
  ownerId: string;
  createdAt: any;
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
  viewMode: 'grid' | 'list' | 'table' | 'compact';
  onSelect: (company: CompanyData) => void;
  onOpenSecurity: (company: CompanyData, e: React.MouseEvent) => void;
  onOpenUsers: (company: CompanyData, e: React.MouseEvent) => void;
  onBackup: (companyId: string, companyName: string) => void;
  onDelete: (companyId: string, companyName: string) => void;
  index?: number;
}

function CompanyMenu({ company, onSelect, onOpenSecurity, onOpenUsers, onBackup, onDelete }: Omit<CompanyCardProps, 'viewMode' | 'index'>) {
  return (
    <Dropdown>
      <MenuButton
        slots={{ root: IconButton }}
        slotProps={{ root: { variant: 'plain', size: 'sm' } }}
        onClick={(e) => e.stopPropagation()}
      >
        <MoreVertical size={16} />
      </MenuButton>
      <Menu placement="bottom-end" sx={{ zIndex: 1100, minWidth: 160 }}>
        <MenuItem onClick={(e) => { e.stopPropagation(); onSelect(company); }}>
          <ArrowRight size={14} /> Open
        </MenuItem>
        <MenuItem onClick={(e) => onOpenSecurity(company, e)}>
          <Shield size={14} /> Security
        </MenuItem>
        <MenuItem onClick={(e) => onOpenUsers(company, e)}>
          <UsersIcon size={14} /> Collaborators
        </MenuItem>
        <MenuItem onClick={(e) => { e.stopPropagation(); onBackup(company.id, company.name); }}>
          <Download size={14} /> Backup
        </MenuItem>
        <Divider />
        <MenuItem color="danger" onClick={(e) => { e.stopPropagation(); onDelete(company.id, company.name); }}>
          <Trash2 size={14} /> Delete
        </MenuItem>
      </Menu>
    </Dropdown>
  );
}

/* Decorative background elements — cycle through based on index */
const DECORATIONS = [
  // Mini bar chart
  (
    <Box sx={{ position: 'absolute', bottom: 12, right: 12, opacity: 0.08, pointerEvents: 'none' }}>
      <svg width="100" height="60" viewBox="0 0 100 60">
        <rect x="2" y="35" width="10" height="25" rx="2" fill="currentColor" />
        <rect x="16" y="20" width="10" height="40" rx="2" fill="currentColor" />
        <rect x="30" y="28" width="10" height="32" rx="2" fill="currentColor" />
        <rect x="44" y="10" width="10" height="50" rx="2" fill="currentColor" />
        <rect x="58" y="18" width="10" height="42" rx="2" fill="currentColor" />
        <rect x="72" y="5" width="10" height="55" rx="2" fill="currentColor" />
        <rect x="86" y="12" width="10" height="48" rx="2" fill="currentColor" />
      </svg>
    </Box>
  ),
  // Dots grid
  (
    <Box sx={{ position: 'absolute', bottom: 12, right: 12, opacity: 0.06, pointerEvents: 'none' }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        {[0, 1, 2, 3, 4].map(r =>
          [0, 1, 2, 3, 4].map(c => (
            <circle key={`${r}-${c}`} cx={8 + c * 16} cy={8 + r * 16} r="3" fill="currentColor" />
          ))
        )}
      </svg>
    </Box>
  ),
  // Trending line
  (
    <Box sx={{ position: 'absolute', bottom: 12, right: 12, opacity: 0.08, pointerEvents: 'none' }}>
      <svg width="100" height="50" viewBox="0 0 100 50">
        <polyline points="0,45 15,38 30,42 45,25 60,30 75,15 90,8 100,12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="0,45 15,38 30,42 45,25 60,30 75,15 90,8 100,12 100,50 0,50" fill="currentColor" opacity="0.3" />
      </svg>
    </Box>
  ),
  // Currency symbols
  (
    <Box sx={{ position: 'absolute', bottom: 8, right: 8, opacity: 0.06, pointerEvents: 'none' }}>
      <svg width="90" height="70" viewBox="0 0 90 70">
        <text x="5" y="25" fontSize="22" fontWeight="bold" fill="currentColor">$</text>
        <text x="35" y="40" fontSize="18" fontWeight="bold" fill="currentColor">€</text>
        <text x="60" y="22" fontSize="20" fontWeight="bold" fill="currentColor">£</text>
        <text x="20" y="58" fontSize="16" fontWeight="bold" fill="currentColor">¥</text>
        <text x="55" y="60" fontSize="22" fontWeight="bold" fill="currentColor">$</text>
      </svg>
    </Box>
  ),
  // Connection nodes
  (
    <Box sx={{ position: 'absolute', bottom: 12, right: 12, opacity: 0.08, pointerEvents: 'none' }}>
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
    </Box>
  ),
  // Receipt sketch
  (
    <Box sx={{ position: 'absolute', bottom: 8, right: 10, opacity: 0.07, pointerEvents: 'none' }}>
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
    </Box>
  ),
];

export default function CompanyCard(props: CompanyCardProps) {
  const { company, viewMode, onSelect, index = 0 } = props;
  const decoration = DECORATIONS[index % DECORATIONS.length];

  if (viewMode === 'compact') {
    return (
      <Card
        variant="plain"
        sx={{
          cursor: 'pointer', height: '100%', position: 'relative', overflow: 'hidden',
          background: 'var(--joy-palette-background-surface)',
          backdropFilter: 'blur(16px) saturate(150%)',
          border: '1px solid',
          borderColor: 'var(--joy-palette-divider)',
          borderRadius: '16px',
          transition: 'all 0.25s ease',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)', transform: 'translateY(-3px)', borderColor: 'primary.400' },
        }}
        onClick={() => onSelect(company)}
      >
        <CardContent sx={{ p: 2 }}>
          {decoration}
          <Stack spacing={1.5} sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Avatar size="sm" sx={{ background: 'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))', fontSize: '0.85rem' }}>
                {company.name.charAt(0)}
              </Avatar>
              <CompanyMenu {...props} />
            </Stack>
            <Box>
              <Typography level="title-sm" fontWeight={600} noWrap>{company.name}</Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{company.businessType}</Typography>
            </Box>
            <Stack direction="row" spacing={0.75}>
              <Chip size="sm" variant="soft" sx={{ fontSize: '10px' }}>{company.currency}</Chip>
              {company.hasPasscode && <Chip size="sm" variant="soft" color="warning" sx={{ fontSize: '10px' }}><Lock size={10} /></Chip>}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'list') {
    return (
      <Card
        variant="plain"
        sx={{
          cursor: 'pointer', position: 'relative', overflow: 'hidden',
          background: 'var(--joy-palette-background-surface)',
          backdropFilter: 'blur(16px) saturate(150%)',
          border: '1px solid',
          borderColor: 'var(--joy-palette-divider)',
          borderRadius: '14px',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.07)', borderColor: 'primary.400' },
        }}
        onClick={() => onSelect(company)}
      >
        <CardContent sx={{ p: 2 }}>
          {decoration}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <Avatar size="md" sx={{ background: 'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))' }}>
                {company.name.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography level="title-md" fontWeight={600} noWrap>{company.name}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                  <Chip size="sm" variant="soft" color="primary" sx={{ fontSize: '10px' }}>{company.businessType}</Chip>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{company.currency}</Typography>
                  {company.hasPasscode && <Chip size="sm" variant="soft" color="warning" sx={{ fontSize: '10px' }}><Lock size={10} /> Protected</Chip>}
                </Stack>
              </Box>
            </Stack>
            <CompanyMenu {...props} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card
      variant="plain"
      sx={{
        cursor: 'pointer', position: 'relative', overflow: 'hidden', height: '100%',
        background: 'var(--joy-palette-background-surface)',
        backdropFilter: 'blur(16px) saturate(150%)',
        border: '1px solid',
        borderColor: 'var(--joy-palette-divider)',
        borderRadius: '16px',
        transition: 'all 0.25s ease',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        '&:hover': {
          boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
          transform: 'translateY(-4px)',
          borderColor: 'primary.400',
          '&::before': { opacity: 1 },
        },
        '&::before': {
          content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
          opacity: 0, transition: 'opacity 0.25s ease',
        },
      }}
      onClick={() => onSelect(company)}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Decorative background */}
        {decoration}

        <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar size="md" sx={{
                background: 'linear-gradient(135deg, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
                boxShadow: '0 2px 8px rgba(217, 119, 87, 0.25)',
              }}>
                {company.name.charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography level="title-md" fontWeight={600} noWrap>{company.name}</Typography>
                <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{company.businessType}</Typography>
              </Box>
            </Stack>
            <CompanyMenu {...props} />
          </Stack>

          {/* Description */}
          {company.description && (
            <Typography level="body-xs" sx={{ color: 'text.secondary' }} noWrap>
              {company.description}
            </Typography>
          )}

          {/* Info row */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip size="sm" variant="soft" sx={{ fontSize: '10px' }}>{company.currency}</Chip>
            <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '10px' }}>{company.country}</Chip>
            {company.hasPasscode && (
              <Chip size="sm" variant="soft" color="warning" startDecorator={<Lock size={10} />} sx={{ fontSize: '10px' }}>Secured</Chip>
            )}
            {company.collaboratorEmails && company.collaboratorEmails.length > 0 && (
              <Chip size="sm" variant="soft" color="primary" startDecorator={<UsersIcon size={10} />} sx={{ fontSize: '10px' }}>
                {company.collaboratorEmails.length}
              </Chip>
            )}
          </Stack>

          {/* Footer */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.5, borderTop: '1px solid', borderColor: 'var(--joy-palette-divider)' }}>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              {company.createdAt?.toDate
                ? new Date(company.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : ''}
            </Typography>
            <IconButton size="sm" variant="soft" color="primary" sx={{ width: 28, height: 28, borderRadius: '50%' }}
              onClick={(e) => { e.stopPropagation(); onSelect(company); }}>
              <ArrowRight size={14} />
            </IconButton>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
