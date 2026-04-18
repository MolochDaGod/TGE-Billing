/**
 * Role-Based Access Control (RBAC) System
 * 
 * Role Hierarchy (highest to lowest):
 * 1. pirate_king - Business Owner (top-level authority)
 * 2. admin - System administrators
 * 3. partner - Company partners who can create invoices and manage their company
 * 4. staff_captain - Department managers who oversee staff
 * 5. staff - Employees who work under managers
 * 6. vendor - Service providers who can manage their own work and invoices
 * 7. sparky_ai - AI agent with advanced capabilities
 * 8. sparky - Basic AI assistant
 * 9. client - Customers using the portal to request services
 */

export const ROLES = {
  PIRATE_KING: "pirate_king",
  ADMIN: "admin",
  PARTNER: "partner",
  CAPITAL_MEMBER: "capital_member",
  STAFF_CAPTAIN: "staff_captain",
  STAFF: "staff",
  VENDOR: "vendor",
  SPARKY_AI: "sparky_ai",
  SPARKY: "sparky",
  CLIENT: "client",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

/**
 * Role hierarchy levels (higher number = more permissions)
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.PIRATE_KING]: 9,
  [ROLES.ADMIN]: 8,
  [ROLES.PARTNER]: 7,
  [ROLES.CAPITAL_MEMBER]: 7,
  [ROLES.STAFF_CAPTAIN]: 6,
  [ROLES.STAFF]: 5,
  [ROLES.VENDOR]: 4,
  [ROLES.SPARKY_AI]: 3,
  [ROLES.SPARKY]: 2,
  [ROLES.CLIENT]: 1,
};

/**
 * Check if a user has sufficient permissions for a required role
 */
export function hasRole(userRole: string, requiredRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as Role] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(userRole: string, roles: Role[]): boolean {
  return roles.some((role) => hasRole(userRole, role));
}

/**
 * Get all roles with equal or higher permissions
 */
export function getRolesWithMinimumLevel(minimumRole: Role): Role[] {
  const minimumLevel = ROLE_HIERARCHY[minimumRole];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level >= minimumLevel)
    .map(([role]) => role as Role);
}

/**
 * Role display names for UI
 */
export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [ROLES.PIRATE_KING]: "Owner",
  [ROLES.ADMIN]: "Administrator",
  [ROLES.PARTNER]: "Partner",
  [ROLES.CAPITAL_MEMBER]: "Capital Member",
  [ROLES.STAFF_CAPTAIN]: "Team Lead",
  [ROLES.STAFF]: "Staff",
  [ROLES.VENDOR]: "Vendor",
  [ROLES.SPARKY_AI]: "AI Agent",
  [ROLES.SPARKY]: "AI Assistant",
  [ROLES.CLIENT]: "Customer",
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.PIRATE_KING]: "Business owner with full system control",
  [ROLES.ADMIN]: "System administrator with full management access",
  [ROLES.PARTNER]: "Company partner who can manage operations and create invoices",
  [ROLES.CAPITAL_MEMBER]: "Capital investor/member with partner-level access to operations and billing",
  [ROLES.STAFF_CAPTAIN]: "Team lead who oversees staff and operations",
  [ROLES.STAFF]: "Team member working under a team lead",
  [ROLES.VENDOR]: "Contractor who can manage their own invoices and jobs",
  [ROLES.SPARKY_AI]: "AI agent with advanced automation capabilities",
  [ROLES.SPARKY]: "AI assistant for platform support",
  [ROLES.CLIENT]: "Customer using the portal to request and book services",
};

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: Role) {
  const basePermissions = {
    canViewDashboard: true,
    canViewClients: false,
    canManageClients: false,
    canViewInvoices: false,
    canCreateInvoices: false,
    canManageInvoices: false,
    canViewJobs: false,
    canManageJobs: false,
    canViewUsers: false,
    canManageUsers: false,
    canViewCompanies: false,
    canManageCompanies: false,
    canViewSettings: false,
    canManageSettings: false,
    canViewReports: false,
    canManageStaff: false,
    canAccessAI: false,
    canManageAI: false,
  };

  switch (role) {
    case ROLES.PIRATE_KING:
      return {
        ...basePermissions,
        canViewClients: true,
        canManageClients: true,
        canViewInvoices: true,
        canCreateInvoices: true,
        canManageInvoices: true,
        canViewJobs: true,
        canManageJobs: true,
        canViewUsers: true,
        canManageUsers: true,
        canViewCompanies: true,
        canManageCompanies: true,
        canViewSettings: true,
        canManageSettings: true,
        canViewReports: true,
        canManageStaff: true,
        canAccessAI: true,
        canManageAI: true,
      };

    case ROLES.ADMIN:
      return {
        ...basePermissions,
        canViewClients: true,
        canManageClients: true,
        canViewInvoices: true,
        canCreateInvoices: true,
        canManageInvoices: true,
        canViewJobs: true,
        canManageJobs: true,
        canViewUsers: true,
        canManageUsers: true,
        canViewSettings: true,
        canManageSettings: true,
        canViewReports: true,
        canManageStaff: true,
        canAccessAI: true,
      };

    case ROLES.PARTNER:
    case ROLES.CAPITAL_MEMBER:
      return {
        ...basePermissions,
        canViewClients: true,
        canManageClients: true,
        canViewInvoices: true,
        canCreateInvoices: true,
        canManageInvoices: true,
        canViewJobs: true,
        canManageJobs: true,
        canViewSettings: true,
        canViewReports: true,
        canManageStaff: true,
        canAccessAI: true,
      };

    case ROLES.STAFF_CAPTAIN:
      return {
        ...basePermissions,
        canViewClients: true,
        canManageClients: true,
        canViewInvoices: true,
        canCreateInvoices: true,
        canViewJobs: true,
        canManageJobs: true,
        canViewReports: true,
        canManageStaff: true, // Can manage staff in their department
        canAccessAI: true,
      };

    case ROLES.STAFF:
      return {
        ...basePermissions,
        canViewClients: true,
        canViewInvoices: true,
        canViewJobs: true,
        canManageJobs: true, // Can update jobs assigned to them
        canAccessAI: true,
      };

    case ROLES.VENDOR:
      return {
        ...basePermissions,
        canViewInvoices: true, // Only their own invoices
        canCreateInvoices: true, // Can create invoices for their work
        canViewJobs: true, // Only their own jobs
        canManageJobs: true, // Can manage their assigned jobs
        canAccessAI: true, // Can use Sparky for help
      };

    case ROLES.SPARKY_AI:
    case ROLES.SPARKY:
      return {
        ...basePermissions,
        canAccessAI: true,
      };

    case ROLES.CLIENT:
      return {
        ...basePermissions,
        canAccessAI: true, // Can ask Sparky questions about services
        canViewInvoices: true, // Can view their own invoices
        canViewJobs: true, // Can view their own jobs/appointments
      };

    default:
      return basePermissions;
  }
}
