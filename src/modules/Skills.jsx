import { useState } from 'react';
import { supabase } from '../supabase';
import { useTable } from '../useTable';
import { useAuth } from '../auth';
import { Card, Title, Badge, Icon, inp, btnP } from '../ui';

const STATES = ['Non démarrée', 'En cours', 'Acquise'];

function Lvl({ v, on, tone, disabled }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} disabled={disabled} onClick={() => on(v === n ? n - 1 : n)} aria-label={'Niveau ' + n}
          className={'w-5 h-2.5 rounded-sm ' + (n <= v ? tone : 'bg-bg0 border border-line')} />
      ))}
      <span className="ml-1.5 text-xs text-slate-400">{v}/5</span>
    </div>
  );
}

export default function Skills() {
  const { rows, loading, error } = useTable('skills', { col: 'name', asc: true });
  const { profiles, canWrite, isLead, logActivity } = useAuth();
  const [name, setName] = useState('');
  const [err, setErr] = useState(null);

  const run = async (q) => { const { error } = await q; setErr(error ? error.message : null); return !error; };
  const upd = (id, patch) => run(supabase.from('skills').update(patch).eq('id', id));
  const cycle = async (s) => {
    const n = STATES[(STATES.indexOf(s.passation) + 1) % 3];
    if (await upd(s.id, { passation: n })) logActivity('skill', `Passation « ${s.name} » : ${n.toLowerCase()}`);
  };
  const add = async () => {
    if (!name.trim()) return;
    if (await run(supabase.from('skills').insert({ name: name.trim() }))) setName('');
  };
  const remove = (s) => window.confirm(`Supprimer « ${s.name} » ?`) && run(supabase.from('skills').delete().eq('id', s.id));

  const acquired = rows.filter((s) => s.passation === 'Acquise').length;
  const orphan = rows.filter((s) => !s.junior);

  return (
    <div>
      <Title icon="layers" title="Compétences & Transmission" sub="Chaque savoir-faire critique a un référent et un apprenti binômé : la garantie que l’écurie survit au départ de ses seniors.">
        <div className="text-right"><div className="font-display text-3xl font-semibold text-white leading-none">{acquired}/{rows.length}</div><div className="text-xs text-slate-400">passations acquises</div></div>
      </Title>
      {(err || error) && <div className="mb-4 rounded-lg border border-alert/40 bg-alert/10 text-sm text-slate-200 px-4 py-3">Erreur : {err || error}</div>}
      {orphan.length > 0 && (
        <div className="mb-4 rounded-lg border border-alert/40 bg-alert/10 text-sm text-slate-200 px-4 py-3">
          Savoir-faire sans binôme : <span className="font-semibold text-white">{orphan.map((o) => o.name).join(', ')}</span>. Si le référent part, la compétence disparaît avec lui.
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-2xl font-semibold text-white">{s.name}</h3>
              <div className="flex items-center gap-1.5">
                <button disabled={!canWrite} onClick={() => cycle(s)} title="Changer le statut de la passation">
                  <Badge tone={s.passation === 'Acquise' ? 'ok' : s.passation === 'En cours' ? 'race' : 'slate'}>{s.passation}</Badge>
                </button>
                {isLead && <button onClick={() => remove(s)} className="p-1 text-slate-500 hover:text-alert" aria-label="Supprimer"><Icon n="trash" size={14} /></button>}
              </div>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-4">
              <div>
                <div className="text-xs text-slate-400 mb-1">Référent (senior)</div>
                <select disabled={!canWrite} className={inp} value={s.referent ?? ''} onChange={(e) => upd(s.id, { referent: e.target.value || null })}>
                  <option value="">À désigner</option>
                  {profiles.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <div className="mt-2"><Lvl v={s.ref_lvl} disabled={!canWrite} on={(v) => upd(s.id, { ref_lvl: v })} tone="bg-cyan" /></div>
              </div>
              <div className={s.junior ? 'text-race' : 'text-slate-600'}><span className="font-display text-3xl">→</span></div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Apprenti (junior)</div>
                <select disabled={!canWrite} className={inp} value={s.junior ?? ''} onChange={(e) => upd(s.id, { junior: e.target.value || null })}>
                  <option value="">À désigner</option>
                  {profiles.filter((m) => m.id !== s.referent).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <div className="mt-2"><Lvl v={s.jr_lvl} disabled={!canWrite} on={(v) => upd(s.id, { jr_lvl: v })} tone="bg-race" /></div>
              </div>
            </div>
          </Card>
        ))}
        {!loading && rows.length === 0 && <Card className="p-8 text-center text-slate-400 md:col-span-2">Aucun savoir-faire enregistré.</Card>}
      </div>
      {canWrite && (
        <Card className="p-4 mt-4 flex flex-wrap gap-2">
          <input className={inp + ' flex-1 min-w-[200px]'} placeholder="Ajouter un savoir-faire (ex. : photographie produit)" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className={btnP} onClick={add}><Icon n="plus" size={16} />Ajouter</button>
        </Card>
      )}
    </div>
  );
}
