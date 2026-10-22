import { useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { useTable } from '../useTable';
import { useAuth } from '../auth';
import { Card, Title, Field, Badge, Icon, inp, btnP, btnG, fdate } from '../ui';

const ORDER = { col: 'date', asc: false };

export default function Decisions() {
  const { rows, loading, error } = useTable('decisions', ORDER);
  const { isLead, logActivity } = useAuth();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(null);
  const blank = { titre: '', probleme: '', options: '', decision: '', justif: '', delta_cx: '', masse: '', cout: '', valide_par: 'Lead CAO', date: new Date().toISOString().slice(0, 10) };
  const [f, setF] = useState(blank);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((d) => !s || [d.titre, d.probleme, d.decision, d.justif, (d.options || []).join(' ')].join(' ').toLowerCase().includes(s));
  }, [rows, q]);

  const add = async () => {
    if (!f.titre.trim() || !f.decision.trim()) return;
    const payload = { ...f, options: f.options.split('\n').map((x) => x.trim()).filter(Boolean) };
    const { error } = await supabase.from('decisions').insert(payload);
    setErr(error ? error.message : null);
    if (!error) { logActivity('decision', `Décision validée : ${f.titre} → ${f.decision}`); setF(blank); setOpen(false); }
  };
  const remove = async (d) => {
    if (!window.confirm(`Supprimer la décision « ${d.titre} » ?`)) return;
    const { error } = await supabase.from('decisions').delete().eq('id', d.id);
    setErr(error ? error.message : null);
  };
  const metric = (l, v, tone) => v ? (
    <div className="bg-bg0 border border-line rounded-md px-3 py-2"><div className="text-xs text-slate-400">{l}</div><div className={'font-display text-xl font-semibold ' + tone}>{v}</div></div>
  ) : null;

  return (
    <div>
      <Title icon="book" title="Decision Log · Journal d’arbitrage R&D" sub="Chaque choix de conception est daté, chiffré et signé : la preuve de traçabilité pour le jury technique. Seuls le Team Manager et les Leads consignent une décision.">
        {isLead && <button className={btnG} onClick={() => setOpen(!open)}><Icon n="plus" size={16} />Consigner une décision</button>}
      </Title>
      {(err || error) && <div className="mb-4 rounded-lg border border-alert/40 bg-alert/10 text-sm text-slate-200 px-4 py-3">Erreur : {err || error}</div>}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"><Icon n="search" size={16} /></span>
        <input className={inp + ' pl-9'} placeholder="Rechercher un arbitrage (profil, roues, fil, masse…)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un arbitrage" />
      </div>

      {open && (
        <Card className="p-5 mb-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Sujet de l’arbitrage"><input className={inp} value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} /></Field>
            <Field label="Décision retenue"><input className={inp} value={f.decision} onChange={(e) => setF({ ...f, decision: e.target.value })} /></Field>
            <Field label="Problème technique posé" className="sm:col-span-2"><textarea rows="2" className={inp} value={f.probleme} onChange={(e) => setF({ ...f, probleme: e.target.value })} /></Field>
            <Field label="Options évaluées (une par ligne)"><textarea rows="3" className={inp} value={f.options} onChange={(e) => setF({ ...f, options: e.target.value })} /></Field>
            <Field label="Justification chiffrée"><textarea rows="3" className={inp} value={f.justif} onChange={(e) => setF({ ...f, justif: e.target.value })} /></Field>
            <Field label="Δ traînée CFD"><input className={inp} placeholder="−2,3 %" value={f.delta_cx} onChange={(e) => setF({ ...f, delta_cx: e.target.value })} /></Field>
            <Field label="Δ masse"><input className={inp} placeholder="+0,12 g" value={f.masse} onChange={(e) => setF({ ...f, masse: e.target.value })} /></Field>
            <Field label="Δ coût"><input className={inp} placeholder="+15 €" value={f.cout} onChange={(e) => setF({ ...f, cout: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Validé par"><select className={inp} value={f.valide_par} onChange={(e) => setF({ ...f, valide_par: e.target.value })}><option>Lead CAO</option><option>Team Manager</option></select></Field>
              <Field label="Date"><input type="date" className={inp} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4"><button className={btnG} onClick={() => setOpen(false)}>Annuler</button><button className={btnP} onClick={add}>Enregistrer la décision</button></div>
        </Card>
      )}

      <div className="space-y-4">
        {list.map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="font-display text-2xl font-semibold text-white">{d.titre}</h3>
              <div className="flex gap-2 items-center">
                <Badge tone="cyan">Validé par {d.valide_par}</Badge>
                <span className="text-xs text-slate-400">{fdate(d.date)}</span>
                {isLead && <button onClick={() => remove(d)} className="p-1 text-slate-500 hover:text-alert" aria-label="Supprimer"><Icon n="trash" size={16} /></button>}
              </div>
            </div>
            <p className="text-sm text-slate-300 mt-2"><span className="text-slate-500">Problème posé · </span>{d.probleme}</p>
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <div className="bg-bg0 border border-line rounded-lg p-3.5">
                <div className="text-xs text-slate-400 mb-2">Options évaluées</div>
                <ul className="space-y-1.5">
                  {(d.options || []).map((o) => (
                    <li key={o} className={'text-sm flex gap-2 ' + (d.decision && o.toLowerCase().includes(d.decision.toLowerCase().split(' ')[0]) ? 'text-white font-medium' : 'text-slate-400')}>
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />{o}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-bg0 border border-ok/30 rounded-lg p-3.5">
                <div className="text-xs text-ok mb-1">Décision retenue</div>
                <div className="text-white font-medium">{d.decision}</div>
                <p className="text-sm text-slate-300 mt-1.5">{d.justif}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {metric('Δ traînée (CFD)', d.delta_cx, 'text-cyan')}
              {metric('Δ masse', d.masse, 'text-white')}
              {metric('Δ coût', d.cout, 'text-white')}
            </div>
          </Card>
        ))}
        {!loading && list.length === 0 && <Card className="p-8 text-center text-slate-400">{q ? `Aucun arbitrage ne correspond à « ${q} ».` : 'Aucune décision consignée pour le moment.'}</Card>}
      </div>
    </div>
  );
}
