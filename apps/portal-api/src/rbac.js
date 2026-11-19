export const PERMS = {
  'permit.request': ['contractor_admin'],
  'permit.authorise': ['permit_approver'],
  'permit.revoke': ['permit_approver', 'safety_officer'],
  'permit.read': ['contractor_admin', 'permit_approver', 'safety_officer', 'site_manager', 'tfw_admin', 'auditor'],
  'credential.verify': ['safety_officer', 'tfw_admin'],
  'induction.record': ['site_manager', 'safety_officer'],
  'rams.submit': ['contractor_admin'],
  'rams.approve': ['safety_officer'],
  'compliance.read': ['contractor_admin', 'safety_officer', 'tfw_admin', 'auditor', 'permit_approver'],
  'directory.read': ['contractor_admin', 'safety_officer', 'tfw_admin', 'auditor', 'permit_approver', 'site_manager'],
  'checkin': ['worker'],
  'rollcall.read': ['site_manager', 'safety_officer', 'tfw_admin'],
  'audit.read': ['auditor', 'tfw_admin', 'safety_officer'],
};
export const CROSS_TENANT = new Set(['tfw_admin', 'safety_officer', 'auditor', 'permit_approver', 'site_manager']);
export const can = (role, perm) => (PERMS[perm] || []).includes(role);
export const inScope = (user, contractorId) => CROSS_TENANT.has(user.role) || (user.contractorId != null && user.contractorId === contractorId);
