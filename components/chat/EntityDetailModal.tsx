'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Modal,
  ModalDialog,
  ModalClose,
  Typography,
  Box,
  Stack,
  Divider,
  Chip,
  Button,
  Sheet,
  Table,
} from '@mui/joy';
import {
  User,
  Building2,
  UserCheck,
  FileText,
  Receipt,
  CreditCard,
  Wallet,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Hash,
  ExternalLink,
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Tag,
  FileCheck,
  Clock,
  BookOpen,
} from 'lucide-react';

interface EntityDetailModalProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entity: Record<string, any> | null;
}

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined || amount === null) return '-';
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date: any) => {
  if (!date) return '-';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function EntityDetailModal({
  open,
  onClose,
  entityType,
  entity,
}: EntityDetailModalProps) {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  if (!entity) return null;

  // ==========================================
  // FIELD ROW COMPONENT
  // ==========================================
  const FieldRow = ({ icon, label, value, type }: { icon?: React.ReactNode; label: string; value: any; type?: string }) => {
    if (value === undefined || value === null || value === '') return null;
    let display = value;
    if (type === 'currency') display = formatCurrency(value);
    if (type === 'date') display = formatDate(value);
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
        {icon && <Box sx={{ color: 'text.tertiary', flexShrink: 0, width: 18, display: 'flex', justifyContent: 'center' }}>{icon}</Box>}
        <Typography level="body-sm" sx={{ color: 'text.secondary', minWidth: 100 }}>{label}</Typography>
        <Typography level="body-sm" fontWeight={500} sx={{ ml: 'auto', textAlign: 'right' }}>{display}</Typography>
      </Box>
    );
  };

  // ==========================================
  // TRANSACTION DETAILS
  // ==========================================
  const renderTransactionDetails = () => {
    const isExpense = entity.type === 'expense';
    const journalLines = entity.journalLines as { accountName: string; accountCode?: string; debit: number; credit: number }[] | undefined;
    return (
      <Stack spacing={0}>
        {/* Amount hero */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 3,
            mb: 1,
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: isExpense ? 'warning.softBg' : 'success.softBg',
              color: isExpense ? 'warning.plainColor' : 'success.plainColor',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 1.5,
            }}
          >
            {isExpense ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
          </Box>
          <Typography level="h2" fontWeight="lg" color={isExpense ? 'warning' : 'success'}>
            {isExpense ? '-' : '+'}{formatCurrency(entity.amount)}
          </Typography>
          <Chip
            size="sm"
            variant="soft"
            color={isExpense ? 'warning' : 'success'}
            sx={{ mt: 1, fontWeight: 600, fontSize: '11px' }}
          >
            {entity.type?.toUpperCase() || 'TRANSACTION'}
          </Chip>
        </Box>

        <Divider />

        {/* Details */}
        <Box sx={{ py: 0.5 }}>
          <FieldRow icon={<FileText size={15} />} label="Description" value={entity.description} />
          <FieldRow icon={<Tag size={15} />} label="Category" value={entity.category} />
          <FieldRow icon={<Calendar size={15} />} label="Date" value={entity.date} type="date" />
          <FieldRow icon={<CreditCard size={15} />} label="Payment" value={entity.paymentMethod?.replace(/_/g, ' ')} />
          {entity.reference && <FieldRow icon={<Hash size={15} />} label="Reference" value={entity.reference} />}
          {entity.customerName && <FieldRow icon={<User size={15} />} label="Customer" value={entity.customerName} />}
          {entity.vendorName && <FieldRow icon={<Building2 size={15} />} label="Vendor" value={entity.vendorName} />}
        </Box>

        {/* Accounting Impact / Journal Entry */}
        {journalLines && journalLines.length > 0 && (
          <>
            <Divider />
            <Box sx={{ py: 2 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.5 }}>
                <BookOpen size={14} style={{ opacity: 0.6 }} />
                <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Accounting Impact
                </Typography>
              </Stack>
              <Sheet
                variant="outlined"
                sx={{ borderRadius: 'md', overflow: 'hidden' }}
              >
                <Table size="sm" sx={{ '--TableCell-paddingY': '8px', '--TableCell-paddingX': '12px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}></th>
                      <th style={{ width: '45%' }}>Account</th>
                      <th style={{ width: '20%', textAlign: 'right' }}>Debit</th>
                      <th style={{ width: '20%', textAlign: 'right' }}>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalLines.map((line, i) => (
                      <tr key={i}>
                        <td>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={line.debit > 0 ? 'warning' : 'success'}
                            sx={{ fontSize: '10px', fontWeight: 700, '--Chip-paddingInline': '6px', height: 20 }}
                          >
                            {line.debit > 0 ? 'DR' : 'CR'}
                          </Chip>
                        </td>
                        <td>
                          <Typography level="body-xs">{line.accountName}</Typography>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Typography level="body-xs" fontWeight={line.debit > 0 ? 600 : 400} sx={{ color: line.debit > 0 ? 'text.primary' : 'text.tertiary' }}>
                            {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                          </Typography>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Typography level="body-xs" fontWeight={line.credit > 0 ? 600 : 400} sx={{ color: line.credit > 0 ? 'text.primary' : 'text.tertiary' }}>
                            {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                          </Typography>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Sheet>
            </Box>
          </>
        )}
      </Stack>
    );
  };

  // ==========================================
  // CUSTOMER DETAILS
  // ==========================================
  const renderCustomerDetails = () => (
    <Stack spacing={0}>
      {/* Name hero */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, mb: 1 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            bgcolor: 'primary.softBg',
            color: 'primary.softColor',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '20px',
          }}
        >
          {entity.name?.charAt(0)?.toUpperCase() || '?'}
        </Box>
        <Box>
          <Typography level="h4" fontWeight="lg">{entity.name}</Typography>
          {entity.city && <Typography level="body-sm" sx={{ color: 'text.secondary' }}>{[entity.city, entity.country].filter(Boolean).join(', ')}</Typography>}
        </Box>
      </Box>

      <Divider />

      <Box sx={{ py: 0.5 }}>
        <FieldRow icon={<Mail size={15} />} label="Email" value={entity.email} />
        <FieldRow icon={<Phone size={15} />} label="Phone" value={entity.phone} />
        <FieldRow icon={<MapPin size={15} />} label="Address" value={entity.address} />
        {entity.taxId && <FieldRow icon={<Hash size={15} />} label="Tax ID" value={entity.taxId} />}
        {!entity.email && !entity.phone && !entity.address && !entity.taxId && (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', fontStyle: 'italic' }}>
              No contact details available
            </Typography>
          </Box>
        )}
      </Box>

      {(entity.totalBilled !== undefined || entity.totalPaid !== undefined || entity.outstandingBalance !== undefined) && (
        <>
          <Divider />
          <Stack direction="row" spacing={2} sx={{ py: 2, justifyContent: 'space-around' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Billed</Typography>
              <Typography level="title-sm" fontWeight="lg">{formatCurrency(entity.totalBilled ?? 0)}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Paid</Typography>
              <Typography level="title-sm" fontWeight="lg" color="success">{formatCurrency(entity.totalPaid ?? 0)}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Outstanding</Typography>
              <Typography level="title-sm" fontWeight="lg" color="danger">{formatCurrency(entity.outstandingBalance ?? 0)}</Typography>
            </Box>
          </Stack>
        </>
      )}
    </Stack>
  );

  // ==========================================
  // VENDOR DETAILS
  // ==========================================
  const renderVendorDetails = () => (
    <Stack spacing={0}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, mb: 1 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 'lg',
            bgcolor: 'neutral.softBg',
            color: 'neutral.softColor',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Building2 size={24} />
        </Box>
        <Box>
          <Typography level="h4" fontWeight="lg">{entity.name}</Typography>
          {entity.paymentTerms && <Typography level="body-sm" sx={{ color: 'text.secondary' }}>{entity.paymentTerms}</Typography>}
        </Box>
      </Box>

      <Divider />

      <Box sx={{ py: 0.5 }}>
        <FieldRow icon={<Mail size={15} />} label="Email" value={entity.email} />
        <FieldRow icon={<Phone size={15} />} label="Phone" value={entity.phone} />
        <FieldRow icon={<MapPin size={15} />} label="Address" value={entity.address} />
      </Box>

      {(entity.totalBilled !== undefined || entity.outstandingBalance !== undefined) && (
        <>
          <Divider />
          <Stack direction="row" spacing={3} sx={{ py: 2, justifyContent: 'space-around' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Total Billed</Typography>
              <Typography level="title-sm" fontWeight="lg">{formatCurrency(entity.totalBilled ?? 0)}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.25 }}>Outstanding</Typography>
              <Typography level="title-sm" fontWeight="lg" color="danger">{formatCurrency(entity.outstandingBalance ?? 0)}</Typography>
            </Box>
          </Stack>
        </>
      )}
    </Stack>
  );

  // ==========================================
  // EMPLOYEE DETAILS
  // ==========================================
  const renderEmployeeDetails = () => (
    <Stack spacing={0}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, mb: 1 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            bgcolor: 'success.softBg',
            color: 'success.softColor',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '20px',
          }}
        >
          {entity.name?.charAt(0)?.toUpperCase() || '?'}
        </Box>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography level="h4" fontWeight="lg">{entity.name}</Typography>
            <Chip size="sm" variant="soft" color={entity.isActive !== false ? 'success' : 'neutral'}>
              {entity.isActive !== false ? 'Active' : 'Inactive'}
            </Chip>
          </Stack>
          <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
            {[entity.designation, entity.department].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ py: 0.5 }}>
        <FieldRow icon={<Mail size={15} />} label="Email" value={entity.email} />
        <FieldRow icon={<Phone size={15} />} label="Phone" value={entity.phone} />
        <FieldRow icon={<Briefcase size={15} />} label="Role" value={entity.designation} />
        <FieldRow icon={<Calendar size={15} />} label="Joined" value={entity.joiningDate} type="date" />
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Salary</Typography>
        <Typography level="h4" fontWeight="lg" color="primary">
          {formatCurrency(entity.salary)}
          <Typography level="body-xs" component="span" sx={{ color: 'text.tertiary' }}>
            /{entity.salaryType === 'annual' ? 'yr' : entity.salaryType === 'hourly' ? 'hr' : 'mo'}
          </Typography>
        </Typography>
      </Box>
    </Stack>
  );

  // ==========================================
  // INVOICE DETAILS
  // ==========================================
  const renderInvoiceDetails = () => {
    let subtotal = entity.subtotal || 0;
    let tax = entity.tax || 0;
    let total = entity.total || 0;

    if (entity.items && entity.items.length > 0 && subtotal === 0) {
      subtotal = entity.items.reduce((sum: number, item: any) =>
        sum + (item.amount || ((item.quantity || 1) * (item.rate || 0))), 0
      );
      tax = subtotal * ((entity.taxRate || 0) / 100);
      total = subtotal + tax - (entity.discount || 0);
    }

    const statusColor = entity.status === 'paid' ? 'success' : entity.status === 'overdue' ? 'danger' : entity.status === 'sent' ? 'primary' : 'neutral';

    return (
      <Stack spacing={0}>
        {/* Invoice header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', py: 2, mb: 1 }}>
          <Box>
            <Typography level="h3" fontWeight="lg">{entity.invoiceNumber || 'Draft'}</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.25 }}>
              {entity.customerName}
            </Typography>
          </Box>
          <Chip size="md" variant="soft" color={statusColor} sx={{ fontWeight: 600 }}>
            {entity.status?.toUpperCase() || 'DRAFT'}
          </Chip>
        </Box>

        <Divider />

        <Box sx={{ py: 0.5 }}>
          <FieldRow icon={<User size={15} />} label="Customer" value={entity.customerName} />
          <FieldRow icon={<Calendar size={15} />} label="Issued" value={entity.issueDate} type="date" />
          <FieldRow icon={<Clock size={15} />} label="Due" value={entity.dueDate} type="date" />
        </Box>

        {/* Line items */}
        {entity.items && entity.items.length > 0 && (
          <>
            <Divider />
            <Box sx={{ py: 2 }}>
              <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
                Line Items
              </Typography>
              <Sheet variant="outlined" sx={{ borderRadius: 'sm', overflow: 'hidden' }}>
                <Table size="sm" sx={{ '--TableCell-paddingY': '8px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '50%' }}>Description</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Qty</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Rate</th>
                      <th style={{ width: '20%', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entity.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td>{item.description}</td>
                        <td style={{ textAlign: 'right' }}>{item.quantity || 1}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount || ((item.quantity || 1) * (item.rate || 0)))}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Sheet>
            </Box>
          </>
        )}

        {/* Totals */}
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', py: 2 }}>
          <Stack spacing={0.75} sx={{ minWidth: 200 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Subtotal</Typography>
              <Typography level="body-sm">{formatCurrency(subtotal)}</Typography>
            </Box>
            {tax > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Tax ({entity.taxRate || 0}%)</Typography>
                <Typography level="body-sm">{formatCurrency(tax)}</Typography>
              </Box>
            )}
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5 }}>
              <Typography level="title-sm" fontWeight="lg">Total</Typography>
              <Typography level="title-sm" fontWeight="lg">{formatCurrency(total)}</Typography>
            </Box>
            {entity.amountDue > 0 && entity.amountDue !== total && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography level="body-sm" color="danger">Amount Due</Typography>
                <Typography level="body-sm" color="danger" fontWeight="lg">{formatCurrency(entity.amountDue)}</Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    );
  };

  // ==========================================
  // ACCOUNT DETAILS
  // ==========================================
  const renderAccountDetails = () => {
    const getAccountTypeDisplay = () => {
      if (!entity.subtypeCode) return 'Account';
      const typeMap: Record<string, string> = {
        current_asset: 'Current Assets',
        fixed_asset: 'Fixed Assets',
        current_liability: 'Current Liabilities',
        long_term_liability: 'Long-term Liabilities',
        equity: 'Equity',
        revenue: 'Revenue',
        expense: 'Expenses',
        cost_of_goods_sold: 'Cost of Goods Sold',
        other_income: 'Other Income',
        other_expense: 'Other Expense',
      };
      return typeMap[entity.subtypeCode] || entity.subtypeCode.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    };

    return (
      <Stack spacing={0}>
        {/* Balance hero */}
        <Box sx={{ textAlign: 'center', py: 3, mb: 1 }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Balance
          </Typography>
          <Typography level="h2" fontWeight="lg" color="primary">
            {formatCurrency(entity.balance || 0)}
          </Typography>
          <Chip size="sm" variant="soft" color="primary" sx={{ mt: 1 }}>
            {entity.code || 'N/A'}
          </Chip>
        </Box>

        <Divider />

        <Box sx={{ py: 0.5 }}>
          <FieldRow icon={<Wallet size={15} />} label="Name" value={entity.name} />
          <FieldRow icon={<Tag size={15} />} label="Type" value={getAccountTypeDisplay()} />
          {entity.description && <FieldRow icon={<FileText size={15} />} label="Description" value={entity.description} />}
          <FieldRow icon={<FileCheck size={15} />} label="Status" value={entity.isActive !== false ? 'Active' : 'Inactive'} />
        </Box>
      </Stack>
    );
  };

  // ==========================================
  // CONTENT ROUTER
  // ==========================================
  const renderContent = () => {
    switch (entityType) {
      case 'customer': return renderCustomerDetails();
      case 'vendor': return renderVendorDetails();
      case 'employee': return renderEmployeeDetails();
      case 'invoice': return renderInvoiceDetails();
      case 'bill': return renderInvoiceDetails();
      case 'transaction': return renderTransactionDetails();
      case 'account': return renderAccountDetails();
      default:
        return (
          <Stack spacing={0} sx={{ py: 1 }}>
            {Object.entries(entity).filter(([key, value]) => {
              if (['id', 'createdAt', 'updatedAt', 'items', 'companyId', 'userId'].includes(key)) return false;
              if (key.toLowerCase().endsWith('id') && typeof value === 'string' && value.length > 15) return false;
              if (typeof value === 'object') return false;
              if (value === '' || value === null || value === undefined) return false;
              return true;
            }).map(([key, value]) => (
              <FieldRow
                key={key}
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                value={String(value)}
              />
            ))}
          </Stack>
        );
    }
  };

  const navigationEntities = ['customer', 'vendor', 'account', 'invoice', 'bill', 'employee'];
  const routes: Record<string, string> = {
    customer: 'customers',
    vendor: 'vendors',
    account: 'accounts',
    invoice: 'invoices',
    bill: 'bills',
    employee: 'employees',
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        size="lg"
        sx={{
          maxWidth: { xs: '95vw', sm: 480 },
          width: '100%',
          maxHeight: '85vh',
          overflow: 'auto',
          borderRadius: 'xl',
          p: 3,
          boxShadow: 'lg',
        }}
      >
        <ModalClose sx={{ borderRadius: 'md' }} />

        {renderContent()}

        {/* Footer */}
        <Divider sx={{ mt: 1 }} />
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} justifyContent="flex-end" sx={{ pt: 1.5 }}>
          <Button variant="plain" color="neutral" onClick={onClose} size="sm">
            Close
          </Button>
          {navigationEntities.includes(entityType) && companyId && (
            <Button
              variant="soft"
              color="primary"
              size="sm"
              startDecorator={<ExternalLink size={14} />}
              onClick={() => router.push(`/companies/${companyId}/${routes[entityType]}`)}
            >
              View All {entityType.charAt(0).toUpperCase() + entityType.slice(1)}s
            </Button>
          )}
        </Stack>
      </ModalDialog>
    </Modal>
  );
}
