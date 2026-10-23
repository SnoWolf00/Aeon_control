import { useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth';
import { Card, Title, Field, Badge, inp, btnP } from '../ui';

const ROLES = { manager: 'Team Manager', lead: 'Lead', member: 'Membre', viewer: 'Lecture seule' };
const INVITABLE = ['lead', 'member', 'viewer'];

export default function Team() {
  const { profiles, session, team, reloadProfiles } = useAuth();
  const [f, setF] = useState({ email: '', name: '', role: 'member' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const [err, setErr] = useState(null);

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
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-slate-400 border-b border-line bg-c2"><th className="px-4 py-3 font-semibold">Nom</th><th className="px-4 py-3 font-semibold">Rôle</th></tr></thead>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
