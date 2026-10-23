import { useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth';
import { Card, Title, Field, Badge, inp, btnP, btnG } from '../ui';
import { rpc } from '../demo';
import { TEAM_POLES } from '../lib';

const ROLES = { manager: 'Team Manager', lead: 'Lead', member: 'Membre', viewer: 'Lecture seule' };
const INVITABLE = ['lead', 'member', 'viewer'];

export default function Team() {
  const { profiles, session, team, reloadProfiles, reloadTeam } = useAuth();
  const [f, setF] = useState({ email: '', name: '', role: 'member' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const [err, setErr] = useState(null);
  const [confirm, setConfirm] = useState('');
  const [dataMsg, setDataMsg] = useState(null);
  const [dataBusy, setDataBusy] = useState(false);

  const runData = async (fn, okText) => {
    setDataBusy(true); setDataMsg(null);
    const e = await rpc(fn);
    await reloadTeam();
    setDataMsg(e ? { ok: false, text: e } : { ok: true, text: okText });
    if (!e) setConfirm('');
    setDataBusy(false);
  };

  const invite = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.functions.invoke('invite-member', { body: { ...f, redirectTo: window.location.origin } });
    if (error) {
      let text = error.message;
      try { const j = await error.context.json(); text = j.error || text; } catch (_) {}
      setMsg({ ok: false, text });
    } else {
      setMsg({ ok: true, text: `Invitation envoyée à ${f.email}.` });
      setF({ email: '', name: '', role: 'member' });
      await reloadProfiles();
    }
    setBusy(false);
  };

  const update = async (id, patch) => {
    const { error } = await supabase.from('profiles').update(patch).eq('id', id);
    setErr(error ? error.message : null);
    if (!error) await reloadProfiles();
  };

  return (
    <div>
      <Title icon="users" title={'Équipe · ' + (team?.name ?? '')} sub="Invitez vos coéquipiers et réglez leurs droits. Seul le Team Manager voit cet onglet." />
      {err && <div className="mb-4 rounded-lg border border-alert/40 bg-alert/10 text-sm text-slate-200 px-4 py-3">Erreur : {err}</div>}

      <Card className="p-5 mb-4">
        <h3 className="font-display text-xl font-semibold text-white mb-3">Inviter un membre</h3>
        <form onSubmit={invite} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <Field label="E-mail"><input type="email" required className={inp} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Nom affiché"><input className={inp} placeholder="Ex. : Inès M." value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Rôle"><select className={inp} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{INVITABLE.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}</select></Field>
          <button className={btnP} disabled={busy}>{busy ? 'Envoi…' : 'Envoyer l’invitation'}</button>
        </form>
        {msg && <p className={'text-sm mt-3 ' + (msg.ok ? 'text-ok' : 'text-race')}>{msg.text}</p>}
        <p className="text-xs text-slate-500 mt-3">Le membre reçoit un e-mail, choisit son mot de passe et arrive directement dans votre équipe.</p>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[620px]">
          <thead><tr className="text-left text-xs text-slate-400 border-b border-line bg-c2"><th className="px-4 py-3 font-semibold">Nom</th><th className="px-4 py-3 font-semibold">Rôle</th><th className="px-4 py-3 font-semibold">Pôle</th></tr></thead>
          <tbody>
            {profiles.map((p) => {
              const self = p.id === session.user.id;
              return (
                <tr key={p.id} className="border-b border-line/70">
                  <td className="px-4 py-2.5">
                    <input className={inp + ' max-w-xs'} defaultValue={p.name} aria-label={'Nom de ' + p.name}
                      onBlur={(e) => e.target.value.trim() && e.target.value !== p.name && update(p.id, { name: e.target.value.trim() })} />
                  </td>
                  <td className="px-4 py-2.5">
                    {self || p.role === 'manager'
                      ? <Badge tone="race">{ROLES[p.role]}{self ? ' (vous)' : ''}</Badge>
                      : <select className="bg-bg0 border border-line rounded-md px-2 py-1.5 text-sm text-slate-200" value={p.role} onChange={(e) => update(p.id, { role: e.target.value })}>
                          {INVITABLE.map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
                        </select>}
                  </td>
                  <td className="px-4 py-2.5">
                    <select className="bg-bg0 border border-line rounded-md px-2 py-1.5 text-sm text-slate-200" value={p.pole ?? ''} onChange={(e) => update(p.id, { pole: e.target.value || null })} aria-label={'Pôle de ' + p.name}>
                      <option value="">Non défini</option>
                      {Object.entries(TEAM_POLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </Card>

      <Card className="p-5 mt-4">
        <h3 className="font-display text-xl font-semibold text-white mb-1">Données de l’équipe</h3>
        <p className="text-sm text-slate-400 mb-4">Chargez un exemple complet pour découvrir l’outil, ou repartez de zéro.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button className={btnG} disabled={dataBusy} onClick={() => runData('load_demo_data', 'Exemple chargé.')}>Charger un exemple</button>
          <span className="text-xs text-slate-500">Possible uniquement si l’équipe n’a aucune donnée.</span>
        </div>
        <div className="mt-5 pt-4 border-t border-line">
          <div className="text-sm text-slate-200">Effacer toutes les données de l’équipe</div>
          <p className="text-xs text-slate-500 mt-1">Supprime risques, décisions, pièces, sponsors, compétences, jalons, budget et activité. Les comptes et la date de finale sont conservés. Action définitive.</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <input className={inp + ' max-w-[16rem]'} placeholder="Tapez EFFACER pour confirmer" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Confirmation" />
            <button className="inline-flex items-center rounded-md px-3.5 py-2 text-sm font-semibold bg-alert text-white hover:bg-red-400 disabled:opacity-40" disabled={confirm !== 'EFFACER' || dataBusy}
              onClick={() => runData('clear_team_data', 'Données effacées.')}>Tout effacer</button>
          </div>
        </div>
        {dataMsg && <p className={'text-sm mt-3 ' + (dataMsg.ok ? 'text-ok' : 'text-race')}>{dataMsg.text}</p>}
      </Card>
    </div>
  );
}
