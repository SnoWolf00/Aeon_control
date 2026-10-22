import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useTable } from '../useTable';
import { useAuth } from '../auth';
import { Card, Title, Field, Badge, Icon, inp, btnP, btnG, gr } from '../ui';

const MIN_MASS = 50.0;
const ORDER = { col: 'name', asc: true };
const GROUPS = ['Voiture A', 'Voiture B', 'Spares'];

function carTotals(rows, group) {
  const parts = rows.filter((i) => i.grp === group);
  const total = Math.round(parts.reduce((s, p) => s + Number(p.mass) * p.qty, 0) * 100) / 100;
  const margin = Math.round((total - MIN_MASS) * 100) / 100;
  const status = margin < 0 ? { tone: 'alert', l: 'Non conforme' } : margin < 0.5 ? { tone: 'race', l: 'Zone limite' } : { tone: 'ok', l: 'Conforme' };
  return { total, margin, status };
}

// Champ de masse : on enregistre à la sortie du champ, pas à chaque frappe.
function MassInput({ value, disabled, onCommit, label }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  const commit = () => {
    const n = parseFloat(v.replace(',', '.'));
    if (!isNaN(n) && n !== Number(value)) onCommit(n); else setV(String(value));
  };
  return <input inputMode="decimal" disabled={disabled} className={inp + ' w-24'} value={v} aria-label={label}
    onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />;
}

function CarCard({ name, T }) {
  const tone = T.status.tone;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div><div className="text-sm text-slate-400">{name === 'Voiture A' ? 'Course officielle' : 'Scrutineering / Show car'}</div><h3 className="font-display text-2xl font-semibold text-white">{name}</h3></div>
        <Badge tone={tone}>{T.status.l}</Badge>
      </div>
      <div className="flex items-end gap-2 mt-3"><span className="font-display text-5xl font-semibold text-white leading-none">{T.total.toFixed(2).replace('.', ',')}</span><span className="text-slate-400 mb-1">g</span></div>
      <div className="mt-3">
        <div className="relative h-2.5 bg-bg0 rounded-full overflow-hidden">
          <div className={'h-full rounded-full ' + (tone === 'ok' ? 'bg-ok' : tone === 'race' ? 'bg-race' : 'bg-alert')} style={{ width: Math.min(100, Math.max(0, ((T.total - 48) / 6) * 100)) + '%' }} />
          <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: ((MIN_MASS - 48) / 6) * 100 + '%' }} />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1.5"><span>48 g</span><span>Minimum légal {gr(MIN_MASS)}</span><span>54 g</span></div>
      </div>
      <p className="text-sm mt-3 text-slate-300">
        Marge : <span className={'font-semibold ' + (T.margin < 0 ? 'text-alert' : T.margin < 0.5 ? 'text-race' : 'text-ok')}>{(T.margin >= 0 ? '+' : '') + T.margin.toFixed(2).replace('.', ',')} g</span>
        {T.margin >= 0 && T.margin < 0.5 && ' · surveiller la peinture et le vernis'}
        {T.margin < 0 && ' · ajouter du lest avant la pesée officielle'}
      </p>
    </Card>
  );
}

export default function Inventory() {
  const { rows, loading, error } = useTable('inventory_items', ORDER);
  const { canWrite, isLead, logActivity } = useAuth();
  const [group, setGroup] = useState('Tous');
  const [onlyAlert, setOnlyAlert] = useState(false);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(null);
  const blank = { grp: 'Spares', name: '', mass: '', ref: '', qty: 1 };
  const [f, setF] = useState(blank);

  const A = carTotals(rows, 'Voiture A'), B = carTotals(rows, 'Voiture B');
  const dev = (p) => Math.abs(Number(p.mass) - Number(p.ref));
  const partAlert = (p) => (p.ctrl === 'Manquant' ? 'alert' : dev(p) > 0.25 ? 'alert' : dev(p) > 0.1 ? 'race' : null);
  const shown = rows.filter((p) => (group === 'Tous' || p.grp === group) && (!onlyAlert || partAlert(p) || p.ctrl !== 'Contrôlé'));

  const run = async (q) => { const { error } = await q; setErr(error ? error.message : null); return !error; };
  const upd = (id, patch) => run(supabase.from('inventory_items').update(patch).eq('id', id));
  const add = async () => {
    if (!f.name.trim() || f.mass === '') return;
    const mass = parseFloat(String(f.mass).replace(',', '.'));
    const ref = f.ref === '' ? mass : parseFloat(String(f.ref).replace(',', '.'));
    if (await run(supabase.from('inventory_items').insert({ grp: f.grp, name: f.name, mass, ref, qty: +f.qty || 1, ctrl: 'À vérifier' }))) {
      logActivity('inv', `Pièce ajoutée à l’inventaire : ${f.name} (${f.grp})`); setF(blank); setOpen(false);
    }
  };
  const remove = async (p) => { if (window.confirm(`Supprimer « ${p.name} » ?`)) run(supabase.from('inventory_items').delete().eq('id', p.id)); };

  return (
    <div>
      <Title icon="flag" title="Pitlane Inventory & Spares" sub="Chaque pièce critique est pesée au centième de gramme et comparée à sa valeur CAO. Les totaux des voitures se recalculent à chaque pesée.">
        {canWrite && <button className={btnG} onClick={() => setOpen(!open)}><Icon n="plus" size={16} />Ajouter une pièce</button>}
      </Title>
      {(err || error) && <div className="mb-4 rounded-lg border border-alert/40 bg-alert/10 text-sm text-slate-200 px-4 py-3">Erreur : {err || error}</div>}
      <div className="grid md:grid-cols-2 gap-4 mb-5"><CarCard name="Voiture A" T={A} /><CarCard name="Voiture B" T={B} /></div>

      {open && (
        <Card className="p-5 mb-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Field label="Groupe"><select className={inp} value={f.grp} onChange={(e) => setF({ ...f, grp: e.target.value })}>{GROUPS.map((g) => <option key={g}>{g}</option>)}</select></Field>
            <Field label="Désignation" className="lg:col-span-2"><input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Masse mesurée (g)"><input inputMode="decimal" className={inp} value={f.mass} onChange={(e) => setF({ ...f, mass: e.target.value })} /></Field>
            <Field label="Masse CAO (g)"><input inputMode="decimal" className={inp} value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} /></Field>
            <Field label="Quantité"><input type="number" min="1" className={inp} value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-4"><button className={btnG} onClick={() => setOpen(false)}>Annuler</button><button className={btnP} onClick={add}>Ajouter la pièce</button></div>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {['Tous', ...GROUPS].map((g) => <button key={g} onClick={() => setGroup(g)} className={'px-3 py-1.5 rounded-md text-sm font-medium border ' + (group === g ? 'bg-race text-black border-race' : 'border-line text-slate-300 hover:bg-c2')}>{g}</button>)}
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-300 cursor-pointer"><input type="checkbox" className="accent-orange-500 w-4 h-4" checked={onlyAlert} onChange={(e) => setOnlyAlert(e.target.checked)} />Alertes et pièces à vérifier</label>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scroll-x">
          <table className="w-full text-sm min-w-[860px]">
            <thead><tr className="text-left text-xs text-slate-400 border-b border-line bg-c2">{['Groupe', 'Désignation', 'Qté', 'Masse mesurée (g)', 'Masse CAO (g)', 'Écart', 'Contrôle', 'Conformité', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {shown.map((p) => {
                const al = partAlert(p), dv = Number(p.mass) - Number(p.ref);
                return (
                  <tr key={p.id} className="border-b border-line/70 hover:bg-c2/50">
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{p.grp}</td>
                    <td className="px-4 py-2.5 text-white font-medium">{p.name}</td>
                    <td className="px-4 py-2.5 text-slate-300">{p.qty}</td>
                    <td className="px-4 py-2.5"><MassInput value={p.mass} disabled={!canWrite} label={'Masse de ' + p.name} onCommit={(n) => upd(p.id, { mass: n })} /></td>
                    <td className="px-4 py-2.5 text-slate-400">{Number(p.ref).toFixed(2).replace('.', ',')}</td>
                    <td className={'px-4 py-2.5 font-semibold ' + (dev(p) > 0.25 ? 'text-alert' : dev(p) > 0.1 ? 'text-race' : 'text-slate-300')}>{(dv >= 0 ? '+' : '') + dv.toFixed(2).replace('.', ',')}</td>
                    <td className="px-4 py-2.5">
                      <select disabled={!canWrite} value={p.ctrl} onChange={(e) => upd(p.id, { ctrl: e.target.value })} className="bg-bg0 border border-line rounded-md px-2 py-1.5 text-xs text-slate-200">
                        {['Contrôlé', 'À vérifier', 'Manquant'].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">{al === 'alert' ? <Badge tone="alert">{p.ctrl === 'Manquant' ? 'Manquant' : 'Écart critique'}</Badge> : al === 'race' ? <Badge tone="race">Zone limite</Badge> : <Badge tone="ok">Conforme</Badge>}</td>
                    <td className="px-4 py-2.5">{isLead && <button onClick={() => remove(p)} className="p-1 text-slate-500 hover:text-alert" aria-label="Supprimer"><Icon n="trash" size={16} /></button>}</td>
                  </tr>
                );
              })}
              {!loading && shown.length === 0 && <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-400">Aucune pièce à afficher dans cette sélection.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-slate-500 mt-3">Écart CAO : orange au-delà de 0,10 g, rouge au-delà de 0,25 g. La masse s’enregistre en quittant le champ ou avec Entrée.</p>
    </div>
  );
}
