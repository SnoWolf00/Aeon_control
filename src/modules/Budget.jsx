import { useState } from 'react';
import { supabase } from '../supabase';
import { useTable } from '../useTable';
import { useAuth } from '../auth';
import { Card, Title, Badge, Bar, Icon, inp, btnP, eur, pct } from '../ui';

const POSTES = ['Usinage / Outillage', 'Stand & Scénographie', 'Tenues & Goodies', 'Frais de déplacement'];
const PLAFONDS = { 'Usinage / Outillage': 1600, 'Stand & Scénographie': 1000, 'Tenues & Goodies': 700, 'Frais de déplacement': 1000 };

export default function Budget() {
  const { rows, loading, error } = useTable('budget_entries', { col: 'id', asc: true });
  const sp = useTable('sponsors', { col: 'valeur', asc: false });
  const { canWrite, isLead, logActivity } = useAuth();
  const [err, setErr] = useState(null);
  const [e, setE] = useState({ poste: POSTES[0], label: '', montant: '' });
  const [c, setC] = useState({ label: '', type: 'Numéraire', montant: '' });

  // Les apports des sponsors viennent directement de l'onglet Sponsors (aucune double saisie).
  const manual = rows.filter((x) => x.kind === 'collected');
  const fromSponsors = sp.rows.map((s) => ({ id: 'sp-' + s.id, label: `${s.nom} (${s.role})`, type: s.apport, montant: s.valeur, sponsor: true }));
  const collected = [...fromSponsors, ...manual];
  const expenses = rows.filter((x) => x.kind === 'expense');
  const totC = collected.reduce((s, x) => s + Number(x.montant), 0);
  const totE = expenses.reduce((s, x) => s + Number(x.montant), 0);
  const nat = collected.filter((x) => x.type === 'En nature').reduce((s, x) => s + Number(x.montant), 0);
  const balance = totC - totE, usedPct = pct(totE, totC);

  const run = async (q) => { const { error } = await q; setErr(error ? error.message : null); return !error; };
  const addE = async () => {
    if (!e.label.trim() || !(+e.montant > 0)) return;
    if (await run(supabase.from('budget_entries').insert({ kind: 'expense', poste: e.poste, label: e.label, montant: +e.montant }))) {
      logActivity('budget', `Dépense engagée : ${e.label} (${eur(+e.montant)})`); setE({ ...e, label: '', montant: '' });
    }
  };
  const addC = async () => {
    if (!c.label.trim() || !(+c.montant > 0)) return;
    if (await run(supabase.from('budget_entries').insert({ kind: 'collected', label: c.label, type: c.type, montant: +c.montant }))) {
      logActivity('budget', `Apport enregistré : ${c.label} (${eur(+c.montant)})`); setC({ ...c, label: '', montant: '' });
    }
  };
  const remove = (x) => window.confirm(`Supprimer « ${x.label} » ?`) && run(supabase.from('budget_entries').delete().eq('id', x.id));
  const Del = ({ x }) => isLead && !x.sponsor ? <button onClick={() => remove(x)} className="p-1 text-slate-600 hover:text-alert" aria-label="Supprimer"><Icon n="trash" size={14} /></button> : null;

  return (
    <div>
      <Title icon="coins" title="Budget & Trésorerie" sub="Ce que l’écurie a reçu (numéraire et mécénat en nature valorisé) face à ce qu’elle a engagé, poste par poste." />
      {(err || error || sp.error) && <div className="mb-4 rounded-lg border border-alert/40 bg-alert/10 text-sm text-slate-200 px-4 py-3">Erreur : {err || error || sp.error}</div>}
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-sm text-slate-400">Total collecté</div><div className="font-display text-4xl font-semibold text-white mt-1">{eur(totC)}</div><div className="text-xs text-slate-400 mt-1">dont {eur(nat)} valorisés en nature</div></Card>
        <Card className="p-4"><div className="text-sm text-slate-400">Dépenses engagées</div><div className="font-display text-4xl font-semibold text-white mt-1">{eur(totE)}</div><div className="mt-2"><Bar value={usedPct} color={usedPct > 90 ? 'bg-alert' : 'bg-cyan'} /></div></Card>
        <Card className="p-4"><div className="text-sm text-slate-400">Solde disponible</div><div className={'font-display text-4xl font-semibold mt-1 ' + (balance < 0 ? 'text-alert' : 'text-ok')}>{eur(balance)}</div><div className="text-xs text-slate-400 mt-1">{usedPct} % consommé</div></Card>
      </div>

      <Card className="p-5 mt-4">
        <h3 className="font-display text-xl font-semibold text-white mb-3">Répartition par poste</h3>
        <div className="space-y-4">
          {POSTES.map((p) => {
            const spent = expenses.filter((x) => x.poste === p).reduce((s, x) => s + Number(x.montant), 0), cap = PLAFONDS[p], v = pct(spent, cap);
            return (
              <div key={p}>
                <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-200">{p}</span><span className="text-slate-400"><span className="text-white font-semibold">{eur(spent)}</span> / {eur(cap)}</span></div>
                <Bar value={v} color={v > 100 ? 'bg-alert' : v > 85 ? 'bg-race' : 'bg-cyan'} h="h-2.5" />
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card className="p-5">
          <h3 className="font-display text-xl font-semibold text-white mb-3">Apports collectés</h3>
          <ul className="divide-y divide-line">
            {collected.map((x) => (
              <li key={x.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div><div className="text-slate-200">{x.label}</div><div className="flex gap-1.5 mt-0.5"><Badge tone={x.type === 'Numéraire' ? 'ok' : 'cyan'}>{x.type}</Badge>{x.sponsor && <Badge tone="race">Sponsor</Badge>}</div></div>
                <div className="flex items-center gap-2"><span className="font-semibold text-white">{eur(x.montant)}</span><Del x={x} /></div>
              </li>
            ))}
            {!loading && !sp.loading && collected.length === 0 && <li className="py-4 text-sm text-slate-500">Aucun apport enregistré.</li>}
          </ul>
          <p className="text-xs text-slate-500 mt-3">Les apports des sponsors se mettent à jour tout seuls depuis l’onglet Sponsors. Ajoutez ici uniquement les dons et autres apports.</p>
          {canWrite && (
            <div className="grid grid-cols-[1fr_auto_5.5rem_auto] gap-2 mt-3">
              <input className={inp} placeholder="Don ou autre apport (hors sponsors)" value={c.label} onChange={(ev) => setC({ ...c, label: ev.target.value })} aria-label="Source de l’apport" />
              <select className={inp + ' w-28'} value={c.type} onChange={(ev) => setC({ ...c, type: ev.target.value })}><option>Numéraire</option><option>En nature</option></select>
              <input type="number" className={inp} placeholder="€" value={c.montant} onChange={(ev) => setC({ ...c, montant: ev.target.value })} aria-label="Montant en euros" />
              <button className={btnP} onClick={addC} aria-label="Ajouter l’apport"><Icon n="plus" size={16} /></button>
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-display text-xl font-semibold text-white mb-3">Dépenses engagées</h3>
          <ul className="divide-y divide-line">
            {expenses.map((x) => (
              <li key={x.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div><div className="text-slate-200">{x.label}</div><span className="text-xs text-slate-400">{x.poste}</span></div>
                <div className="flex items-center gap-2"><span className="font-semibold text-white">{eur(x.montant)}</span><Del x={x} /></div>
              </li>
            ))}
            {!loading && expenses.length === 0 && <li className="py-4 text-sm text-slate-500">Aucune dépense engagée.</li>}
          </ul>
          {canWrite && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <select className={inp} value={e.poste} onChange={(ev) => setE({ ...e, poste: ev.target.value })}>{POSTES.map((p) => <option key={p}>{p}</option>)}</select>
              <input type="number" className={inp} placeholder="Montant en €" value={e.montant} onChange={(ev) => setE({ ...e, montant: ev.target.value })} aria-label="Montant en euros" />
              <input className={inp + ' col-span-2'} placeholder="Libellé de la dépense" value={e.label} onChange={(ev) => setE({ ...e, label: ev.target.value })} onKeyDown={(ev) => ev.key === 'Enter' && addE()} aria-label="Libellé de la dépense" />
              <button className={btnP + ' col-span-2'} onClick={addE}><Icon n="plus" size={16} />Ajouter la dépense</button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
