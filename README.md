# .

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

## Deux modes de jeu

- **Jouer en ligne** (`/online`) : le jeu complet, sans boîte, un téléphone par joueur. Gratuit.
- **Compagnon** (`/game`) : complément du jeu de cartes physique. Vous gardez vos cartes, l'appli gère les rôles secrets,
  les événements, la boutique, les PV, les pièces et la victoire. Il partage le moteur de règles du mode en ligne.

## Parties en ligne (un téléphone par joueur)

Route `/online` : salons de 4 à 8 joueurs, sans cartes physiques. Le serveur (Edge Function
`supabase/functions/game`) fait autorité : l'état complet (rôles cachés, mains, pioche) n'est jamais
envoyé aux clients, qui reçoivent uniquement leur **vue filtrée** (`game_views`, protégée par RLS) en temps réel.

Le moteur de jeu (`supabase/functions/_shared/game/`) est partagé entre le navigateur et l'Edge Function.

### Mise en route

1. Appliquer les migrations : `supabase db push` (fichiers de `supabase/migrations/`). Sans passer par la CLI, exécuter dans le SQL Editor, dans l'ordre, `20260929000000_online_game.sql` puis `20260929010000_online_game_chat_spectators.sql`.
2. Dashboard Supabase → *Authentication → Sign In / Providers* → activer **Allow anonymous sign-ins**
   (les joueurs n'ont pas de compte : leur identité anonyme permet la reconnexion).
3. Déployer la fonction : `supabase functions deploy game`.
4. Renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (voir `.env.example`).
5. Optionnel : planifier `select public.purge_old_game_rooms()` avec `pg_cron` pour supprimer les salons abandonnés.

Le jeu est gratuit et ouvert à tous : aucun code n'est requis. Un joueur ne peut pas avoir plus de 3 salons actifs à la fois (garde-fou anti-abus).

### Tests du moteur

```sh
npm test
```
