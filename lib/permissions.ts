import type { CompanyRole } from '@/types';

// ==========================================
// ROLE LABELS & DESCRIPTIONS
// ==========================================

export const ROLE_LABELS: Record<CompanyRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<CompanyRole, string> = {
  owner: 'Full access. Can manage team, billing, and delete the company.',
  admin: 'Can manage team members, edit all data, and change settings.',
  editor: 'Can create and edit transactions, invoices, bills, and records.',
  viewer: 'Read-only access. Can view data and reports but cannot make changes.',
};

export const ROLE_COLORS: Record<CompanyRole, 'primary' | 'success' | 'warning' | 'neutral'> = {
  owner: 'primary',
  admin: 'success',
  editor: 'warning',
  viewer: 'neutral',
};

// Roles sorted by privilege level (highest first)
export const ROLE_HIERARCHY: CompanyRole[] = ['owner', 'admin', 'editor', 'viewer'];

// Roles that can be assigned when inviting (owner can't be assigned)
export const ASSIGNABLE_ROLES: CompanyRole[] = ['admin', 'editor', 'viewer'];

// ==========================================
// PERMISSION ACTIONS
// ==========================================

export type PermissionAction =
  // Data CRUD
  | 'create_record'      // Create transactions, invoices, bills, etc.
  | 'edit_record'        // Edit existing records
  | 'delete_record'      // Delete records
  | 'view_record'        // View records and reports
  // Team management
  | 'invite_member'      // Invite new members
  | 'remove_member'      // Remove members
  | 'change_role'        // Change member roles
  // Company settings
  | 'edit_settings'      // Edit company settings
  | 'manage_security'    // Set/remove passcode
  | 'delete_company'     // Delete the company
  // AI & Chat
  | 'use_ai_chat'        // Use the AI chat
  // Exports
  | 'export_data'        // Export reports / PDFs;

// ==========================================
// PERMISSION MATRIX
// ==========================================

const PERMISSION_MATRIX: Record<CompanyRole, Set<PermissionAction>> = {
  owner: new Set<PermissionAction>([
    'create_record', 'edit_record', 'delete_record', 'view_record',
    'invite_member', 'remove_member', 'change_role',
    'edit_settings', 'manage_security', 'delete_company',
    'use_ai_chat', 'export_data',
  ]),
  admin: new Set<PermissionAction>([
    'create_record', 'edit_record', 'delete_record', 'view_record',
    'invite_member', 'remove_member', 'change_role',
    'edit_settings',
    'use_ai_chat', 'export_data',
  ]),
  editor: new Set<PermissionAction>([
    'create_record', 'edit_record', 'view_record',
    'use_ai_chat', 'export_data',
  ]),
  viewer: new Set<PermissionAction>([
    'view_record',
    'export_data',
  ]),
};

// ==========================================
// HELPERS
// ==========================================

/** Check if a role has permission to perform an action */
export function canPerformAction(role: CompanyRole, action: PermissionAction): boolean {
  return PERMISSION_MATRIX[role]?.has(action) ?? false;
}

/** Check if a role can manage another role (must be strictly higher) */
export function canManageRole(actorRole: CompanyRole, targetRole: CompanyRole): boolean {
  const actorIndex = ROLE_HIERARCHY.indexOf(actorRole);
  const targetIndex = ROLE_HIERARCHY.indexOf(targetRole);
  return actorIndex < targetIndex; // Lower index = higher privilege
}

/** Get the list of roles that this role can assign to others */
export function getAssignableRoles(actorRole: CompanyRole): CompanyRole[] {
  return ASSIGNABLE_ROLES.filter(r => canManageRole(actorRole, r));
}

/** Get a role's privilege level (0 = highest) */
export function getRoleLevel(role: CompanyRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}
