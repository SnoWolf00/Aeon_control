import { useState } from 'react';
import { supabase } from '../supabase';
import { useTable } from '../useTable';
import { useAuth } from '../auth';
import { Card, Title, Field, Badge, Bar, Modal, TextExport, Icon, inp, btnP, btnG, eur, pct } from '../ui';

const ROLES = ['Partenaire Titre', 'Fournisseur Usinage', 'Sponsor Textile', 'Autre'];

export default function Sponsors() {
  const sp = useTable('sponsors', { col: 'valeur', asc: false });
  const dl = useTable('deliverables', { col: 'id', asc: true });
  const { canWrite, isLead, logActivity, team } = useAuth();
  const [draft, setDraft] = useState({});
  const [report, setReport] = useState(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(null);
  const blank = { nom: '', role: ROLES[0], apport: 'Numéraire', valeur: '' };
  const [f, setF] = useState(blank);

  const items = (s) => dl.rows.filter((d) => d.sponsor_id === s.id);
  const run = async (q) => { const { error } = await q; setErr(error ? error.message : null); return !error; };

  const toggle = async (s, l) => {
    if (await run(supabase.from('deliverables').update({ done: !l.done }).eq('id', l.id)))
      logActivity('sponsor', l.done ? `Livrable rouvert : ${l.label} (${s.nom})` : `Livrable bouclé : ${l.label} (${s.nom})`);
  };
  const addL = async (s) => {
    const t = (draft[s.id] || '').trim(); if (!t) return;
    if (await run(supabase.from('deliverables').insert({ sponsor_id: s.id, label: t }))) setDraft({ ...draft, [s.id]: '' });
  };
  const addS = async () => {
    if (!f.nom.trim()) return;
    if (await run(supabase.from('sponsors').insert({ ...f, valeur: Number(f.valeur) || 0 }))) { logActivity('sponsor', `Sponsor ajouté : ${f.nom}`); setF(blank); setOpen(false); }
  };
  const removeS = async (s) => { if (window.confirm(`Supprimer ${s.nom} et ses livrables ?`)) run(supabase.from('sponsors').delete().eq('id', s.id)); };
  const removeL = (l) => run(supabase.from('deliverables').delete().eq('id', l.id));

  const text = (s) => {
    const all = items(s), d = all.filter((l) => l.done), r = all.filter((l) => !l.done);
    return `RAPPORT PARTENAIRE · ${s.nom}\n${team?.name}\nStatut : ${s.role} (${s.apport.toLowerCase()}, ${eur(s.valeur)})\n\nRéalisation des contreparties : ${pct(d.length, all.length)} % (${d.length} sur ${all.length})\n\nLivré\n${d.length ? d.map((l) => '  ✔ ' + l.label).join('\n') : '  Aucun livrable bouclé pour le moment.'}\n\nÀ venir\n${r.length ? r.map((l) => '  • ' + l.label).join('\n') : '  Toutes les contreparties sont honorées.'}\n\nMerci pour votre soutien : votre apport finance directement notre usinage, notre stand et notre déplacement jusqu’à la finale.\n`;
  };

  const tot = dl.rows.length, done = dl.rows.filter((l) => l.done).length;
  return (
    <div>
      <Title icon="award" title="Sponsor ROI & Deliverables" sub="Contreparties promises à chaque partenaire. Cochez un livrable dès qu’il est tenu : le taux, le cockpit et le fil d’activité se mettent à jour pour toute l’équipe.">
        <div className="text-right"><div className="font-display text-3xl font-semibold text-white leading-none">{pct(done, tot)} %</div><div className="text-xs text-slate-400">livré sur l’ensemble ({done}/{tot})</div></div>
        {canWrite && <button className={btnG} onClick={() => setOpen(!open)}><Icon n="plus" size={16} />Ajouter un sponsor</button>}
      </Title>
      {(err || sp.error || dl.error) && <div className="mb-4 rounded-lg border border-alert/40 bg-alert/10 text-sm text-slate-200 px-4 py-3">Erreur : {err || sp.error || dl.error}</div>}

      {open && (
        <Card className="p-5 mb-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Field label="Nom du sponsor"><input className={inp} value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} /></Field>
            <Field label="Rôle"><select className={inp} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></Field>
            <Field label="Type d’apport"><select className={inp} value={f.apport} onChange={(e) => setF({ ...f, apport: e.target.value })}><option>Numéraire</option><option>En nature</option></select></Field>
            <Field label="Valeur (€)"><input type="number" className={inp} value={f.valeur} onChange={(e) => setF({ ...f, valeur: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-4"><button className={btnG} onClick={() => setOpen(false)}>Annuler</button><button className={btnP} onClick={addS}>Ajouter le sponsor</button></div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        {sp.rows.map((s) => {
          const all = items(s), d = all.filter((l) => l.done).length, p = pct(d, all.length);
          return (
            <Card key={s.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge tone="race">{s.role}</Badge>
                  <h3 className="font-display text-2xl font-semibold text-white mt-2 leading-tight">{s.nom}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">{s.apport} · {eur(s.valeur)}</div>
                </div>
                <div className="text-right">
                  <div className={'font-display text-4xl font-semibold leading-none ' + (p === 100 ? 'text-ok' : 'text-white')}>{p}%</div>
                  {isLead && <button onClick={() => removeS(s)} className="mt-2 p-1 text-slate-500 hover:text-alert" aria-label="Supprimer le sponsor"><Icon n="trash" size={14} /></button>}
                </div>
              </div>
              <div className="my-3"><Bar value={p} color={p === 100 ? 'bg-ok' : 'bg-race'} /></div>
              <ul className="space-y-1 flex-1">
                {all.map((l) => (
                  <li key={l.id} className="group flex items-start gap-1">
                    <label className="flex-1 flex items-start gap-2.5 text-sm py-1.5 px-2 -mx-2 rounded-md hover:bg-c2 cursor-pointer">
                      <input type="checkbox" disabled={!canWrite} checked={l.done} onChange={() => toggle(s, l)} className="mt-0.5 w-4 h-4 accent-emerald-500 shrink-0" />
                      <span className={l.done ? 'text-slate-500 line-through' : 'text-slate-200'}>{l.label}</span>
                    </label>
                    {isLead && <button onClick={() => removeL(l)} className="p-1 mt-1 text-slate-600 hover:text-alert opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label="Supprimer le livrable"><Icon n="x" size={14} /></button>}
                  </li>
                ))}
                {all.length === 0 && <li className="text-sm text-slate-500">Aucun livrable défini.</li>}
              </ul>
              {canWrite && (
                <div className="flex gap-2 mt-3">
                  <input className={inp} placeholder="Nouveau livrable" value={draft[s.id] || ''} onChange={(e) => setDraft({ ...draft, [s.id]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addL(s)} aria-label={'Nouveau livrable pour ' + s.nom} />
                  <button className={btnG} onClick={() => addL(s)} aria-label="Ajouter le livrable"><Icon n="plus" size={16} /></button>
                </div>
              )}
              <button className={btnP + ' mt-3'} onClick={() => setReport(s.id)}><Icon n="file" size={16} />Générer le rapport partenaire</button>
            </Card>
          );
        })}
        {!sp.loading && sp.rows.length === 0 && <Card className="p-8 text-center text-slate-400 lg:col-span-3">Aucun sponsor enregistré.</Card>}
      </div>
      {report && sp.rows.find((x) => x.id === report) && (
        <Modal title={'Rapport partenaire · ' + sp.rows.find((x) => x.id === report).nom} onClose={() => setReport(null)}>
          <TextExport text={text(sp.rows.find((x) => x.id === report))} hint="Copiez le texte puis collez-le dans votre e-mail ou votre PDF." />
        </Modal>
      )}
    </div>
  );
}
