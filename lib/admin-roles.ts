/**
 * Admin Role-Based Access Control (RBAC).
 * Defines roles, permissions, and the role → permissions mapping.
 *
 * Used by:
 *   - Server: lib/admin-server.ts (verifyAdminRequest checks permissions)
 *   - Client: components/admin/AdminSidebar.tsx (filter visible menu items)
 *   - Client: app/admin/admin-users/page.tsx (assign roles)
 */

export type AdminRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

export const ADMIN_ROLES: AdminRole[] = ['super_admin', 'admin', 'editor', 'viewer'];

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  super_admin: 'Full access — including managing other admin users and roles.',
  admin: 'Manage users, content, support, and platform — cannot manage other admins.',
  editor: 'Manage content (blog, testimonials, announcements) and respond to support.',
  viewer: 'Read-only access to dashboards, users, support, and analytics.',
};

export const ROLE_COLORS: Record<AdminRole, 'danger' | 'primary' | 'success' | 'neutral'> = {
  super_admin: 'danger',
  admin: 'primary',
  editor: 'success',
  viewer: 'neutral',
};

/**
 * Permission keys are formatted as `<resource>:<action>`.
 * The wildcard '*' grants every permission (super_admin only).
 */
export type Permission =
  | '*'
  // Dashboard
  | 'dashboard:view'
  // Users (the app's end-users)
  | 'users:view'
  | 'users:edit'
  | 'users:delete'
  | 'users:grant_tokens'
  | 'users:change_plan'
  | 'users:send_email'
  // Subscriptions
  | 'subscriptions:view'
  // AI usage / analytics
  | 'analytics:view'
  | 'ai_usage:view'
  // Announcements
  | 'announcements:view'
  | 'announcements:create'
  // Email & Newsletter
  | 'emails:send'
  | 'newsletter:manage'
  // Notifications
  | 'notifications:view'
  | 'notifications:send'
  | 'notifications:delete'
  // Blog
  | 'blogs:view'
  | 'blogs:create'
  | 'blogs:edit'
  | 'blogs:delete'
  // Testimonials
  | 'testimonials:view'
  | 'testimonials:manage'
  // Support
  | 'support:view'
  | 'support:respond'
  // Feedback
  | 'feedback:view'
  | 'feedback:respond'
  // Bug reports
  | 'reports:view'
  // Status page
  | 'status:view'
  | 'status:manage'
  // Activity log
  | 'activity:view'
  // System
  | 'system:view'
  // Admin user management (super_admin only)
  | 'admin_users:view'
  | 'admin_users:manage';

export const ALL_PERMISSIONS: Exclude<Permission, '*'>[] = [
  'dashboard:view',
  'users:view', 'users:edit', 'users:delete', 'users:grant_tokens',
  'users:change_plan', 'users:send_email',
  'subscriptions:view',
  'analytics:view', 'ai_usage:view',
  'announcements:view', 'announcements:create',
  'emails:send', 'newsletter:manage',
  'notifications:view', 'notifications:send', 'notifications:delete',
  'blogs:view', 'blogs:create', 'blogs:edit', 'blogs:delete',
  'testimonials:view', 'testimonials:manage',
  'support:view', 'support:respond',
  'feedback:view', 'feedback:respond',
  'reports:view',
  'status:view', 'status:manage',
  'activity:view',
  'system:view',
  'admin_users:view', 'admin_users:manage',
];

/**
 * Default permissions for each role.
 * super_admin uses '*' wildcard which grants everything (including future permissions).
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ['*'],
  admin: [
    'dashboard:view',
    'users:view', 'users:edit', 'users:delete', 'users:grant_tokens',
    'users:change_plan', 'users:send_email',
    'subscriptions:view',
    'analytics:view', 'ai_usage:view',
    'announcements:view', 'announcements:create',
    'emails:send', 'newsletter:manage',
    'notifications:view', 'notifications:send', 'notifications:delete',
    'blogs:view', 'blogs:create', 'blogs:edit', 'blogs:delete',
    'testimonials:view', 'testimonials:manage',
    'support:view', 'support:respond',
    'feedback:view', 'feedback:respond',
    'reports:view',
    'status:view', 'status:manage',
    'activity:view',
    'system:view',
  ],
  editor: [
    'dashboard:view',
    'users:view',
    'analytics:view',
    'announcements:view', 'announcements:create',
    'newsletter:manage',
    'notifications:view',
    'blogs:view', 'blogs:create', 'blogs:edit',
    'testimonials:view', 'testimonials:manage',
    'support:view', 'support:respond',
    'feedback:view', 'feedback:respond',
    'activity:view',
  ],
  viewer: [
    'dashboard:view',
    'users:view',
    'subscriptions:view',
    'analytics:view', 'ai_usage:view',
    'announcements:view',
    'notifications:view',
    'blogs:view',
    'testimonials:view',
    'support:view',
    'feedback:view',
    'reports:view',
    'status:view',
    'activity:view',
  ],
};

/**
 * Returns true if the given role (and optional per-user permission override list)
 * grants the requested permission.
 */
export function hasPermission(
  role: AdminRole,
  required: Permission,
  overrides?: Permission[] | null
): boolean {
  if (overrides && overrides.length > 0) {
    if (overrides.includes('*')) return true;
    return overrides.includes(required);
  }
  const grants = ROLE_PERMISSIONS[role] || [];
  if (grants.includes('*')) return true;
  return grants.includes(required);
}

/**
 * Permission groups for the role-management UI.
 */
export const PERMISSION_GROUPS: Array<{ label: string; permissions: Permission[] }> = [
  {
    label: 'Dashboard & Analytics',
    permissions: ['dashboard:view', 'analytics:view', 'ai_usage:view', 'activity:view'],
  },
  {
    label: 'Users',
    permissions: [
      'users:view', 'users:edit', 'users:delete',
      'users:grant_tokens', 'users:change_plan', 'users:send_email',
    ],
  },
  {
    label: 'Subscriptions',
    permissions: ['subscriptions:view'],
  },
  {
    label: 'Communication',
    permissions: [
      'announcements:view', 'announcements:create',
      'emails:send', 'newsletter:manage',
      'notifications:view', 'notifications:send', 'notifications:delete',
    ],
  },
  {
    label: 'Content',
    permissions: [
      'blogs:view', 'blogs:create', 'blogs:edit', 'blogs:delete',
      'testimonials:view', 'testimonials:manage',
    ],
  },
  {
    label: 'Support & Feedback',
    permissions: [
      'support:view', 'support:respond',
      'feedback:view', 'feedback:respond',
      'reports:view',
    ],
  },
  {
    label: 'Status Page',
    permissions: ['status:view', 'status:manage'],
  },
  {
    label: 'System',
    permissions: ['system:view'],
  },
  {
    label: 'Admin Users (Super Admin)',
    permissions: ['admin_users:view', 'admin_users:manage'],
  },
];

export const PERMISSION_LABELS: Record<Exclude<Permission, '*'>, string> = {
  'dashboard:view': 'View dashboard',
  'users:view': 'View users',
  'users:edit': 'Edit user details',
  'users:delete': 'Delete users',
  'users:grant_tokens': 'Grant tokens / messages',
  'users:change_plan': 'Change user plan',
  'users:send_email': 'Send user emails',
  'subscriptions:view': 'View subscriptions',
  'analytics:view': 'View analytics',
  'ai_usage:view': 'View AI usage',
  'announcements:view': 'View announcements',
  'announcements:create': 'Create announcements',
  'emails:send': 'Send platform emails',
  'newsletter:manage': 'Manage newsletter',
  'notifications:view': 'View notifications',
  'notifications:send': 'Send notifications',
  'notifications:delete': 'Delete notifications',
  'blogs:view': 'View blog posts',
  'blogs:create': 'Create blog posts',
  'blogs:edit': 'Edit blog posts',
  'blogs:delete': 'Delete blog posts',
  'testimonials:view': 'View testimonials',
  'testimonials:manage': 'Manage testimonials',
  'support:view': 'View support tickets',
  'support:respond': 'Respond to tickets',
  'feedback:view': 'View feedback',
  'feedback:respond': 'Respond to feedback',
  'reports:view': 'View bug reports',
  'status:view': 'View status page',
  'status:manage': 'Manage status / incidents',
  'activity:view': 'View activity log',
  'system:view': 'View system info',
  'admin_users:view': 'View admin users',
  'admin_users:manage': 'Create / edit / delete admin users',
};
