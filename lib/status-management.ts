/**
 * Comprehensive Status Management System
 *
 * Defines status workflows, transitions, and validation rules for all entities
 * that support status changes in the application.
 */

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type EntityType =
  | 'invoice'
  | 'bill'
  | 'quote'
  | 'purchaseOrder'
  | 'creditNote'
  | 'debitNote'
  | 'salarySlip'
  | 'employee';

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type BillStatus = 'draft' | 'unpaid' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
export type CreditNoteStatus = 'draft' | 'issued' | 'applied' | 'cancelled';
export type DebitNoteStatus = 'draft' | 'issued' | 'applied' | 'partial' | 'settled' | 'void';
export type SalarySlipStatus = 'generated' | 'paid' | 'cancelled';
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';

export type EntityStatus =
  | InvoiceStatus
  | BillStatus
  | QuoteStatus
  | PurchaseOrderStatus
  | CreditNoteStatus
  | DebitNoteStatus
  | SalarySlipStatus
  | EmployeeStatus;

export interface StatusOption {
  value: string;
  label: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  description?: string;
}

export interface StatusTransition {
  from: string;
  to: string[];
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface StatusValidation {
  canDelete: boolean;
  canEdit: boolean;
  canDuplicate: boolean;
  editableFields?: string[]; // Specific fields that can be edited
  message?: string; // Message to show if action is blocked
}

export interface StatusConfig {
  entityType: EntityType;
  statuses: StatusOption[];
  transitions: StatusTransition[];
  validations: Record<string, StatusValidation>;
  defaultStatus: string;
}

// ==========================================
// STATUS CONFIGURATIONS
// ==========================================

export const INVOICE_STATUS_CONFIG: StatusConfig = {
  entityType: 'invoice',
  defaultStatus: 'draft',
  statuses: [
    { value: 'draft', label: 'Draft', color: 'neutral', description: 'Invoice is being prepared' },
    { value: 'sent', label: 'Sent', color: 'primary', description: 'Invoice sent to customer' },
    { value: 'viewed', label: 'Viewed', color: 'primary', description: 'Customer viewed invoice' },
    { value: 'partial', label: 'Partially Paid', color: 'primary', description: 'Invoice partially paid' },
    { value: 'paid', label: 'Paid', color: 'success', description: 'Invoice fully paid' },
    { value: 'overdue', label: 'Overdue', color: 'danger', description: 'Payment is overdue' },
    { value: 'cancelled', label: 'Cancelled', color: 'neutral', description: 'Invoice cancelled' },
    { value: 'refunded', label: 'Refunded', color: 'warning', description: 'Payment refunded' },
  ],
  transitions: [
    { from: 'draft', to: ['sent', 'cancelled'] },
    { from: 'sent', to: ['viewed', 'partial', 'paid', 'overdue', 'cancelled'] },
    { from: 'viewed', to: ['partial', 'paid', 'overdue', 'cancelled'] },
    { from: 'partial', to: ['paid', 'overdue', 'cancelled'] },
    { from: 'overdue', to: ['partial', 'paid', 'cancelled'] },
    { from: 'paid', to: ['refunded'], requiresConfirmation: true, confirmationMessage: 'Are you sure you want to refund this invoice?' },
    { from: 'cancelled', to: ['draft'] },
    { from: 'refunded', to: [] },
  ],
  validations: {
    draft: { canDelete: true, canEdit: true, canDuplicate: true },
    sent: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['notes', 'dueDate'], message: 'Sent invoices cannot be fully edited' },
    viewed: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['notes'], message: 'Viewed invoices cannot be edited' },
    partial: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['notes', 'dueDate'], message: 'Partially paid invoices have limited editing' },
    paid: { canDelete: false, canEdit: false, canDuplicate: true, message: 'Paid invoices cannot be modified' },
    overdue: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['dueDate'], message: 'Overdue invoices have limited editing' },
    cancelled: { canDelete: true, canEdit: false, canDuplicate: true, message: 'Cancelled invoices cannot be edited' },
    refunded: { canDelete: false, canEdit: false, canDuplicate: false, message: 'Refunded invoices are locked' },
  },
};

export const BILL_STATUS_CONFIG: StatusConfig = {
  entityType: 'bill',
  defaultStatus: 'draft',
  statuses: [
    { value: 'draft', label: 'Draft', color: 'neutral', description: 'Bill is being prepared' },
    { value: 'unpaid', label: 'Unpaid', color: 'warning', description: 'Awaiting payment' },
    { value: 'partial', label: 'Partially Paid', color: 'primary', description: 'Partially paid' },
    { value: 'paid', label: 'Paid', color: 'success', description: 'Bill fully paid' },
    { value: 'overdue', label: 'Overdue', color: 'danger', description: 'Payment is overdue' },
    { value: 'cancelled', label: 'Cancelled', color: 'neutral', description: 'Bill cancelled' },
  ],
  transitions: [
    { from: 'draft', to: ['unpaid', 'cancelled'] },
    { from: 'unpaid', to: ['partial', 'paid', 'overdue', 'cancelled'] },
    { from: 'partial', to: ['paid', 'overdue', 'cancelled'] },
    { from: 'overdue', to: ['partial', 'paid', 'cancelled'] },
    { from: 'paid', to: [] },
    { from: 'cancelled', to: ['draft'] },
  ],
  validations: {
    draft: { canDelete: true, canEdit: true, canDuplicate: true },
    unpaid: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['notes', 'dueDate'], message: 'Unpaid bills have limited editing' },
    partial: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['notes', 'dueDate'], message: 'Partially paid bills have limited editing' },
    paid: { canDelete: false, canEdit: false, canDuplicate: true, message: 'Paid bills cannot be modified' },
    overdue: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['dueDate'], message: 'Overdue bills have limited editing' },
    cancelled: { canDelete: true, canEdit: false, canDuplicate: true, message: 'Cancelled bills cannot be edited' },
  },
};

export const QUOTE_STATUS_CONFIG: StatusConfig = {
  entityType: 'quote',
  defaultStatus: 'draft',
  statuses: [
    { value: 'draft', label: 'Draft', color: 'neutral', description: 'Quote is being prepared' },
    { value: 'sent', label: 'Sent', color: 'primary', description: 'Quote sent to customer' },
    { value: 'accepted', label: 'Accepted', color: 'success', description: 'Customer accepted quote' },
    { value: 'declined', label: 'Declined', color: 'danger', description: 'Customer declined quote' },
    { value: 'expired', label: 'Expired', color: 'neutral', description: 'Quote validity expired' },
  ],
  transitions: [
    { from: 'draft', to: ['sent'] },
    { from: 'sent', to: ['accepted', 'declined', 'expired'] },
    { from: 'accepted', to: [] },
    { from: 'declined', to: ['draft'] },
    { from: 'expired', to: ['draft'] },
  ],
  validations: {
    draft: { canDelete: true, canEdit: true, canDuplicate: true },
    sent: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['notes', 'validUntil'], message: 'Sent quotes have limited editing' },
    accepted: { canDelete: false, canEdit: false, canDuplicate: true, message: 'Accepted quotes cannot be modified' },
    declined: { canDelete: true, canEdit: false, canDuplicate: true, message: 'Declined quotes cannot be edited' },
    expired: { canDelete: true, canEdit: false, canDuplicate: true, message: 'Expired quotes cannot be edited' },
  },
};

export const PURCHASE_ORDER_STATUS_CONFIG: StatusConfig = {
  entityType: 'purchaseOrder',
  defaultStatus: 'draft',
  statuses: [
    { value: 'draft', label: 'Draft', color: 'neutral', description: 'PO is being prepared' },
    { value: 'sent', label: 'Sent', color: 'primary', description: 'PO sent to vendor' },
    { value: 'confirmed', label: 'Confirmed', color: 'primary', description: 'Vendor confirmed PO' },
    { value: 'received', label: 'Received', color: 'success', description: 'Items received' },
    { value: 'cancelled', label: 'Cancelled', color: 'neutral', description: 'PO cancelled' },
  ],
  transitions: [
    { from: 'draft', to: ['sent', 'cancelled'] },
    { from: 'sent', to: ['confirmed', 'cancelled'] },
    { from: 'confirmed', to: ['received', 'cancelled'], requiresConfirmation: true, confirmationMessage: 'Confirm items have been received?' },
    { from: 'received', to: [] },
    { from: 'cancelled', to: ['draft'] },
  ],
  validations: {
    draft: { canDelete: true, canEdit: true, canDuplicate: true },
    sent: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['notes', 'deliveryDate'], message: 'Sent POs have limited editing' },
    confirmed: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['notes'], message: 'Confirmed POs cannot be fully edited' },
    received: { canDelete: false, canEdit: false, canDuplicate: true, message: 'Received POs are locked' },
    cancelled: { canDelete: true, canEdit: false, canDuplicate: true, message: 'Cancelled POs cannot be edited' },
  },
};

export const CREDIT_NOTE_STATUS_CONFIG: StatusConfig = {
  entityType: 'creditNote',
  defaultStatus: 'draft',
  statuses: [
    { value: 'draft', label: 'Draft', color: 'neutral', description: 'Credit note being prepared' },
    { value: 'issued', label: 'Issued', color: 'primary', description: 'Credit note issued' },
    { value: 'applied', label: 'Applied', color: 'success', description: 'Credit applied to account' },
    { value: 'cancelled', label: 'Cancelled', color: 'neutral', description: 'Credit note cancelled' },
  ],
  transitions: [
    { from: 'draft', to: ['issued', 'cancelled'] },
    { from: 'issued', to: ['applied', 'cancelled'] },
    { from: 'applied', to: [] },
    { from: 'cancelled', to: ['draft'] },
  ],
  validations: {
    draft: { canDelete: true, canEdit: true, canDuplicate: true },
    issued: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['notes'], message: 'Issued credit notes have limited editing' },
    applied: { canDelete: false, canEdit: false, canDuplicate: false, message: 'Applied credit notes are locked' },
    cancelled: { canDelete: true, canEdit: false, canDuplicate: true, message: 'Cancelled credit notes cannot be edited' },
  },
};

export const DEBIT_NOTE_STATUS_CONFIG: StatusConfig = {
  entityType: 'debitNote',
  defaultStatus: 'draft',
  statuses: [
    { value: 'draft', label: 'Draft', color: 'neutral', description: 'Debit note being prepared' },
    { value: 'issued', label: 'Issued', color: 'primary', description: 'Debit note issued' },
    { value: 'applied', label: 'Applied', color: 'success', description: 'Debit applied to account' },
    { value: 'partial', label: 'Partially Applied', color: 'warning', description: 'Partially applied' },
    { value: 'settled', label: 'Settled', color: 'success', description: 'Fully settled' },
    { value: 'void', label: 'Void', color: 'danger', description: 'Debit note voided' },
  ],
  transitions: [
    { from: 'draft', to: ['issued', 'void'] },
    { from: 'issued', to: ['applied', 'partial', 'void'] },
    { from: 'partial', to: ['applied', 'settled', 'void'] },
    { from: 'applied', to: ['settled'] },
    { from: 'settled', to: [] },
    { from: 'void', to: ['draft'] },
  ],
  validations: {
    draft: { canDelete: true, canEdit: true, canDuplicate: true },
    issued: { canDelete: false, canEdit: false, canDuplicate: true, editableFields: ['notes'], message: 'Issued debit notes have limited editing' },
    applied: { canDelete: false, canEdit: false, canDuplicate: false, message: 'Applied debit notes are locked' },
    partial: { canDelete: false, canEdit: false, canDuplicate: false, editableFields: ['notes'], message: 'Partially applied debit notes have limited editing' },
    settled: { canDelete: false, canEdit: false, canDuplicate: false, message: 'Settled debit notes are locked' },
    void: { canDelete: true, canEdit: false, canDuplicate: true, message: 'Voided debit notes cannot be edited' },
  },
};

export const SALARY_SLIP_STATUS_CONFIG: StatusConfig = {
  entityType: 'salarySlip',
  defaultStatus: 'generated',
  statuses: [
    { value: 'generated', label: 'Generated', color: 'warning', description: 'Salary slip created, pending payment' },
    { value: 'paid', label: 'Paid', color: 'success', description: 'Salary paid to employee' },
    { value: 'cancelled', label: 'Cancelled', color: 'neutral', description: 'Salary slip cancelled' },
  ],
  transitions: [
    { from: 'generated', to: ['paid', 'cancelled'], requiresConfirmation: true, confirmationMessage: 'Confirm salary payment?' },
    { from: 'paid', to: [] },
    { from: 'cancelled', to: [] },
  ],
  validations: {
    generated: { canDelete: true, canEdit: true, canDuplicate: false },
    paid: { canDelete: false, canEdit: false, canDuplicate: false, message: 'Paid salary slips cannot be modified' },
    cancelled: { canDelete: true, canEdit: false, canDuplicate: false, message: 'Cancelled salary slips cannot be edited' },
  },
};

export const EMPLOYEE_STATUS_CONFIG: StatusConfig = {
  entityType: 'employee',
  defaultStatus: 'active',
  statuses: [
    { value: 'active', label: 'Active', color: 'success', description: 'Employee is actively working' },
    { value: 'inactive', label: 'Inactive', color: 'neutral', description: 'Employee temporarily inactive' },
    { value: 'on_leave', label: 'On Leave', color: 'warning', description: 'Employee is on leave' },
    { value: 'terminated', label: 'Terminated', color: 'danger', description: 'Employment terminated' },
  ],
  transitions: [
    { from: 'active', to: ['inactive', 'on_leave', 'terminated'] },
    { from: 'inactive', to: ['active', 'terminated'] },
    { from: 'on_leave', to: ['active', 'terminated'] },
    { from: 'terminated', to: [], requiresConfirmation: true, confirmationMessage: 'This action cannot be undone. Continue?' },
  ],
  validations: {
    active: { canDelete: false, canEdit: true, canDuplicate: false, message: 'Active employees cannot be deleted' },
    inactive: { canDelete: false, canEdit: true, canDuplicate: false, message: 'Inactive employees cannot be deleted' },
    on_leave: { canDelete: false, canEdit: true, canDuplicate: false, editableFields: ['phone', 'address', 'notes'], message: 'Employees on leave have limited editing' },
    terminated: { canDelete: true, canEdit: false, canDuplicate: false, message: 'Terminated employees cannot be edited' },
  },
};

// ==========================================
// CONFIGURATION REGISTRY
// ==========================================

export const STATUS_CONFIGS: Record<EntityType, StatusConfig> = {
  invoice: INVOICE_STATUS_CONFIG,
  bill: BILL_STATUS_CONFIG,
  quote: QUOTE_STATUS_CONFIG,
  purchaseOrder: PURCHASE_ORDER_STATUS_CONFIG,
  creditNote: CREDIT_NOTE_STATUS_CONFIG,
  debitNote: DEBIT_NOTE_STATUS_CONFIG,
  salarySlip: SALARY_SLIP_STATUS_CONFIG,
  employee: EMPLOYEE_STATUS_CONFIG,
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get status configuration for an entity type
 */
export function getStatusConfig(entityType: EntityType): StatusConfig {
  return STATUS_CONFIGS[entityType];
}

/**
 * Get all available statuses for an entity type
 */
export function getStatuses(entityType: EntityType): StatusOption[] {
  return STATUS_CONFIGS[entityType].statuses;
}

/**
 * Get allowed status transitions from a current status
 */
export function getAllowedTransitions(entityType: EntityType, currentStatus: string): string[] {
  const config = STATUS_CONFIGS[entityType];
  const transition = config.transitions.find(t => t.from === currentStatus);
  return transition?.to || [];
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(entityType: EntityType, fromStatus: string, toStatus: string): boolean {
  const allowedTransitions = getAllowedTransitions(entityType, fromStatus);
  return allowedTransitions.includes(toStatus);
}

/**
 * Check if a status transition requires confirmation
 */
export function requiresConfirmation(entityType: EntityType, fromStatus: string, toStatus: string): { required: boolean; message?: string } {
  const config = STATUS_CONFIGS[entityType];
  const transition = config.transitions.find(t => t.from === fromStatus);

  if (!transition || !transition.to.includes(toStatus)) {
    return { required: false };
  }

  return {
    required: transition.requiresConfirmation || false,
    message: transition.confirmationMessage,
  };
}

/**
 * Get validation rules for a specific status
 */
export function getStatusValidation(entityType: EntityType, status: string): StatusValidation {
  const config = STATUS_CONFIGS[entityType];
  return config.validations[status] || {
    canDelete: false,
    canEdit: false,
    canDuplicate: false,
    message: 'No validation rules defined for this status',
  };
}

/**
 * Get status option details (label, color, description)
 */
export function getStatusOption(entityType: EntityType, statusValue: string): StatusOption | undefined {
  const config = STATUS_CONFIGS[entityType];
  return config.statuses.find(s => s.value === statusValue);
}

/**
 * Get the default status for an entity type
 */
export function getDefaultStatus(entityType: EntityType): string {
  return STATUS_CONFIGS[entityType].defaultStatus;
}

/**
 * Get color for a status value
 */
export function getStatusColor(entityType: EntityType, statusValue: string): 'primary' | 'success' | 'warning' | 'danger' | 'neutral' {
  const option = getStatusOption(entityType, statusValue);
  return option?.color || 'neutral';
}

/**
 * Format status value for display
 */
export function formatStatus(entityType: EntityType, statusValue: string): string {
  const option = getStatusOption(entityType, statusValue);
  return option?.label || statusValue;
}

/**
 * Validate if an entity can be deleted based on its status
 */
export function canDelete(entityType: EntityType, status: string): { allowed: boolean; message?: string } {
  const validation = getStatusValidation(entityType, status);
  return {
    allowed: validation.canDelete,
    message: validation.canDelete ? undefined : (validation.message || 'Cannot delete entity with this status'),
  };
}

/**
 * Validate if an entity can be edited based on its status
 */
export function canEdit(entityType: EntityType, status: string, field?: string): { allowed: boolean; message?: string } {
  const validation = getStatusValidation(entityType, status);

  // If no specific field is provided, check general edit permission
  if (!field) {
    return {
      allowed: validation.canEdit,
      message: validation.canEdit ? undefined : (validation.message || 'Cannot edit entity with this status'),
    };
  }

  // If specific field is provided and there are editable fields defined
  if (validation.editableFields) {
    const allowed = validation.editableFields.includes(field);
    return {
      allowed,
      message: allowed ? undefined : `Field '${field}' cannot be edited for this status`,
    };
  }

  // If no specific editable fields defined, use general edit permission
  return {
    allowed: validation.canEdit,
    message: validation.canEdit ? undefined : (validation.message || 'Cannot edit entity with this status'),
  };
}

/**
 * Validate if an entity can be duplicated based on its status
 */
export function canDuplicate(entityType: EntityType, status: string): { allowed: boolean; message?: string } {
  const validation = getStatusValidation(entityType, status);
  return {
    allowed: validation.canDuplicate,
    message: validation.canDuplicate ? undefined : 'Cannot duplicate entity with this status',
  };
}
