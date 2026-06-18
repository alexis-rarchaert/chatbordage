<template>
  <div class="reg-page">
    <SiteHeader />

    <div class="reg-banner">
      <img src="/hero-banner.webp" alt="" class="reg-banner-img" />
      <h1 class="reg-banner-title">{{ $t('header.rules') }}</h1>
    </div>

    <div class="reg-layout container">
      <aside class="reg-sidebar">
        <h2 class="reg-sidebar-title">{{ $t('rules.sommaire') }}</h2>
        <nav>
          <a
            v-for="s in sections"
            :key="s.id"
            :href="`#${s.id}`"
            :class="['reg-link', { active: activeId === s.id }]"
          >
            {{ $t('rules.sections.' + s.key) }}
          </a>
        </nav>
      </aside>

      <main class="reg-content">
        <section id="bienvenue" class="reg-section">
          <h2>{{ $t('rules.welcome.title') }}</h2>
          <p class="reg-lead" v-html="$t('rules.welcome.lead')"></p>
        </section>

        <section id="but" class="reg-section">
          <h2>{{ $t('rules.goal.title') }}</h2>
          <p>{{ $t('rules.goal.p1') }}</p>
          <div class="reg-tip" v-html="$t('rules.goal.tip')"></div>
        </section>

        <section id="mise-en-place" class="reg-section">
          <h2>{{ $t('rules.setup.title') }}</h2>
          <ol class="reg-list">
            <li v-html="$t('rules.setup.item1')"></li>
            <li v-html="$t('rules.setup.item2')"></li>
            <li v-html="$t('rules.setup.item3')"></li>
            <li v-html="$t('rules.setup.item4')"></li>
            <li v-html="$t('rules.setup.item5')"></li>
          </ol>
        </section>

        <section id="tour" class="reg-section">
          <h2>{{ $t('rules.tour.title') }}</h2>
          <p>{{ $t('rules.tour.p1') }}</p>

          <div class="reg-step">
            <h3>{{ $t('rules.tour.step1Title') }}</h3>
            <p>{{ $t('rules.tour.step1Desc') }}</p>
          </div>

          <div class="reg-step">
            <h3>{{ $t('rules.tour.step2Title') }}</h3>
            <p v-html="$t('rules.tour.step2Desc')"></p>
          </div>

          <div class="reg-step">
            <h3>{{ $t('rules.tour.step3Title') }}</h3>
            <p v-html="$t('rules.tour.step3Desc')"></p>
          </div>

          <div class="reg-step">
            <h3>{{ $t('rules.tour.step4Title') }}</h3>
            <p>{{ $t('rules.tour.step4Desc') }}</p>
          </div>

          <div class="reg-tip" v-html="$t('rules.tour.tip')"></div>
        </section>

        <section id="elimination" class="reg-section">
          <h2>{{ $t('rules.elimination.title') }}</h2>
          <ul class="reg-list">
            <li v-html="$t('rules.elimination.item1')"></li>
            <li v-html="$t('rules.elimination.item2')"></li>
            <li v-html="$t('rules.elimination.item3')"></li>
            <li v-html="$t('rules.elimination.item4')"></li>
          </ul>
        </section>

        <section id="roles" class="reg-section">
          <h2>{{ $t('rules.roles.title') }}</h2>
          <p v-html="$t('rules.roles.p1')"></p>

          <div class="role-grid">
            <article class="role-card" v-for="role in roles" :key="role.id">
              <img :src="role.image" :alt="role.cat" class="role-img" />
              <h3 class="role-name">{{ $t('roles.' + role.id + '.name') }}</h3>
              <div class="role-cat">{{ role.cat }} <span class="role-status">{{ $t(role.statusKey) }}</span></div>
              <p class="role-mission">{{ $t('roles.' + role.id + '.mission') }}</p>
            </article>
          </div>

          <div class="reg-tip" v-html="$t('rules.roles.tip')"></div>
        </section>

        <section id="navires" class="reg-section">
          <h2>{{ $t('rules.ships.title') }}</h2>
          <p>{{ $t('rules.ships.p1') }}</p>
          <p v-html="$t('rules.ships.p2')"></p>

          <div class="ship-table-wrap">
            <table class="ship-table">
              <thead>
                <tr>
                  <th>{{ $t('brief.ships') }}</th>
                  <th>PV</th>
                  <th>Dégâts</th>
                  <th>Type</th>
                  <th>Pouvoir</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in ships" :key="s.id">
                  <td><strong>{{ $t('ships.' + s.id + '.name') }}</strong></td>
                  <td>{{ s.hp }}</td>
                  <td>{{ s.dmg }}</td>
                  <td>{{ $t(s.typeKey) }}</td>
                  <td>{{ $t('ships.' + s.id + '.ability') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="precisions" class="reg-section">
          <h2>{{ $t('rules.precisions.title') }}</h2>
          <ul class="reg-list">
            <li>{{ $t('rules.precisions.item1') }}</li>
            <li>{{ $t('rules.precisions.item2') }}</li>
            <li>{{ $t('rules.precisions.item3') }}</li>
            <li>{{ $t('rules.precisions.item4') }}</li>
            <li>{{ $t('rules.precisions.item5') }}</li>
          </ul>
        </section>

        <section id="contenu" class="reg-section reg-section--last">
          <h2>{{ $t('rules.content.title') }}</h2>
          <ul class="reg-list">
            <li>{{ $t('rules.content.item1') }}</li>
            <li>{{ $t('rules.content.item2') }}</li>
            <li v-html="$t('rules.content.item3')"></li>
          </ul>
          <p class="reg-meta">{{ $t('rules.content.meta') }}</p>
          <p class="reg-credits">{{ $t('rules.content.credits') }}</p>
        </section>
      </main>
    </div>

    <SiteFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'

const sections = [
  { id: 'bienvenue', key: 'bienvenue' },
  { id: 'but', key: 'but' },
  { id: 'mise-en-place', key: 'miseEnPlace' },
  { id: 'tour', key: 'tour' },
  { id: 'elimination', key: 'elimination' },
  { id: 'roles', key: 'roles' },
  { id: 'navires', key: 'navires' },
  { id: 'precisions', key: 'precisions' },
  { id: 'contenu', key: 'contenu' }
]

const roles = [
  {
    id: 'capitaine',
    cat: 'Chat-rles Henri',
    statusKey: 'rules.roleStatus.public',
    image: '/chats/chat-rles-henri.png'
  },
  {
    id: 'protecteur',
    cat: 'Miranda',
    statusKey: 'rules.roleStatus.secret',
    image: '/chats/miranda.png'
  },
  {
    id: 'chasseur',
    cat: 'Kim',
    statusKey: 'rules.roleStatus.secret',
    image: '/chats/kim.png'
  },
  {
    id: 'renegat',
    cat: 'Sylas',
    statusKey: 'rules.roleStatus.secret',
    image: '/chats/sylas.png'
  },
  {
    id: 'contrebandier',
    cat: 'Maskey',
    statusKey: 'rules.roleStatus.secret',
    image: '/chats/maskey.png'
  }
]

const ships = [
  { id: 'fregate', hp: 6, dmg: 1, typeKey: 'ships.powerTypes.passive' },
  { id: 'galion', hp: 5, dmg: 2, typeKey: 'ships.powerTypes.passive' },
  { id: 'corvette', hp: 4, dmg: 1, typeKey: 'ships.powerTypes.activeOnce' },
  { id: 'fantome', hp: 5, dmg: 1, typeKey: 'ships.powerTypes.passive' },
  { id: 'caravelle', hp: 5, dmg: 1, typeKey: 'ships.powerTypes.activePassive' },
  { id: 'sloop', hp: 4, dmg: 1, typeKey: 'ships.powerTypes.activeTurn' },
  { id: 'brick', hp: 5, dmg: 1, typeKey: 'ships.powerTypes.passive' },
  { id: 'jonque', hp: 4, dmg: 1, typeKey: 'ships.powerTypes.activeTurn' },
  { id: 'troismats', hp: 6, dmg: 1, typeKey: 'ships.powerTypes.passive' },
  { id: 'felouque', hp: 4, dmg: 2, typeKey: 'ships.powerTypes.passive' },
  { id: 'cotre', hp: 5, dmg: 1, typeKey: 'ships.powerTypes.activeOnce' },
  { id: 'brigantin', hp: 4, dmg: 1, typeKey: 'ships.powerTypes.passive' },
  { id: 'clipper', hp: 4, dmg: 1, typeKey: 'ships.powerTypes.activeTurn' },
  { id: 'gabare', hp: 5, dmg: 1, typeKey: 'ships.powerTypes.passive' },
  { id: 'cuirasse', hp: 7, dmg: 1, typeKey: 'ships.powerTypes.passive' }
]

const activeId = ref('bienvenue')
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) activeId.value = e.target.id
      })
    },
    { rootMargin: '-30% 0px -60% 0px' }
  )
  sections.forEach(s => {
    const el = document.getElementById(s.id)
    if (el) observer!.observe(el)
  })
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.reg-page {
  background: var(--color-burgundy);
  color: var(--color-text-light);
  min-height: 100vh;
}

.reg-banner {
  position: relative;
  min-height: clamp(180px, 26vw, 280px);
  border-bottom: 3px solid var(--color-gold);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.reg-banner-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.reg-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(107, 25, 34, 0.4) 100%);
}
.reg-banner-title {
  position: relative;
  z-index: 1;
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: clamp(48px, 8vw, 80px);
  text-shadow: 0 3px 0 var(--color-burgundy-dark), 0 6px 16px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.05em;
}

.reg-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 48px;
  padding: clamp(32px, 5vw, 64px) 20px;
  align-items: start;
}

.reg-sidebar {
  position: sticky;
  top: 80px;
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.95) 0%, rgba(60, 12, 18, 0.95) 100%);
  border: 2px solid var(--color-gold);
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}
.reg-sidebar-title {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 24px;
  margin-bottom: 16px;
  text-align: center;
  border-bottom: 1px solid rgba(200, 162, 74, 0.3);
  padding-bottom: 10px;
}
.reg-link {
  display: block;
  padding: 8px 12px;
  color: var(--color-text-light);
  text-decoration: none;
  font-size: 14px;
  border-radius: 6px;
  margin-bottom: 4px;
  border-left: 3px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.reg-link:hover {
  background: rgba(200, 162, 74, 0.1);
  color: var(--color-gold);
}
.reg-link.active {
  background: rgba(200, 162, 74, 0.15);
  color: var(--color-gold);
  border-left-color: var(--color-gold);
  font-weight: 600;
}

.reg-content { min-width: 0; }
.reg-section {
  scroll-margin-top: 100px;
  padding: 28px 32px;
  margin-bottom: 28px;
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.7) 0%, rgba(60, 12, 18, 0.7) 100%);
  border: 1px solid rgba(200, 162, 74, 0.3);
  border-radius: var(--radius-lg);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}
.reg-section--last { margin-bottom: 0; }
.reg-section h2 {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: clamp(28px, 3.5vw, 36px);
  margin-bottom: 16px;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 0 var(--color-burgundy-dark);
}
.reg-section h3 {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 22px;
  margin: 0 0 10px;
  letter-spacing: 0.03em;
}
.reg-section p { margin: 12px 0; line-height: 1.7; }
.reg-lead { font-size: 17px; }
.reg-step {
  margin: 20px 0;
  padding-left: 16px;
  border-left: 3px solid var(--color-gold-dark);
}
.reg-list { line-height: 1.8; padding-left: 24px; }
.reg-list li { margin-bottom: 8px; }
.reg-section :deep(strong) { color: var(--color-gold); }
.reg-tip {
  margin-top: 20px;
  padding: 16px 20px;
  background: rgba(58, 170, 176, 0.12);
  border-left: 4px solid var(--color-turquoise);
  border-radius: 8px;
  font-size: 14.5px;
  font-style: italic;
  line-height: 1.6;
}
.reg-tip :deep(strong) { font-style: normal; color: var(--color-turquoise); }

.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin: 24px 0;
}
.role-card {
  background: linear-gradient(160deg, rgba(60, 12, 18, 0.9) 0%, rgba(45, 8, 13, 0.9) 100%);
  border: 2px solid var(--color-gold);
  border-radius: var(--radius-md);
  padding: 20px;
  text-align: center;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.role-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}
.role-img {
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin: 0 auto 12px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}
.role-name {
  font-family: var(--font-display);
  color: var(--color-gold);
  font-size: 22px;
  margin-bottom: 4px;
}
.role-cat {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-cream);
  margin-bottom: 12px;
}
.role-status {
  font-weight: 400;
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}
.role-mission {
  font-size: 14px;
  line-height: 1.55;
  text-align: left;
  margin: 0;
}

.ship-table-wrap {
  margin-top: 20px;
  overflow-x: auto;
  border-radius: 8px;
}
.ship-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 600px;
}
.ship-table th,
.ship-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid rgba(200, 162, 74, 0.18);
}
.ship-table th {
  background: rgba(200, 162, 74, 0.15);
  color: var(--color-gold);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.04em;
}
.ship-table tr:hover td { background: rgba(200, 162, 74, 0.05); }
.ship-table td:nth-child(2),
.ship-table td:nth-child(3) {
  text-align: center;
  font-weight: 600;
  color: var(--color-gold);
}

.reg-meta {
  margin-top: 16px;
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--color-gold);
  letter-spacing: 0.05em;
}
.reg-credits {
  margin-top: 12px;
  font-size: 12px;
  color: var(--color-text-muted);
  font-style: italic;
}

@media (max-width: 900px) {
  .reg-layout {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .reg-sidebar {
    position: static;
    padding: 16px;
  }
  .reg-sidebar nav {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .reg-link {
    flex: 1 1 auto;
    text-align: center;
    border-left: none;
    border-bottom: 3px solid transparent;
  }
  .reg-link.active {
    border-left-color: transparent;
    border-bottom-color: var(--color-gold);
  }
  .reg-section { padding: 20px; }
}
</style>
