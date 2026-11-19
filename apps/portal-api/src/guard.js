// Compliance hard-stop engine. Pure function: no I/O, no clock access (time is passed in by the server).
// Fails closed: any unexpected condition denies. Order follows the SMS-OCC-003 chain: A -> D -> E -> G -> cards.
export function expiryOk(v, now, sem) {
  if (typeof v !== 'string') return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const day = Date.parse(v + 'T00:00:00.000Z');
    if (Number.isNaN(day)) return false;
    return sem === 'exact_instant_utc' ? now < day : now <= day + 86399999;
  }
  if (/^\d{4}-\d{2}-\d{2}T[0-9:.]+Z$/.test(v)) {
    const at = Date.parse(v);
    return !Number.isNaN(at) && now < at;
  }
  return false;
}
export function companyReasons(contractor, now, policy) {
  if (!contractor) return ['CONTRACTOR_NOT_FOUND'];
  const r = [];
  if (!expiryOk(contractor.insuranceExpiry, now, policy.expirySemantics)) r.push('INSURANCE_EXPIRED');
  if (contractor.risqsStatus !== 'valid' || !expiryOk(contractor.risqsExpiry, now, policy.expirySemantics)) r.push('RISQS_INVALID');
  return r;
}
// kind: 'permit' (A,D,E for lead worker) | 'checkin' (A,D,E,G,cards)
export function evaluate(kind, c, now, policy) {
  try {
    const ok = (v) => expiryOk(v, now, policy.expirySemantics);
    const r = companyReasons(c.contractor, now, policy);
    const w = c.worker;
    if (!w) r.push('WORKER_NOT_FOUND');
    else {
      const ind = w.inductions?.[c.siteCode];
      if (!ind) r.push('INDUCTION_MISSING'); else if (!ok(ind)) r.push('INDUCTION_EXPIRED');
    }
    const m = c.rams;
    if (!m || m.status !== 'approved' || m.siteCode !== c.siteCode || m.contractorId !== c.contractor?.id) r.push('RAMS_NOT_APPROVED');
    else if (!ok(m.expiry)) r.push('RAMS_EXPIRED');
    if (kind === 'checkin') {
      const p = c.permit;
      if (!p) r.push('PERMIT_NOT_AUTHORISED');
      else if (p.status === 'revoked') r.push('PERMIT_REVOKED');
      else if (p.status !== 'authorised') r.push('PERMIT_NOT_AUTHORISED');
      else if (!ok(p.expiry)) r.push('PERMIT_EXPIRED');
      if (w) for (const card of policy.requiredCards) {
        const v = w.cards?.[card];
        if (!v) r.push(card.toUpperCase() + '_MISSING'); else if (!ok(v)) r.push(card.toUpperCase() + '_EXPIRED');
      }
    } else if (kind !== 'permit') return { allowed: false, reasons: ['GUARD_ERROR'], first: 'GUARD_ERROR' };
    return { allowed: r.length === 0, reasons: r, first: r[0] || null };
  } catch {
    return { allowed: false, reasons: ['GUARD_ERROR'], first: 'GUARD_ERROR' };
  }
}
