import { createClient } from '@supabase/supabase-js';

// À lire AVANT la création du client : supabase-js efface le hash de l'URL.
export const arrivedViaInvite = /type=(invite|recovery)/.test(window.location.hash);

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) console.error('Variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes.');

export const supabase = createClient(url, key);
