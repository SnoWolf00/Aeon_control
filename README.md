# Aeon Velocity · Mission Control

## Lancer en local
1. `npm install`
2. Copier `.env.example` en `.env` et renseigner l'URL et la clé anon Supabase.
3. `npm run dev`

## Déployer
Pousser sur GitHub, importer le dépôt dans Vercel, ajouter les deux variables
`VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, puis Deploy.

## Rôles
Changer le rôle d'un membre (manager, lead, member, viewer) :
update profiles set role = 'lead' where id = (select id from auth.users where email = 'x@y.fr');
