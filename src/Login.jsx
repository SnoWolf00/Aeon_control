import { useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import { Card, Field, inp, btnP } from './ui';

function Shell({ title, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="font-display text-3xl font-bold text-white leading-none">Aeon Velocity</div>
        <div className="text-sm text-slate-400 mt-1 mb-5">{title}</div>
        {children}
      </Card>
    </div>
  );
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg('Connexion refusée : vérifiez l’e-mail et le mot de passe.');
    setBusy(false);
  };
  const forgot = async () => {
    if (!email) return setMsg('Saisissez d’abord votre e-mail.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setMsg(error ? error.message : 'Un lien de réinitialisation vient d’être envoyé.');
  };

  return (
    <Shell title="Mission Control · connexion">
      <form onSubmit={submit} className="space-y-3">
        <Field label="E-mail"><input type="email" required className={inp} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
        <Field label="Mot de passe"><input type="password" required className={inp} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
        {msg && <p className="text-sm text-race">{msg}</p>}
        <button className={btnP + ' w-full'} disabled={busy}>Se connecter</button>
        <button type="button" onClick={forgot} className="w-full text-xs text-slate-400 hover:text-white">Mot de passe oublié</button>
      </form>
    </Shell>
  );
}

export function SetPassword() {
  const { setNeedPassword } = useAuth();
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setMsg('Au moins 8 caractères.');
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setMsg(error.message);
    window.history.replaceState(null, '', window.location.pathname);
    setNeedPassword(false);
  };

  return (
    <Shell title="Choisissez votre mot de passe">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nouveau mot de passe"><input type="password" required className={inp} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
        {msg && <p className="text-sm text-race">{msg}</p>}
        <button className={btnP + ' w-full'}>Enregistrer et entrer</button>
      </form>
    </Shell>
  );
}
