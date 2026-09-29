// Edge Function `game` — serveur autoritatif des parties en ligne ChatBordage.
//
// Le client n'envoie que des intentions (créer, rejoindre, jouer une carte…). L'état complet reste
// dans `game_rooms` (inaccessible aux clients) ; chaque joueur reçoit sa vue filtrée dans `game_views`.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  type Action, type Room, type Res, type Ctx,
  applyAction, processTimers, forfeit, advance,
  newRoom, joinRoom, updateSeat, updateSettings, leaveLobby, kickFromLobby, startRoom, viewForUser,
  cleanName
} from '../_shared/game/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // sans I ni O
const randomCode = () =>
  Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')

// Chaque vue porte la version de l'état dont elle est issue : le client ignore les vues plus anciennes.
const versioned = (view: unknown, version: number) => (view ? { ...(view as object), version } : view)

const ctx = (): Ctx => ({ rand: Math.random, now: Date.now() })

type RoomRow = {
  id: string; code: string; host_id: string; status: Room['status']
  seats: Room['seats']; settings: Room['settings']; state: Room['state']; version: number
}

const toRoom = (r: RoomRow): Room => ({
  code: r.code, hostId: r.host_id, status: r.status, seats: r.seats, settings: r.settings, state: r.state
})

async function loadRoom(code: string): Promise<RoomRow | null> {
  const { data } = await admin.from('game_rooms').select('*').eq('code', code.toUpperCase().trim()).maybeSingle()
  return (data as RoomRow | null) ?? null
}

/** Écrit l'état + les vues de chaque joueur. Renvoie false en cas de conflit de version. */
async function saveRoom(row: RoomRow, room: Room, removedUserIds: string[] = []): Promise<boolean> {
  if (room.state?.phase === 'finished') room.status = 'finished'
  const version = row.version + 1
  const { data, error } = await admin
    .from('game_rooms')
    .update({
      host_id: room.hostId, status: room.status, seats: room.seats, settings: room.settings,
      state: room.state, version, updated_at: new Date().toISOString()
    })
    .eq('id', row.id).eq('version', row.version)
    .select('id')
  if (error) throw error
  if (!data?.length) return false

  const now = ctx()
  const views = room.seats.map(s => ({
    room_id: row.id, user_id: s.userId, view: versioned(viewForUser(room, s.userId, now), version), version,
    updated_at: new Date().toISOString()
  }))
  if (views.length) {
    const { error: vErr } = await admin.from('game_views').upsert(views)
    if (vErr) throw vErr
  }
  if (removedUserIds.length) {
    await admin.from('game_views').delete().eq('room_id', row.id).in('user_id', removedUserIds)
  }
  return true
}

/** Charge, mute, sauvegarde ; réessaie si quelqu'un a écrit entre-temps. */
async function mutate(
  code: string,
  userId: string,
  fn: (room: Room) => Res | boolean,
  opts: { requireSeat?: boolean } = {}
): Promise<{ error?: string; view?: unknown; roomCode?: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const row = await loadRoom(code)
    if (!row) return { error: 'Salon introuvable.' }
    const room = toRoom(row)
    if (opts.requireSeat !== false && !room.seats.some(s => s.userId === userId)) {
      return { error: 'Tu ne fais pas partie de ce salon.' }
    }
    const before = room.seats.map(s => s.userId)
    let version = row.version
    const res = fn(room)
    if (typeof res === 'object' && !res.ok) return { error: res.error }
    const changed = res !== false
    if (changed) {
      const removed = before.filter(id => !room.seats.some(s => s.userId === id))
      if (!room.seats.length) {
        await admin.from('game_rooms').delete().eq('id', row.id)
        return { roomCode: room.code }
      }
      if (!(await saveRoom(row, room, removed))) continue
      version = row.version + 1
    }
    return { view: versioned(viewForUser(room, userId, ctx()), version), roomCode: room.code }
  }
  return { error: 'Le salon est très animé, réessaie.' }
}

async function verifyActivationCode(raw: unknown): Promise<boolean> {
  const code = String(raw ?? '').trim().toUpperCase()
  if (!/^[A-Z0-9-]{8,32}$/.test(code)) return false
  const { data, error } = await admin.from('activation_codes').select('code').eq('code', code).maybeSingle()
  if (error) { console.error('[game] activation_codes', error); return false }
  return !!data
}

async function userFromRequest(req: Request): Promise<string | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  return error || !data.user ? null : data.user.id
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405)

  try {
    const userId = await userFromRequest(req)
    if (!userId) return json({ error: 'Non authentifié' }, 401)

    const body = await req.json()
    const op = String(body.op ?? '')
    const code = String(body.roomCode ?? '')

    let out: { error?: string; view?: unknown; roomCode?: string }

    switch (op) {
      case 'create': {
        const name = cleanName(body.name)
        if (!name) return json({ ok: false, error: 'Choisis un pseudo.' })
        if (!(await verifyActivationCode(body.activationCode))) {
          return json({ ok: false, error: 'invalid_code' })
        }
        let created: Room | null = null
        for (let i = 0; i < 8 && !created; i++) {
          const room = newRoom(randomCode(), userId, name, body.settings ?? {})
          const { data, error } = await admin.from('game_rooms').insert({
            code: room.code, host_id: userId, status: 'lobby', seats: room.seats, settings: room.settings, state: null
          }).select('id').single()
          if (error) { if (error.code === '23505') continue; throw error }
          await admin.from('game_views').upsert({
            room_id: data.id, user_id: userId, view: versioned(viewForUser(room, userId, ctx()), 0), version: 0
          })
          created = room
        }
        if (!created) return json({ ok: false, error: 'Impossible de créer le salon, réessaie.' })
        return json({ ok: true, roomCode: created.code, view: versioned(viewForUser(created, userId, ctx()), 0) })
      }

      case 'join':
        out = await mutate(code, userId, room => joinRoom(room, userId, body.name), { requireSeat: false })
        break

      case 'seat':
        out = await mutate(code, userId, room => updateSeat(room, userId, {
          shipId: body.shipId === undefined ? undefined : (body.shipId || null),
          ready: body.ready === undefined ? undefined : !!body.ready
        }))
        break

      case 'settings':
        out = await mutate(code, userId, room => updateSettings(room, userId, body.settings ?? {}))
        break

      case 'kick':
        out = await mutate(code, userId, room => kickFromLobby(room, userId, String(body.targetId ?? '')))
        break

      case 'start':
        out = await mutate(code, userId, room => startRoom(room, userId, ctx()))
        break

      case 'leave':
        out = await mutate(code, userId, room => {
          if (room.status === 'lobby') return leaveLobby(room, userId)
          if (room.state && room.status === 'playing') {
            forfeit(room.state, userId, ctx())
            advance(room.state, ctx())
          }
          return true
        })
        if (!out.error) {
          // Le joueur n'a plus de vue à suivre dans un salon qu'il a quitté.
          const row = await loadRoom(code)
          if (row) await admin.from('game_views').delete().eq('room_id', row.id).eq('user_id', userId)
          return json({ ok: true, left: true })
        }
        break

      case 'act':
        out = await mutate(code, userId, room => {
          if (room.status === 'lobby' || !room.state) return { ok: false, error: 'La partie n\'a pas commencé.' } as Res
          return applyAction(room.state, userId, body.action as Action, ctx())
        })
        break

      case 'sync':
        // Lecture + avancement des minuteurs (réaction ou tour en retard) même si personne ne joue.
        out = await mutate(code, userId, room => {
          if (room.status !== 'playing' || !room.state) return false
          return processTimers(room.state, ctx())
        })
        break

      default:
        return json({ error: 'Opération inconnue' }, 400)
    }

    if (out.error) return json({ ok: false, error: out.error })
    return json({ ok: true, roomCode: out.roomCode, view: out.view })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[game]', message)
    return json({ error: 'Erreur serveur', detail: message }, 500)
  }
})
