import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

// Lit une table et se met à jour en direct quand un autre membre la modifie.
export function useTable(table, order, limit) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    let q = supabase.from(table).select('*');
    if (order) q = q.order(order.col, { ascending: order.asc ?? true });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) setError(error.message); else { setRows(data); setError(null); }
    setLoading(false);
  }, [table, order?.col, order?.asc, limit]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel('rt-' + table + '-' + Math.random().toString(36).slice(2, 7))
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, table]);

  return { rows, loading, error, reload: load };
}
