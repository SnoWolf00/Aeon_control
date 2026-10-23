import { useState } from 'react';
import { supabase } from '../supabase';
import { useTable } from '../useTable';
import { useAuth } from '../auth';
import { Card, Title, Field, Badge, Icon, inp, btnP, btnG, fdate, today0 } from '../ui';

const ORDER = { col: 'end_date', asc: true };
const R0 = new Date('2026-09-01'), R1 = new Date('2027-03-31');
const COLORS = { 'Terminé': 'bg-ok', 'En cours': 'bg-cyan', 'En alerte retard': 'bg-alert', 'À venir': 'bg-slate-500' };
const effStatus = (m) => (m.statut === 'Terminé' ? 'Terminé' : new Date(m.end_date) < today0() ? 'En alerte retard' : m.statut);
const at = (d) => Math.min(100, Math.max(0, ((new Date(d) - R0) / (R1 - R0)) * 100));

export default function Planning() {
  const { rows, loading, error } = useTable('milestones', ORDER);
  const { canWrite, isLead, logActivity, team, updateFinale } = useAuth();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(null);
  const [f, setF] = useState({ name: '', start_date: '', end_date: '' });

  const finale = team?.finale || '2027-03-12';
  const months = []; for (let d = new Date(R0); d <= R1; d.setMonth(d.getMonth() + 1)) months.push(new Date(d));
  const todayPct = at(new Date());

  const run = async (q) => { const { error } = await q; setErr(error ? error.message : null); return !error; };
  const setStatut = async (m, statut) => {
    if (await run(supabase.from('milestones').update({ statut }).eq('id', m.id)) && statut === 'Terminé') logActivity('milestone', `Jalon terminé : ${m.name}`);
  };
  const add = async () => {
    if (!f.name.trim() || !f.start_date || !f.end_date) return;
    if (await run(supabase.from('milestones').insert({ ...f, statut: 'À venir' }))) { logActivity('milestone', `Jalon ajouté : ${f.name}`); setF({ name: '', start_date: '', end_date: '' }); setOpen(false); }
  };
  const remove = async (m) => { if (window.confirm(`Supprimer le jalon « ${m.name} » ?`)) run(supabase.from('milestones').delete().eq('id', m.id)); };
  const saveFinale = async (value) => { if (!value) return; const e = await updateFinale(value); setErr(e ? e.message : null); };

  return (
    <div>
      <Title icon="clock" title="Jalons & Planning de saison" sub="Chronologie des échéances éliminatoires. Un jalon non terminé dont l’échéance est passée bascule automatiquement en alerte retard.">
        {isLead && <Field label="Date de la finale"><input type="date" className={inp + ' w-44'} value={finale} onChange={(e) => saveFinale(e.target.value)} /></Field>}
        {canWrite && <button className={btnG} onClick={() => setOpen(!open)}><Icon n="plus" size={16} />Ajouter un jalon</button>}
      </Title>
      {(err || error) && <div className="mb-4 rounded-lg border border-alert/40 bg-alert/10 text-sm text-slate-200 px-4 py-3">Erreur : {err || error}</div>}

      {open && (
        <Card className="p-5 mb-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Jalon"><input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Début"><input type="date" className={inp} value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
            <Field label="Échéance"><input type="date" className={inp} value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-4"><button className={btnG} onClick={() => setOpen(false)}>Annuler</button><button className={btnP} onClick={add}>Ajouter le jalon</button></div>
        </Card>
      )}

      <Card className="p-4 sm:p-5">
        <div className="overflow-x-auto scroll-x">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[230px_1fr] gap-3">
              <div />
              <div className="relative h-7 border-b border-line">
                {months.map((m, i) => <div key={i} className="absolute top-0 text-xs text-slate-400 border-l border-line pl-1.5 h-7" style={{ left: at(m) + '%' }}>{m.toLocaleDateString('fr-FR', { month: 'short' })}</div>)}
              </div>
            </div>
            {rows.map((m) => {
              const st = effStatus(m), l = at(m.start_date), w = Math.max(1.5, at(m.end_date) - l);
              return (
                <div key={m.id} className="grid grid-cols-[230px_1fr] gap-3 items-center py-2 border-b border-line/50">
                  <div className="text-sm text-slate-200 leading-snug pr-2">{m.name}</div>
                  <div className="relative h-7">
                    {months.map((x, i) => <div key={i} className="absolute top-0 bottom-0 border-l border-line/50" style={{ left: at(x) + '%' }} />)}
                    <div className={'absolute top-1 h-5 rounded ' + COLORS[st]} style={{ left: l + '%', width: w + '%' }} title={fdate(m.start_date) + ' → ' + fdate(m.end_date)} />
                    {todayPct > 0 && todayPct < 100 && <div className="absolute top-0 bottom-0 w-px bg-race" style={{ left: todayPct + '%' }} />}
                  </div>
                </div>
              );
            })}
            <div className="grid grid-cols-[230px_1fr] gap-3 items-center py-2">
              <div className="text-sm font-semibold text-race">Finale · Scrutineering officiel</div>
              <div className="relative h-7">
                <div className="absolute top-0 bottom-0 w-0.5 bg-race" style={{ left: at(finale) + '%' }} />
                <span className="absolute top-1 text-xs text-race font-semibold -translate-x-full pr-2" style={{ left: at(finale) + '%' }}>{fdate(finale)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-3">
          {Object.entries(COLORS).map(([k, c]) => <span key={k} className="flex items-center gap-1.5"><span className={'w-3 h-3 rounded-sm ' + c} />{k}</span>)}
          <span className="flex items-center gap-1.5"><span className="w-px h-3 bg-race" />Aujourd’hui</span>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        {rows.map((m) => {
          const st = effStatus(m);
          return (
            <Card key={m.id} className="p-4 flex items-center justify-between gap-3">
              <div><div className="text-sm font-medium text-white">{m.name}</div><div className="text-xs text-slate-400 mt-0.5">{fdate(m.start_date)} → {fdate(m.end_date)}</div></div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge tone={st === 'Terminé' ? 'ok' : st === 'En alerte retard' ? 'alert' : st === 'En cours' ? 'cyan' : 'slate'}>{st}</Badge>
                <div className="flex items-center gap-1.5">
                  <select disabled={!canWrite} className="bg-bg0 border border-line rounded-md px-2 py-1 text-xs text-slate-300" value={m.statut} onChange={(e) => setStatut(m, e.target.value)} aria-label={'Statut de ' + m.name}>
                    {['À venir', 'En cours', 'Terminé'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  {isLead && <button onClick={() => remove(m)} className="p-1 text-slate-500 hover:text-alert" aria-label="Supprimer"><Icon n="trash" size={14} /></button>}
                </div>
              </div>
            </Card>
          );
        })}
        {!loading && rows.length === 0 && <Card className="p-8 text-center text-slate-400 md:col-span-2">Aucun jalon pour le moment.</Card>}
      </div>
    </div>
  );
}
