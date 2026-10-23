import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, arrivedViaInvite } from './supabase';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = chargement
  const [profiles, setProfiles] = useState([]);
  const [team, setTeam] = useState(null);
  const [ready, setReady] = useState(false);
  const [needPassword, setNeedPassword] = useState(arrivedViaInvite);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((ev, s) => {
      setSession(s);
      if (ev === 'PASSWORD_RECOVERY') setNeedPassword(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id;
  useEffect(() => {
    if (!uid) { setProfiles([]); setTeam(null); setReady(false); return; }
    let on = true;
    (async () => {
      // La sécurité côté base ne renvoie que votre équipe.
      const [p, t] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('teams').select('*').maybeSingle(),
      ]);
      if (!on) return;
      setProfiles(p.data || []);
      setTeam(t.data || null);
      setReady(true);
    })();
    return () => { on = false; };
  }, [uid]);

  const me = profiles.find((p) => p.id === uid);
  const role = me?.role ?? 'viewer';
  const value = {
    session, me, role, profiles, team, ready, needPassword, setNeedPassword,
    canWrite: ['manager', 'lead', 'member'].includes(role),
    isLead: ['manager', 'lead'].includes(role),
    nameOf: (id) => profiles.find((p) => p.id === id)?.name ?? '—',
    poleOf: (id) => profiles.find((p) => p.id === id)?.pole ?? null,
    logActivity: (type, txt) => supabase.from('activity').insert({ type, txt }),
    updateFinale: async (finale) => {
      const { error } = await supabase.from('teams').update({ finale }).eq('id', team.id);
      if (!error) setTeam({ ...team, finale });
      return error;
    },
    reloadTeam: async () => { const { data } = await supabase.from('teams').select('*').maybeSingle(); setTeam(data || null); },
    reloadProfiles: async () => { const { data } = await supabase.from('profiles').select('*'); setProfiles(data || []); },
    signOut: () => supabase.auth.signOut(),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
