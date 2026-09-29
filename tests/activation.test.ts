import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

/**
 * Teste la migration du code d'activation du compagnon sur un vrai PostgreSQL (PGlite), avec des rôles
 * anon / authenticated comme dans Supabase. Point de départ : l'ancienne table, lisible par tout le monde.
 */
const MIGRATIONS = [
  '20260929020000_companion_activation.sql',
  '20260929020100_companion_activation_redeem.sql',
  '20260929020200_companion_activation_codes.sql'
].map(f => new URL(`../supabase/migrations/${f}`, import.meta.url))
const U = (i: number) => `00000000-0000-0000-0000-00000000000${i}`

async function setup() {
  const db = new PGlite({ extensions: { pgcrypto } })
  await db.exec(`
    create extension if not exists pgcrypto;
    create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table public.activation_codes (code text primary key);
    alter table public.activation_codes enable row level security;
    create policy "public read" on public.activation_codes for select using (true);
    grant select on public.activation_codes to anon, authenticated;
    insert into public.activation_codes values ('OLDD-CODE-0000-1111');
  `)
  // Chaque fichier est exécuté séparément et dans l'ordre, comme dans le SQL Editor du dashboard.
  for (const file of MIGRATIONS) await db.exec(readFileSync(file, 'utf8'))
  const as = async <T>(user: string | null, fn: () => Promise<T>): Promise<T> => {
    await db.exec(`set request.jwt.claim.sub = '${user ?? ''}'`)
    await db.exec(`set role ${user ? 'authenticated' : 'anon'}`)
    try { return await fn() } finally { await db.exec('reset role') }
  }
  const redeem = (u: string, code: string) =>
    as(u, async () => (await db.query<{ r: any }>('select public.redeem_activation_code($1) as r', [code])).rows[0]!.r)
  const access = (u: string) =>
    as(u, async () => (await db.query<{ a: boolean }>('select public.has_companion_access() as a')).rows[0]!.a)
  const denied = (u: string | null, sql: string) =>
    as(u, async () => { try { await db.query(sql); return false } catch { return true } })
  const generate = async (n: number) =>
    (await db.query<{ generate_activation_codes: string }>(`select * from public.generate_activation_codes(${n})`)).rows.map(r => r.generate_activation_codes)
  return { db, redeem, access, denied, generate }
}

test('chaque fichier de migration reste sous 100 lignes (le SQL Editor tronque au-delà)', () => {
  for (const file of MIGRATIONS) assert.ok(readFileSync(file, 'utf8').split('\n').length < 100, file.pathname)
})

test('les codes ne sont ni listables ni générables depuis le navigateur', async () => {
  const { db, denied } = await setup()
  for (const u of [null, U(1)]) {
    assert.ok(await denied(u, 'select code from public.activation_codes'), 'lecture de la table')
    assert.ok(await denied(u, 'select code from public.code_activations'), 'lecture des activations')
    assert.ok(await denied(u, 'select public.generate_activation_codes(1)'), 'génération')
  }
  assert.ok(await denied(null, "select public.redeem_activation_code('x')"), 'anon ne peut pas activer')
  await db.close()
})

test('codes générés : format, unicité, alphabet sans caractères ambigus', async () => {
  const { db, generate } = await setup()
  const codes = await generate(200)
  assert.equal(new Set(codes).size, 200)
  assert.ok(codes.every(c => /^[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$/.test(c)))
  await db.close()
})

test('un code active 3 appareils au maximum, sans consommer de place pour le même appareil', async () => {
  const { db, redeem, access, generate } = await setup()
  const [code] = await generate(1)
  assert.equal(await access(U(1)), false)
  assert.deepEqual(await redeem(U(1), code!.toLowerCase().replaceAll('-', ' ')), { ok: true, remaining: 2 })
  assert.equal(await access(U(1)), true)
  assert.equal(await access(U(2)), false)
  assert.equal((await redeem(U(1), code!)).already, true)
  assert.equal((await redeem(U(2), code!)).remaining, 1)
  assert.equal((await redeem(U(3), code!)).remaining, 0)
  assert.deepEqual(await redeem(U(4), code!), { ok: false, error: 'code_used_up' })
  assert.equal(await access(U(4)), false)
  assert.equal((await redeem(U(2), code!)).ok, true, 'les appareils déjà activés restent valides')
  await db.close()
})

test('codes invalides, ancien code hérité accepté', async () => {
  const { db, redeem } = await setup()
  assert.equal((await redeem(U(1), 'trop court')).error, 'invalid_code')
  assert.equal((await redeem(U(1), 'AAAA-BBBB-CCCC-DDDD')).error, 'invalid_code')
  assert.equal((await redeem(U(2), 'OLDD-CODE-0000-1111')).ok, true)
  await db.close()
})

test('anti-devinette : 8 échecs bloquent l\'appareil, pas les autres', async () => {
  const { db, redeem, generate } = await setup()
  const [good] = await generate(1)
  for (let i = 0; i < 8; i++) await redeem(U(6), `ZZZZ-ZZZZ-ZZZZ-Z${String.fromCharCode(65 + i)}ZZ`)
  assert.equal((await redeem(U(6), good!)).error, 'too_many_attempts')
  assert.equal((await redeem(U(7), good!)).ok, true)
  await db.close()
})
