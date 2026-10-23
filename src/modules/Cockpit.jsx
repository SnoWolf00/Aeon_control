import { useEffect, useMemo, useState } from 'react';
import { useTable } from '../useTable';
import { useAuth } from '../auth';
import { Card, Title, Field, Bar, Modal, TextExport, Icon, inp, btnP, eur, pct, ago, fdate, gr } from '../ui';
import { carTotals, effStatus, MIN_MASS } from '../lib';
import { rpc } from '../demo';

const TYPE_ICON = { decision: 'book', sponsor: 'award', risk: 'alert', milestone: 'flag', budget: 'coins', inv: 'scale', skill: 'layers' };
const riskTone = (c) => (c > 15 ? 'bg-alert' : c >= 8 ? 'bg-race' : 'bg-ok');

function Countdown({ finale, canEdit, onChange }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(finale + 'T09:00:00').getTime() - now);
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
  const seg = (v, l) => (
    <div className="flex flex-col items-center">
      <div className="font-display font-bold text-white leading-none text-6xl sm:text-8xl bg-bg0 border border-line rounded-lg px-3 sm:px-5 py-2 sm:py-3 min-w-[4.2rem] sm:min-w-[7rem] text-center">{String(v).padStart(2, '0')}</div>
      <span className="text-xs text-slate-400 mt-2">{l}</span>
    </div>
  );
  return (
    <Card className="p-5 sm:p-7 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-race" />
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-race font-semibold"><span className="w-2 h-2 rounded-full bg-race animate-pulse" />Départ du Scrutineering officiel</div>
          <p className="text-slate-400 text-sm mt-1">Finale · {fdate(finale)}</p>
        </div>
        {canEdit && <Field label="Date de la finale"><input type="date" className={inp + ' w-44'} value={finale} onChange={(e) => e.target.value && onChange(e.target.value)} /></Field>}
      </div>
      <div className="flex items-start justify-center sm:justify-start gap-2 sm:gap-4">{seg(d, 'jours')}{seg(h, 'heures')}{seg(m, 'minutes')}{seg(s, 'secondes')}</div>
    </Card>
  );
}

function Stat({ icon, label, value, sub, bar, color }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-400 text-sm"><Icon n={icon} size={16} />{label}</div>
      <div className="font-display text-4xl font-semibold text-white mt-1.5 leading-none">{value}</div>
      <div className="mt-3"><Bar value={bar} color={color} /></div>
      <div className="text-xs text-slate-400 mt-2">{sub}</div>
    </Card>
  );
}

export default function Cockpit() {
  const risks = useTable('risks');
  const miles = useTable('milestones');
  const budget = useTable('budget_entries');
  const inv = useTable('inventory_items');
  const dels = useTable('deliverables');
  const sponsors = useTable('sponsors');
  const decisions = useTable('decisions', { col: 'date', asc: false });
  const skills = useTable('skills');
  const act = useTable('activity', { col: 'created_at', asc: false }, 8);
  const { isLead, nameOf, team, updateFinale, role, reloadTeam } = useAuth();
  const [exp, setExp] = useState(false);
  const [fmt, setFmt] = useState('md');
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoErr, setDemoErr] = useState(null);
  const isEmpty = [risks, miles, budget, inv, sponsors, decisions, skills].every((t) => !t.loading && t.rows.length === 0);
  const loadDemo = async () => {
    setDemoBusy(true); setDemoErr(await rpc('load_demo_data')); await reloadTeam(); setDemoBusy(false);
  };

  const finale = team?.finale || '2027-03-12';
  const saveFinale = (value) => updateFinale(value);

  const d = useMemo(() => {
    const open = risks.rows.filter((r) => r.statut !== 'Clôturé');
    const riskIndex = open.length ? Math.round((open.reduce((s, r) => s + r.g * r.p, 0) / open.length) * 10) / 10 : 0;
    const majorRisks = open.filter((r) => r.g * r.p > 15);
    const mileDone = miles.rows.filter((m) => m.statut === 'Terminé').length;
    const lateMiles = miles.rows.filter((m) => effStatus(m) === 'En alerte retard');
    const collected = budget.rows.filter((x) => x.kind === 'collected').reduce((s, x) => s + Number(x.montant), 0)
      + sponsors.rows.reduce((s, x) => s + Number(x.valeur), 0);
    const spent = budget.rows.filter((x) => x.kind === 'expense').reduce((s, x) => s + Number(x.montant), 0);
    const carA = carTotals(inv.rows, 'Voiture A'), carB = carTotals(inv.rows, 'Voiture B');
    const massAlerts = [['Voiture A', carA], ['Voiture B', carB]]
      .filter(([, T]) => T.status.tone !== 'ok')
      .map(([n, T]) => ({ tone: T.status.tone, txt: `${n} : ${T.status.l.toLowerCase()} (${gr(T.total)}, marge ${T.margin.toFixed(2).replace('.', ',')} g)` }));
    const missing = inv.rows.filter((p) => p.ctrl === 'Manquant');
    const delivered = dels.rows.filter((l) => l.done).length;
    return { riskIndex, majorRisks, mileDone, lateMiles, collected, spent, carA, carB, massAlerts, missing, delivered, dueTotal: dels.rows.length };
  }, [risks.rows, miles.rows, budget.rows, inv.rows, dels.rows, sponsors.rows]);

  const milePct = pct(d.mileDone, miles.rows.length), budgetPct = pct(d.spent, d.collected), sponsorPct = pct(d.delivered, d.dueTotal);

  const alerts = [
    ...d.lateMiles.map((m) => ({ tone: 'alert', txt: `Jalon en retard : ${m.name} (échéance ${fdate(m.end_date)})` })),
    ...d.majorRisks.map((r) => ({ tone: 'alert', txt: `Risque majeur ${r.g * r.p}/25 : ${r.risque}` })),
    ...d.massAlerts.map((a) => ({ tone: a.tone, txt: a.txt })),
    ...d.missing.map((p) => ({ tone: 'race', txt: `Pièce manquante : ${p.name} (${p.grp})` })),
  ];

  const snapshot = () => ({
    equipe: team?.name, genere_le: new Date().toISOString(), finale,
    indicateurs: { jalons_pct: milePct, budget_consomme_pct: budgetPct, indice_risque_global: d.riskIndex, marge_masse_voiture_A_g: d.carA.margin, contreparties_livrees_pct: sponsorPct },
    risques: risks.rows.map((r) => ({ ...r, criticite: r.g * r.p })), decisions: decisions.rows, inventaire: inv.rows,
    sponsors: sponsors.rows.map((s) => ({ ...s, livrables: dels.rows.filter((l) => l.sponsor_id === s.id) })),
    competences: skills.rows, jalons: miles.rows.map((m) => ({ ...m, statut_effectif: effStatus(m) })),
    budget: { collecte: d.collected, engage: d.spent, lignes: budget.rows },
  });
  const toMD = () => {
    const s = snapshot();
    return `# Synthèse Portfolio · ${team?.name}\nGénéré le ${fdate(new Date())}\n\n## Indicateurs clés\n- Jalons complétés : ${milePct} % (${d.mileDone}/${miles.rows.length})\n- Budget consommé : ${budgetPct} % (${eur(d.spent)} / ${eur(d.collected)})\n- Indice de risque global : ${d.riskIndex} / 25\n- Masse voiture A : ${gr(d.carA.total)} (marge ${d.carA.margin.toFixed(2)} g, minimum ${gr(MIN_MASS)})\n- Contreparties sponsors livrées : ${sponsorPct} %\n\n## Matrice des risques (AMDEC)\n| Risque | Pôle | G | P | Criticité | Plan B | Statut |\n|---|---|---|---|---|---|---|\n${s.risques.map((r) => `| ${r.risque} | ${r.pole} | ${r.g} | ${r.p} | ${r.criticite} | ${r.plan_b ?? ''} | ${r.statut} |`).join('\n')}\n\n## Journal d’arbitrage R&D\n${decisions.rows.map((x) => `### ${x.titre} (${fdate(x.date)}, validé par ${x.valide_par})\n- Problème : ${x.probleme}\n- Options : ${(x.options || []).join(' / ')}\n- Décision : **${x.decision}**. ${x.justif}\n- Δ traînée : ${x.delta_cx} · Δ masse : ${x.masse} · Δ coût : ${x.cout}`).join('\n\n')}\n\n## Sponsors\n${s.sponsors.map((x) => `- ${x.nom} (${x.role}) : ${pct(x.livrables.filter((l) => l.done).length, x.livrables.length)} % livré`).join('\n')}\n\n## Jalons\n${s.jalons.map((m) => `- ${m.name} : ${fdate(m.start_date)} → ${fdate(m.end_date)} · ${m.statut_effectif}`).join('\n')}\n\n## Budget\n- Collecté : ${eur(d.collected)} · Engagé : ${eur(d.spent)}\n`;
  };

  return (
    <div>
      <Title icon="dash" title="Cockpit · Mission Control" sub="Vue d’ensemble en temps réel, alimentée par les autres modules.">
        <button className={btnP} onClick={() => setExp(true)}><Icon n="download" size={16} />Exporter synthèse Portfolio (MD/JSON)</button>
      </Title>
      {isEmpty && role === 'manager' && (
        <Card className="p-5 mb-4 border-race/40">
          <h3 className="font-display text-2xl font-semibold text-white">Bienvenue dans votre Mission Control</h3>
          <p className="text-sm text-slate-300 mt-1.5 max-w-2xl">Votre espace est vide. Chargez un exemple complet (risques, décisions, pesées, sponsors, jalons, budget) pour voir comment tout s’articule, puis modifiez-le ou effacez-le depuis l’onglet Équipe.</p>
          {demoErr && <p className="text-sm text-race mt-2">{demoErr}</p>}
          <button className={btnP + ' mt-3'} onClick={loadDemo} disabled={demoBusy}>{demoBusy ? 'Chargement…' : 'Charger un exemple'}</button>
        </Card>
      )}
      <Countdown finale={finale} canEdit={isLead} onChange={saveFinale} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        <Stat icon="flag" label="Jalons complétés" value={milePct + ' %'} bar={milePct} color="bg-ok" sub={`${d.mileDone} sur ${miles.rows.length} terminés`} />
        <Stat icon="coins" label="Budget consommé" value={budgetPct + ' %'} bar={budgetPct} color={budgetPct > 90 ? 'bg-alert' : 'bg-cyan'} sub={`${eur(d.spent)} engagés / ${eur(d.collected)} collectés`} />
        <Stat icon="alert" label="Indice de risque global" value={d.riskIndex + ' / 25'} bar={(d.riskIndex / 25) * 100} color={riskTone(d.riskIndex)} sub={`${d.majorRisks.length} risque(s) majeur(s) ouvert(s)`} />
        <Stat icon="scale" label="Marge de masse, voiture A" value={(d.carA.margin >= 0 ? '+' : '') + d.carA.margin.toFixed(2).replace('.', ',') + ' g'} bar={Math.min(100, Math.max(0, (d.carA.margin / 2) * 100))} color={d.carA.margin < 0 ? 'bg-alert' : d.carA.margin < 0.5 ? 'bg-race' : 'bg-ok'} sub={`${gr(d.carA.total)} pour un minimum de ${gr(MIN_MASS)}`} />
        <Stat icon="award" label="Contreparties livrées" value={sponsorPct + ' %'} bar={sponsorPct} color="bg-race" sub={`${d.delivered} sur ${d.dueTotal} livrables`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Card className="p-5">
          <h3 className="font-display text-xl font-semibold text-white mb-3">À traiter maintenant</h3>
          {alerts.length === 0 ? <p className="text-sm text-ok">Aucune alerte ouverte. Les voyants sont verts.</p> : (
            <ul className="space-y-2">
              {alerts.map((a, i) => <li key={i} className="flex gap-2.5 text-sm text-slate-200"><span className={'mt-1.5 w-2 h-2 rounded-full shrink-0 ' + (a.tone === 'alert' ? 'bg-alert' : 'bg-race')} />{a.txt}</li>)}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="font-display text-xl font-semibold text-white mb-3">Fil d’activité</h3>
          <ul className="space-y-3">
            {act.rows.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className="mt-0.5 text-cyan shrink-0"><Icon n={TYPE_ICON[a.type] || 'activity'} size={16} /></span>
                <div><div className="text-slate-200">{a.txt}</div><div className="text-xs text-slate-500">{nameOf(a.user_id)} · {ago(a.created_at)}</div></div>
              </li>
            ))}
            {!act.loading && act.rows.length === 0 && <li className="text-sm text-slate-500">Aucune activité pour le moment. Elle apparaît dès qu’un membre modifie quelque chose.</li>}
          </ul>
        </Card>
      </div>

      {exp && (
        <Modal title="Synthèse Portfolio" onClose={() => setExp(false)}>
          <div className="flex gap-2 mb-3">
            {[['md', 'Markdown'], ['json', 'JSON']].map(([k, l]) => (
              <button key={k} onClick={() => setFmt(k)} className={'px-3 py-1.5 rounded-md text-sm font-medium border ' + (fmt === k ? 'bg-race text-black border-race' : 'border-line text-slate-300 hover:bg-c2')}>{l}</button>
            ))}
          </div>
          <TextExport text={fmt === 'md' ? toMD() : JSON.stringify(snapshot(), null, 2)} hint={fmt === 'md' ? 'Collez dans un fichier .md.' : 'Collez dans un fichier .json.'} />
        </Modal>
      )}
    </div>
  );
}
