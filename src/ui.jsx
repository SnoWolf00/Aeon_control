export const inp = 'w-full bg-bg0 border border-line rounded-md px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-race disabled:opacity-50';
export const btn = 'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-50';
export const btnP = btn + ' bg-race text-black hover:bg-orange-400';
export const btnG = btn + ' border border-line text-slate-200 hover:bg-c2';

export const crit = (c) =>
  c > 15 ? { t: 'text-alert', bg: 'bg-alert/15 border-alert/40', l: 'Majeur' }
  : c >= 8 ? { t: 'text-race', bg: 'bg-race/15 border-race/40', l: 'Modéré' }
  : { t: 'text-ok', bg: 'bg-ok/15 border-ok/40', l: 'Maîtrisé' };

const P = {
  dash: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
};
export function Icon({ n, size = 18, className = '' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[n] }} />;
}
export const Card = ({ className = '', children }) => <div className={'bg-c1 border border-line rounded-xl ' + className}>{children}</div>;
export const Field = ({ label, children, className = '' }) => <label className={'block ' + className}><span className="block text-xs text-slate-400 mb-1">{label}</span>{children}</label>;
export function Badge({ tone = 'slate', children }) {
  const t = { ok: 'bg-ok/15 text-ok border-ok/40', alert: 'bg-alert/15 text-alert border-alert/40', race: 'bg-race/15 text-race border-race/40', cyan: 'bg-cyan/15 text-cyan border-cyan/40', slate: 'bg-slate-500/15 text-slate-300 border-slate-500/40' }[tone];
  return <span className={'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ' + t}>{children}</span>;
}
export function Title({ icon, title, sub, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <div className="flex items-center gap-2.5 text-race"><Icon n={icon} size={22} /><h2 className="font-display text-3xl font-semibold text-white leading-none">{title}</h2></div>
        {sub && <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export const fdate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
export const gr = (n) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' g';
export const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
