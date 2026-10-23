import { supabase } from './supabase';

// Appelle une fonction de la base (charger / effacer les données) ; renvoie le message d'erreur ou null.
export async function rpc(name) {
  const { error } = await supabase.rpc(name);
  return error ? error.message : null;
}
