import { useEffect, useRef, useState } from 'react';
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
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
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

export const eur = (n) => Number(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));
export const ago = (ts) => {
  const m = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
};
export function Bar({ value, color = 'bg-race', h = 'h-2' }) {
  return <div className={'w-full bg-bg0 rounded-full overflow-hidden ' + h}><div className={'h-full rounded-full transition-all ' + color} style={{ width: Math.min(100, Math.max(0, value)) + '%' }} /></div>;
}
export function Modal({ title, onClose, children }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/70" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-c1 border border-line rounded-t-xl sm:rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-c2" aria-label="Fermer"><Icon n="x" /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
export function TextExport({ text, hint }) {
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch (e) { ref.current && ref.current.select(); }
  };
  return (
    <div>
      <textarea ref={ref} readOnly value={text} className={inp + ' font-mono text-xs h-80 resize-none'} onFocus={(e) => e.target.select()} />
      <div className="flex justify-between items-center mt-3 gap-3">
        <span className="text-xs text-slate-500">{hint}</span>
        <button className={btnP} onClick={copy}><Icon n={copied ? 'check' : 'copy'} size={16} />{copied ? 'Copié' : 'Copier'}</button>
      </div>
    </div>
  );
}
