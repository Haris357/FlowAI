'use client';

import {
  Modal,
  ModalDialog,
  ModalClose,
  Typography,
  Box,
  Stack,
  Chip,
  Button,
  Divider,
  Table,
  Sheet,
} from '@mui/joy';
import { Eye, Pencil, Trash2, Calendar, User, Building2, Hash, FileText } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { EntityType, getStatusColor, formatStatus } from '@/lib/status-management';
import { canEdit, canDelete } from '@/lib/status-management';

interface FormEntityDetailModalProps {
  open: boolean;
  onClose: () => void;
  entityType: EntityType;
  entity: Record<string, any> | null;
  onEdit?: (entity: Record<string, any>) => void;
  onDelete?: (entity: Record<string, any>) => void;
  currencySymbol?: string;
}

function formatDate(value: any): string {
  if (!value) return '-';
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (value?.toDate) {
    return value.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return String(value);
}

function formatCurrency(amount: number, symbol: string = '$'): string {
  return `${symbol}${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      {icon && <Box sx={{ color: 'text.tertiary', mt: 0.25 }}>{icon}</Box>}
      <Box sx={{ minWidth: 120 }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{label}</Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography level="body-sm">{value || '-'}</Typography>
      </Box>
    </Stack>
  );
}

function ItemsTable({ items, currencySymbol }: { items: any[]; currencySymbol: string }) {
  if (!items || items.length === 0) return null;
  return (
    <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
      <Table size="sm" stripe="odd" sx={{ '& th': { bgcolor: 'background.level1' } }}>
        <thead>
          <tr>
            <th style={{ width: '45%' }}>Description</th>
            <th style={{ width: '15%', textAlign: 'right' }}>Qty</th>
            <th style={{ width: '20%', textAlign: 'right' }}>Rate</th>
            <th style={{ width: '20%', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, idx: number) => (
            <tr key={idx}>
              <td>{item.description || '-'}</td>
              <td style={{ textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate, currencySymbol)}</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount, currencySymbol)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Sheet>
  );
}

function InvoiceDetail({ entity, currencySymbol }: { entity: any; currencySymbol: string }) {
  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <InfoRow label="Invoice #" value={entity.invoiceNumber} icon={<Hash size={14} />} />
        <InfoRow label="Customer" value={entity.customerName} icon={<User size={14} />} />
        <InfoRow label="Issue Date" value={formatDate(entity.issueDate)} icon={<Calendar size={14} />} />
        <InfoRow label="Due Date" value={formatDate(entity.dueDate)} icon={<Calendar size={14} />} />
      </Stack>
      <Divider />
      <Typography level="title-sm">Line Items</Typography>
      <ItemsTable items={entity.items} currencySymbol={currencySymbol} />
      <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
        <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Subtotal</Typography><Typography level="body-sm">{formatCurrency(entity.subtotal, currencySymbol)}</Typography></Stack>
        {entity.taxAmount > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Tax ({entity.taxRate}%)</Typography><Typography level="body-sm">{formatCurrency(entity.taxAmount, currencySymbol)}</Typography></Stack>}
        {entity.discount > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Discount</Typography><Typography level="body-sm">-{formatCurrency(entity.discount, currencySymbol)}</Typography></Stack>}
        <Divider sx={{ width: 200 }} />
        <Stack direction="row" spacing={4}><Typography level="title-sm">Total</Typography><Typography level="title-sm">{formatCurrency(entity.total, currencySymbol)}</Typography></Stack>
        {entity.amountPaid > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'success.600' }}>Paid</Typography><Typography level="body-sm" sx={{ color: 'success.600' }}>{formatCurrency(entity.amountPaid, currencySymbol)}</Typography></Stack>}
        {entity.amountDue > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'danger.600' }}>Due</Typography><Typography level="body-sm" sx={{ color: 'danger.600' }}>{formatCurrency(entity.amountDue, currencySymbol)}</Typography></Stack>}
      </Stack>
      {entity.notes && (
        <>
          <Divider />
          <Box>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>Notes</Typography>
            <Typography level="body-sm">{entity.notes}</Typography>
          </Box>
        </>
      )}
    </Stack>
  );
}

function BillDetail({ entity, currencySymbol }: { entity: any; currencySymbol: string }) {
  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <InfoRow label="Bill #" value={entity.billNumber || '-'} icon={<Hash size={14} />} />
        <InfoRow label="Vendor" value={entity.vendorName} icon={<Building2 size={14} />} />
        <InfoRow label="Issue Date" value={formatDate(entity.issueDate)} icon={<Calendar size={14} />} />
        <InfoRow label="Due Date" value={formatDate(entity.dueDate)} icon={<Calendar size={14} />} />
      </Stack>
      <Divider />
      <Typography level="title-sm">Line Items</Typography>
      <ItemsTable items={entity.items} currencySymbol={currencySymbol} />
      <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
        <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Subtotal</Typography><Typography level="body-sm">{formatCurrency(entity.subtotal, currencySymbol)}</Typography></Stack>
        {entity.taxAmount > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Tax</Typography><Typography level="body-sm">{formatCurrency(entity.taxAmount, currencySymbol)}</Typography></Stack>}
        <Divider sx={{ width: 200 }} />
        <Stack direction="row" spacing={4}><Typography level="title-sm">Total</Typography><Typography level="title-sm">{formatCurrency(entity.total, currencySymbol)}</Typography></Stack>
        {entity.amountPaid > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'success.600' }}>Paid</Typography><Typography level="body-sm" sx={{ color: 'success.600' }}>{formatCurrency(entity.amountPaid, currencySymbol)}</Typography></Stack>}
        {entity.amountDue > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'danger.600' }}>Due</Typography><Typography level="body-sm" sx={{ color: 'danger.600' }}>{formatCurrency(entity.amountDue, currencySymbol)}</Typography></Stack>}
      </Stack>
      {entity.notes && (
        <>
          <Divider />
          <Box>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>Notes</Typography>
            <Typography level="body-sm">{entity.notes}</Typography>
          </Box>
        </>
      )}
    </Stack>
  );
}

function QuoteDetail({ entity, currencySymbol }: { entity: any; currencySymbol: string }) {
  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <InfoRow label="Quote #" value={entity.quoteNumber} icon={<Hash size={14} />} />
        <InfoRow label="Customer" value={entity.customerName} icon={<User size={14} />} />
        <InfoRow label="Issue Date" value={formatDate(entity.issueDate)} icon={<Calendar size={14} />} />
        <InfoRow label="Expiry Date" value={formatDate(entity.expiryDate)} icon={<Calendar size={14} />} />
        {entity.convertedToInvoiceNumber && (
          <InfoRow label="Converted To" value={`Invoice ${entity.convertedToInvoiceNumber}`} icon={<FileText size={14} />} />
        )}
      </Stack>
      <Divider />
      <Typography level="title-sm">Line Items</Typography>
      <ItemsTable items={entity.items} currencySymbol={currencySymbol} />
      <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
        <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Subtotal</Typography><Typography level="body-sm">{formatCurrency(entity.subtotal, currencySymbol)}</Typography></Stack>
        {entity.taxAmount > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Tax ({entity.taxRate}%)</Typography><Typography level="body-sm">{formatCurrency(entity.taxAmount, currencySymbol)}</Typography></Stack>}
        {entity.discount > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Discount</Typography><Typography level="body-sm">-{formatCurrency(entity.discount, currencySymbol)}</Typography></Stack>}
        <Divider sx={{ width: 200 }} />
        <Stack direction="row" spacing={4}><Typography level="title-sm">Total</Typography><Typography level="title-sm">{formatCurrency(entity.total, currencySymbol)}</Typography></Stack>
      </Stack>
      {entity.notes && (
        <>
          <Divider />
          <Box>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>Notes</Typography>
            <Typography level="body-sm">{entity.notes}</Typography>
          </Box>
        </>
      )}
    </Stack>
  );
}

function PurchaseOrderDetail({ entity, currencySymbol }: { entity: any; currencySymbol: string }) {
  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <InfoRow label="PO #" value={entity.poNumber} icon={<Hash size={14} />} />
        <InfoRow label="Vendor" value={entity.vendorName} icon={<Building2 size={14} />} />
        <InfoRow label="Issue Date" value={formatDate(entity.issueDate)} icon={<Calendar size={14} />} />
        <InfoRow label="Expected Date" value={formatDate(entity.expectedDate)} icon={<Calendar size={14} />} />
        {entity.convertedToBillNumber && (
          <InfoRow label="Converted To" value={`Bill ${entity.convertedToBillNumber}`} icon={<FileText size={14} />} />
        )}
      </Stack>
      <Divider />
      <Typography level="title-sm">Line Items</Typography>
      <ItemsTable items={entity.items} currencySymbol={currencySymbol} />
      <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
        <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Subtotal</Typography><Typography level="body-sm">{formatCurrency(entity.subtotal, currencySymbol)}</Typography></Stack>
        {entity.taxAmount > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Tax ({entity.taxRate}%)</Typography><Typography level="body-sm">{formatCurrency(entity.taxAmount, currencySymbol)}</Typography></Stack>}
        {entity.discount > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Discount</Typography><Typography level="body-sm">-{formatCurrency(entity.discount, currencySymbol)}</Typography></Stack>}
        <Divider sx={{ width: 200 }} />
        <Stack direction="row" spacing={4}><Typography level="title-sm">Total</Typography><Typography level="title-sm">{formatCurrency(entity.total, currencySymbol)}</Typography></Stack>
      </Stack>
      {entity.shippingAddress && (
        <>
          <Divider />
          <Box>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>Shipping Address</Typography>
            <Typography level="body-sm">{entity.shippingAddress}</Typography>
          </Box>
        </>
      )}
      {entity.notes && (
        <Box>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>Notes</Typography>
          <Typography level="body-sm">{entity.notes}</Typography>
        </Box>
      )}
    </Stack>
  );
}

function CreditNoteDetail({ entity, currencySymbol }: { entity: any; currencySymbol: string }) {
  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <InfoRow label="Credit Note #" value={entity.creditNoteNumber} icon={<Hash size={14} />} />
        <InfoRow label="Customer" value={entity.customerName} icon={<User size={14} />} />
        <InfoRow label="Date" value={formatDate(entity.date)} icon={<Calendar size={14} />} />
        <InfoRow label="Reason" value={entity.reason} />
        {entity.originalInvoiceNumber && (
          <InfoRow label="Original Invoice" value={entity.originalInvoiceNumber} icon={<FileText size={14} />} />
        )}
      </Stack>
      <Divider />
      <Typography level="title-sm">Line Items</Typography>
      <ItemsTable items={entity.items} currencySymbol={currencySymbol} />
      <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
        <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Subtotal</Typography><Typography level="body-sm">{formatCurrency(entity.subtotal, currencySymbol)}</Typography></Stack>
        {entity.taxAmount > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Tax</Typography><Typography level="body-sm">{formatCurrency(entity.taxAmount, currencySymbol)}</Typography></Stack>}
        <Divider sx={{ width: 200 }} />
        <Stack direction="row" spacing={4}><Typography level="title-sm">Total</Typography><Typography level="title-sm">{formatCurrency(entity.total, currencySymbol)}</Typography></Stack>
        {entity.appliedAmount > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'success.600' }}>Applied</Typography><Typography level="body-sm" sx={{ color: 'success.600' }}>{formatCurrency(entity.appliedAmount, currencySymbol)}</Typography></Stack>}
        {entity.remainingCredit > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'warning.600' }}>Remaining</Typography><Typography level="body-sm" sx={{ color: 'warning.600' }}>{formatCurrency(entity.remainingCredit, currencySymbol)}</Typography></Stack>}
      </Stack>
      {entity.notes && (
        <>
          <Divider />
          <Box>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>Notes</Typography>
            <Typography level="body-sm">{entity.notes}</Typography>
          </Box>
        </>
      )}
    </Stack>
  );
}

function DebitNoteDetail({ entity, currencySymbol }: { entity: any; currencySymbol: string }) {
  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <InfoRow label="Debit Note #" value={entity.debitNoteNumber} icon={<Hash size={14} />} />
        <InfoRow label="Vendor" value={entity.vendorName} icon={<Building2 size={14} />} />
        <InfoRow label="Date" value={formatDate(entity.date)} icon={<Calendar size={14} />} />
        <InfoRow label="Reason" value={entity.reason} />
        {entity.originalBillNumber && (
          <InfoRow label="Original Bill" value={entity.originalBillNumber} icon={<FileText size={14} />} />
        )}
      </Stack>
      <Divider />
      <Typography level="title-sm">Line Items</Typography>
      <ItemsTable items={entity.items} currencySymbol={currencySymbol} />
      <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
        <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Subtotal</Typography><Typography level="body-sm">{formatCurrency(entity.subtotal, currencySymbol)}</Typography></Stack>
        {entity.taxAmount > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'text.secondary' }}>Tax</Typography><Typography level="body-sm">{formatCurrency(entity.taxAmount, currencySymbol)}</Typography></Stack>}
        <Divider sx={{ width: 200 }} />
        <Stack direction="row" spacing={4}><Typography level="title-sm">Total</Typography><Typography level="title-sm">{formatCurrency(entity.total, currencySymbol)}</Typography></Stack>
        {entity.appliedAmount > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'success.600' }}>Applied</Typography><Typography level="body-sm" sx={{ color: 'success.600' }}>{formatCurrency(entity.appliedAmount, currencySymbol)}</Typography></Stack>}
        {entity.remainingBalance > 0 && <Stack direction="row" spacing={4}><Typography level="body-sm" sx={{ color: 'warning.600' }}>Remaining</Typography><Typography level="body-sm" sx={{ color: 'warning.600' }}>{formatCurrency(entity.remainingBalance, currencySymbol)}</Typography></Stack>}
      </Stack>
      {entity.notes && (
        <>
          <Divider />
          <Box>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mb: 0.5 }}>Notes</Typography>
            <Typography level="body-sm">{entity.notes}</Typography>
          </Box>
        </>
      )}
    </Stack>
  );
}

function SalarySlipDetail({ entity, currencySymbol }: { entity: any; currencySymbol: string }) {
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return (
    <Stack spacing={2}>
      <Stack spacing={1}>
        <InfoRow label="Employee" value={entity.employeeName} icon={<User size={14} />} />
        {entity.employeeDesignation && <InfoRow label="Designation" value={entity.employeeDesignation} />}
        <InfoRow label="Period" value={`${monthNames[entity.month] || entity.month} ${entity.year}`} icon={<Calendar size={14} />} />
        {entity.paymentMethod && <InfoRow label="Payment Method" value={entity.paymentMethod} />}
        {entity.paidDate && <InfoRow label="Paid Date" value={formatDate(entity.paidDate)} icon={<Calendar size={14} />} />}
      </Stack>
      <Divider />
      {/* Earnings */}
      <Box>
        <Typography level="title-sm" sx={{ mb: 1 }}>Earnings</Typography>
        <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
          <Table size="sm" stripe="odd" sx={{ '& th': { bgcolor: 'background.level1' } }}>
            <thead>
              <tr>
                <th>Component</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Basic Salary</td><td style={{ textAlign: 'right' }}>{formatCurrency(entity.basicSalary, currencySymbol)}</td></tr>
              {entity.allowances?.hra > 0 && <tr><td>HRA</td><td style={{ textAlign: 'right' }}>{formatCurrency(entity.allowances.hra, currencySymbol)}</td></tr>}
              {entity.allowances?.da > 0 && <tr><td>DA</td><td style={{ textAlign: 'right' }}>{formatCurrency(entity.allowances.da, currencySymbol)}</td></tr>}
              {entity.allowances?.ta > 0 && <tr><td>TA</td><td style={{ textAlign: 'right' }}>{formatCurrency(entity.allowances.ta, currencySymbol)}</td></tr>}
              {entity.allowances?.other > 0 && <tr><td>Other Allowances</td><td style={{ textAlign: 'right' }}>{formatCurrency(entity.allowances.other, currencySymbol)}</td></tr>}
              <tr style={{ fontWeight: 600 }}><td>Total Earnings</td><td style={{ textAlign: 'right' }}>{formatCurrency(entity.totalEarnings, currencySymbol)}</td></tr>
            </tbody>
          </Table>
        </Sheet>
      </Box>
      {/* Deductions */}
      <Box>
        <Typography level="title-sm" sx={{ mb: 1 }}>Deductions</Typography>
        <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
          <Table size="sm" stripe="odd" sx={{ '& th': { bgcolor: 'background.level1' } }}>
            <thead>
              <tr>
                <th>Component</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {entity.deductions?.tax > 0 && <tr><td>Tax</td><td style={{ textAlign: 'right' }}>{formatCurrency(entity.deductions.tax, currencySymbol)}</td></tr>}
              {entity.deductions?.providentFund > 0 && <tr><td>Provident Fund</td><td style={{ textAlign: 'right' }}>{formatCurrency(entity.deductions.providentFund, currencySymbol)}</td></tr>}
              {entity.deductions?.loan > 0 && <tr><td>Loan</td><td style={{ textAlign: 'right' }}>{formatCurrency(entity.deductions.loan, currencySymbol)}</td></tr>}
              {entity.deductions?.other > 0 && <tr><td>Other Deductions</td><td style={{ textAlign: 'right' }}>{formatCurrency(entity.deductions.other, currencySymbol)}</td></tr>}
              <tr style={{ fontWeight: 600 }}><td>Total Deductions</td><td style={{ textAlign: 'right' }}>{formatCurrency(entity.totalDeductions, currencySymbol)}</td></tr>
            </tbody>
          </Table>
        </Sheet>
      </Box>
      {/* Net Salary */}
      <Sheet variant="soft" color="primary" sx={{ p: 2, borderRadius: 'md' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography level="title-md">Net Salary</Typography>
          <Typography level="title-lg" sx={{ color: 'primary.600' }}>
            {formatCurrency(entity.netSalary, currencySymbol)}
          </Typography>
        </Stack>
      </Sheet>
    </Stack>
  );
}

const ENTITY_LABELS: Record<string, string> = {
  invoice: 'Invoice',
  bill: 'Bill',
  quote: 'Quote',
  purchaseOrder: 'Purchase Order',
  creditNote: 'Credit Note',
  debitNote: 'Debit Note',
  salarySlip: 'Salary Slip',
  employee: 'Employee',
};

export default function FormEntityDetailModal({
  open,
  onClose,
  entityType,
  entity,
  onEdit,
  onDelete,
  currencySymbol = '$',
}: FormEntityDetailModalProps) {
  if (!entity) return null;

  const status = entity.status;
  const statusColor = status ? getStatusColor(entityType, status) : 'neutral';
  const statusLabel = status ? formatStatus(entityType, status) : '';
  const editAllowed = status ? canEdit(entityType, status).allowed : false;
  const deleteAllowed = status ? canDelete(entityType, status).allowed : false;

  const renderDetail = () => {
    switch (entityType) {
      case 'invoice': return <InvoiceDetail entity={entity} currencySymbol={currencySymbol} />;
      case 'bill': return <BillDetail entity={entity} currencySymbol={currencySymbol} />;
      case 'quote': return <QuoteDetail entity={entity} currencySymbol={currencySymbol} />;
      case 'purchaseOrder': return <PurchaseOrderDetail entity={entity} currencySymbol={currencySymbol} />;
      case 'creditNote': return <CreditNoteDetail entity={entity} currencySymbol={currencySymbol} />;
      case 'debitNote': return <DebitNoteDetail entity={entity} currencySymbol={currencySymbol} />;
      case 'salarySlip': return <SalarySlipDetail entity={entity} currencySymbol={currencySymbol} />;
      default: return <Typography>No detail view available for this entity type.</Typography>;
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        variant="outlined"
        sx={{
          maxWidth: { xs: '95vw', sm: 600 },
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 'lg',
          p: 3,
        }}
      >
        <ModalClose />

        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 'md',
            bgcolor: 'primary.softBg', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Eye size={18} style={{ color: 'var(--joy-palette-primary-600)' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography level="title-lg">
              {ENTITY_LABELS[entityType] || entityType} Details
            </Typography>
          </Box>
          {status && (
            <Chip size="sm" variant="soft" color={statusColor}>
              {statusLabel}
            </Chip>
          )}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Content */}
        {renderDetail()}

        {/* Footer Actions */}
        {(onEdit || onDelete) && (
          <>
            <Divider sx={{ mt: 2 }} />
            <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
              {onDelete && deleteAllowed && (
                <Button
                  variant="soft"
                  color="danger"
                  size="sm"
                  startDecorator={<Trash2 size={14} />}
                  onClick={() => onDelete(entity)}
                >
                  Delete
                </Button>
              )}
              {onEdit && editAllowed && (
                <Button
                  variant="soft"
                  color="primary"
                  size="sm"
                  startDecorator={<Pencil size={14} />}
                  onClick={() => onEdit(entity)}
                >
                  Edit
                </Button>
              )}
              <Button variant="plain" color="neutral" size="sm" onClick={onClose}>
                Close
              </Button>
            </Stack>
          </>
        )}
      </ModalDialog>
    </Modal>
  );
}
