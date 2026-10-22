import { today0 } from './ui';

export const MIN_MASS = 50.0;

export function carTotals(rows, group) {
  const parts = rows.filter((i) => i.grp === group);
  const total = Math.round(parts.reduce((s, p) => s + Number(p.mass) * p.qty, 0) * 100) / 100;
  const margin = Math.round((total - MIN_MASS) * 100) / 100;
  const status = margin < 0 ? { tone: 'alert', l: 'Non conforme' } : margin < 0.5 ? { tone: 'race', l: 'Zone limite' } : { tone: 'ok', l: 'Conforme' };
  return { total, margin, status };
}

export const effStatus = (m) =>
  m.statut === 'Terminé' ? 'Terminé' : new Date(m.end_date) < today0() ? 'En alerte retard' : m.statut;
