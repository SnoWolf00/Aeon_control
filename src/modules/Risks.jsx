import { useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { useTable } from '../useTable';
import { useAuth } from '../auth';
import { Card, Title, Field, Icon, inp, btnP, btnG, crit } from '../ui';
import { TEAM_POLES } from '../lib';

const POLES = ['CAO / Simulation', 'Usinage', 'Assemblage', 'Logistique', 'Partenariats', 'Communication', 'Finance'];
const ORDER = { col: 'created_at', asc: true };

export default function Risks() {
  const { rows, loading, error } = useTable('risks', ORDER);
  const { profiles, session, canWrite, isLead, nameOf, poleOf, me, logActivity } = useAuth();
  const [filter, setFilter] = useState('Tous');
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(null);
  const blank = { risque: '', pole: POLES[0], g: 3, p: 3, plan_b: '', responsable: session.user.id, statut: 'Prêt' };
  const [f, setF] = useState(blank);

  const list = useMemo(
    () => rows.map((r) => ({ ...r, c: r.g * r.p })).filter((r) => filter === 'Tous' || (filter === 'Majeurs' ? r.c > 15 : !!me?.pole && poleOf(r.responsable) === me.pole)).sort((a, b) => b.c - a.c),
    [rows, filter, profiles, me?.pole]
  );

  const run = async (q) => { const { error } = await q; setErr(error ? error.message : null); return !error; };
  const update = (id, patch) => run(supabase.from('risks').update(patch).eq('id', id));

  const add = async () => {
    if (!f.risque.trim()) return;
    const ok = await run(supabase.from('risks').insert({ ...f, g: +f.g, p: +f.p }));
    if (ok) { logActivity('risk', `Risque ajouté à l’AMDEC : ${f.risque}`); setF(blank); setOpen(false); }
  };
  const setStatut = async (r, statut) => {
    if (await update(r.id, { statut })) logActivity('risk', `Plan B « ${statut.toLowerCase()} » : ${r.risque}`);
  };
  const remove = async (r) => {
    if (!window.confirm(`Supprimer le risque « ${r.risque} » ?`)) return;
    if (await run(supabase.from('risks').delete().eq('id', r.id))) logActivity('risk', `Risque supprimé : ${r.risque}`);
  };
  const score = (r, key) => (
    <select disabled={!canWrite} className={inp + ' w-16 px-2'} value={r[key]} onChange={(e) => update(r.id, { [key]: +e.target.value })}>
      {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
    </select>
  );

  return (
    <div>
      <Title icon="alert" title="Matrice des risques (AMDEC)" sub="Chaque panne ou crise anticipée a un plan B, un responsable et un statut. Criticité = gravité × probabilité. Les modifications apparaissent en direct chez tous les membres.">
        <div className="flex rounded-md border border-line overflow-hidden">
          {[['Tous', 'Tous'], ['Majeurs', 'Risques majeurs'], ...(me?.pole ? [['Pole', 'Mon pôle']] : [])].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={'px-3 py-2 text-sm font-medium ' + (filter === k ? 'bg-race text-black' : 'text-slate-300 hover:bg-c2')}>{l}</button>
          ))}
        </div>
        {canWrite && <button className={btnG} onClick={() => setOpen(!open)}><Icon n="plus" size={16} />Ajouter un risque</button>}
      </Title>

      {(err || error) && <div className="mb-4 rounded-lg border border-alert/40 bg-alert/10 text-sm text-slate-200 px-4 py-3">Erreur : {err || error}</div>}

      {open && (
        <Card className="p-5 mb-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Risque identifié" className="lg:col-span-2"><input className={inp} value={f.risque} onChange={(e) => setF({ ...f, risque: e.target.value })} /></Field>
            <Field label="Pôle"><select className={inp} value={f.pole} onChange={(e) => setF({ ...f, pole: e.target.value })}>{POLES.map((p) => <option key={p}>{p}</option>)}</select></Field>
            <Field label="Responsable"><select className={inp} value={f.responsable} onChange={(e) => setF({ ...f, responsable: e.target.value })}>{profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            <Field label="Gravité (1 à 5)"><select className={inp} value={f.g} onChange={(e) => setF({ ...f, g: e.target.value })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></Field>
            <Field label="Probabilité (1 à 5)"><select className={inp} value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></Field>
            <Field label="Statut du plan B"><select className={inp} value={f.statut} onChange={(e) => setF({ ...f, statut: e.target.value })}>{['Prêt', 'Déclenché', 'Clôturé'].map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Plan B d’urgence" className="sm:col-span-2 lg:col-span-4"><textarea rows="2" className={inp} value={f.plan_b} onChange={(e) => setF({ ...f, plan_b: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-4"><button className={btnG} onClick={() => setOpen(false)}>Annuler</button><button className={btnP} onClick={add}>Ajouter le risque</button></div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scroll-x">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-line bg-c2">
                {['Risque identifié', 'Pôle', 'Gravité', 'Proba.', 'Criticité (G × P)', 'Plan B d’urgence', 'Responsable', 'Statut du plan B', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const k = crit(r.c);
                return (
                  <tr key={r.id} className="border-b border-line/70 align-top hover:bg-c2/50">
                    <td className="px-4 py-3 font-medium text-white max-w-[220px]">{r.risque}</td>
                    <td className="px-4 py-3 text-slate-300">{r.pole}</td>
                    <td className="px-4 py-3">{score(r, 'g')}</td>
                    <td className="px-4 py-3">{score(r, 'p')}</td>
                    <td className="px-4 py-3"><span className={'inline-flex items-center gap-2 rounded-md border px-2.5 py-1 font-display text-lg font-semibold ' + k.bg + ' ' + k.t}>{r.c}<span className="text-xs font-sans font-semibold">{k.l}</span></span></td>
                    <td className="px-4 py-3 text-slate-300 max-w-[320px]">{r.plan_b}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{nameOf(r.responsable)}{poleOf(r.responsable) && <div className="text-xs text-slate-500">{TEAM_POLES[poleOf(r.responsable)]}</div>}</td>
                    <td className="px-4 py-3">
                      <select disabled={!canWrite} value={r.statut} onChange={(e) => setStatut(r, e.target.value)}
                        className={'rounded-md border px-2 py-1.5 text-xs font-semibold bg-bg0 ' + (r.statut === 'Prêt' ? 'text-ok border-ok/40' : r.statut === 'Déclenché' ? 'text-race border-race/40' : 'text-slate-400 border-line')}>
                        {['Prêt', 'Déclenché', 'Clôturé'].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">{isLead && <button onClick={() => remove(r)} className="p-1.5 text-slate-500 hover:text-alert" aria-label="Supprimer"><Icon n="trash" size={16} /></button>}</td>
                  </tr>
                );
              })}
              {!loading && list.length === 0 && (
                <tr><td colSpan="9" className="px-4 py-8 text-center text-slate-400">{filter === 'Tous' ? 'Aucun risque enregistré. Ajoutez le premier avec « Ajouter un risque ».' : filter === 'Majeurs' ? 'Aucun risque majeur (criticité supérieure à 15).' : 'Aucun risque n’est confié à un membre de votre pôle.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-slate-500 mt-3">Vert sous 8, orange de 8 à 15, rouge au-dessus de 15. La suppression est réservée au Team Manager et aux Leads.</p>
    </div>
  );
}
