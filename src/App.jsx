import { useState } from 'react';
import { useAuth } from './auth';
import { Login, SetPassword } from './Login';
import { Icon, Badge, Card } from './ui';
import Risks from './modules/Risks';

const TABS = [
  { id: 'cockpit', label: 'Cockpit', icon: 'dash', lot: 3 },
  { id: 'risks', label: 'Matrice des risques', icon: 'alert', C: Risks },
  { id: 'decisions', label: 'Decision Log', icon: 'book', lot: 2 },
  { id: 'inventory', label: 'Pitlane & Spares', icon: 'flag', lot: 2 },
  { id: 'sponsors', label: 'Sponsors', icon: 'award', lot: 3 },
  { id: 'skills', label: 'Compétences', icon: 'layers', lot: 3 },
  { id: 'planning', label: 'Jalons & Planning', icon: 'clock', lot: 2 },
  { id: 'budget', label: 'Budget', icon: 'coins', lot: 3 },
];
const ROLE_LABEL = { manager: 'Team Manager', lead: 'Lead', member: 'Membre', viewer: 'Lecture seule' };

function Soon({ lot }) {
  return <Card className="p-8 text-center text-slate-400">Ce module arrive au lot {lot}.</Card>;
}

export default function App() {
  const { session, needPassword, me, role, signOut } = useAuth();
  const [tab, setTab] = useState('risks');

  if (session === undefined) return <div className="p-8 text-slate-400">Chargement…</div>;
  if (needPassword) return <SetPassword />;
  if (!session) return <Login />;

  const cur = TABS.find((t) => t.id === tab);
  const View = cur.C;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-line bg-c1 p-4 sticky top-0 h-screen">
        <div className="px-2 pt-2 pb-5">
          <div className="font-display text-2xl font-bold text-white leading-none">Aeon Velocity</div>
          <div className="text-xs text-slate-400 mt-1">Mission Control</div>
        </div>
        <nav className="space-y-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}
              className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left border ' + (tab === t.id ? 'bg-race/15 text-race border-race/40' : 'text-slate-300 border-transparent hover:bg-c2')}>
              <Icon n={t.icon} size={18} />{t.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto px-2 space-y-2">
          <div className="text-sm text-white">{me?.name ?? session.user.email}</div>
          <Badge tone={role === 'manager' ? 'race' : 'slate'}>{ROLE_LABEL[role]}</Badge>
          <button onClick={signOut} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white"><Icon n="logout" size={14} />Se déconnecter</button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-c1/95 backdrop-blur border-b border-line" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div className="font-display text-xl font-bold text-white leading-none">Aeon Velocity</div>
            <button onClick={signOut} className="text-xs text-slate-400">Déconnexion</button>
          </div>
          <nav className="flex gap-1.5 overflow-x-auto scroll-x px-3 pb-2.5">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={'shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ' + (tab === t.id ? 'bg-race/15 text-race border-race/40' : 'text-slate-300 border-line')}>
                <Icon n={t.icon} size={16} />{t.label}
              </button>
            ))}
          </nav>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {role === 'viewer' && <p className="mb-4 text-sm text-slate-300 bg-c2 border border-line rounded-lg px-4 py-2.5">Vous êtes en lecture seule. Demandez au Team Manager de modifier votre rôle pour pouvoir écrire.</p>}
          {View ? <View /> : <Soon lot={cur.lot} />}
        </main>
      </div>
    </div>
  );
}
