// In-memory SYNTHETIC store. Production replaces this with the UK-resident database (same interface of get/set by id).
export function createStore(config, now) {
  const iso = (d) => new Date(now + d * 864e5).toISOString().slice(0, 10);
  const [s1, s2] = config.sites.map((s) => s.code);
  const sites = new Map(config.sites.map((s) => [s.code, { ...s }]));
  const mk = (id, name) => ({ id, name, insuranceExpiry: iso(365), risqsStatus: 'valid', risqsExpiry: iso(365) });
  const contractors = new Map([['c_alpha', mk('c_alpha', 'Synthetic Contractor Alpha')], ['c_beta', mk('c_beta', 'Synthetic Contractor Beta')]]);
  const wk = (id, contractorId, name, ind) => ({ id, contractorId, name, cards: { sentinel: iso(300), cscs: iso(300) }, inductions: ind });
  const workers = new Map([
    ['w_a1', wk('w_a1', 'c_alpha', 'Synthetic Worker A1', { [s1]: iso(200), [s2]: iso(200) })],
    ['w_a2', wk('w_a2', 'c_alpha', 'Synthetic Worker A2', {})],
    ['w_b1', wk('w_b1', 'c_beta', 'Synthetic Worker B1', { [s1]: iso(200) })],
  ]);
  const rams = new Map([
    ['r_alpha_1', { id: 'r_alpha_1', contractorId: 'c_alpha', siteCode: s1, status: 'approved', expiry: iso(100) }],
    ['r_beta_1', { id: 'r_beta_1', contractorId: 'c_beta', siteCode: s1, status: 'submitted', expiry: iso(100) }],
  ]);
  const u = (id, username, role, contractorId = null, workerId = null) => ({ id, username, role, contractorId, workerId });
  const users = [
    u('u_tfw', 'tfw.admin', 'tfw_admin'), u('u_aa', 'alpha.admin', 'contractor_admin', 'c_alpha'), u('u_ba', 'beta.admin', 'contractor_admin', 'c_beta'),
    u('u_ap', 'approver', 'permit_approver'), u('u_sm', 'sitemgr', 'site_manager'), u('u_so', 'safety', 'safety_officer'),
    u('u_w1', 'alpha.w1', 'worker', 'c_alpha', 'w_a1'), u('u_w2', 'alpha.w2', 'worker', 'c_alpha', 'w_a2'), u('u_wb', 'beta.w1', 'worker', 'c_beta', 'w_b1'),
    u('u_au', 'auditor', 'auditor'), u('u_su', 'support', 'support'),
  ];
  return { sites, contractors, workers, rams, permits: new Map(), attendance: [], users, seq: 0 };
}
