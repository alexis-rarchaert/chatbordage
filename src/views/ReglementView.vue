<template>
  <div class="reg-page">
    <SiteHeader />

    <div class="reg-banner">
      <img src="/hero-banner.webp" alt="" class="reg-banner-img" />
      <h1 class="reg-banner-title">Règlement</h1>
    </div>

    <div class="reg-layout container">
      <aside class="reg-sidebar">
        <h2 class="reg-sidebar-title">Sommaire</h2>
        <nav>
          <a
            v-for="s in sections"
            :key="s.id"
            :href="`#${s.id}`"
            :class="['reg-link', { active: activeId === s.id }]"
          >
            {{ s.title }}
          </a>
        </nav>
      </aside>

      <main class="reg-content">
        <section id="bienvenue" class="reg-section">
          <h2>Bienvenue à bord !</h2>
          <p class="reg-lead">
            Dans <strong>ChatBordage</strong>, chaque joueur commande un navire de pirates félins.
            <em>Mais attention</em> : sous ta carte de matelot se cache un secret. Une mission que <strong>toi seul connais</strong>.
          </p>
        </section>

        <section id="but" class="reg-section">
          <h2>But du jeu</h2>
          <p>
            Chaque joueur a une mission secrète différente (sauf le Capitaine, dont tout le monde connaît le rôle).
            La partie se termine dès qu'un joueur accomplit sa mission. Les missions possibles sont détaillées plus bas.
          </p>
          <div class="reg-tip">
            <strong>Astuce première partie :</strong> jouez une fois « cartes sur table », en révélant les rôles de tous à voix haute,
            juste pour comprendre le déroulement. La vraie partie, avec le secret, n'en sera que meilleure ensuite !
          </div>
        </section>

        <section id="mise-en-place" class="reg-section">
          <h2>Mise en place</h2>
          <ol class="reg-list">
            <li>Chaque joueur se voit attribuer (ou tire au hasard) un <strong>navire</strong> via l'application, visible de tous sur l'écran.</li>
            <li>Chacun consulte son <strong>rôle secret</strong> sur l'application, en cachette des autres. Le Capitaine est annoncé à voix haute : tout le monde doit savoir qui il est.</li>
            <li>Chaque joueur prend <strong>5 points de vie</strong>. Le Capitaine commence avec <strong>6 PV</strong>, parce qu'il est davantage exposé.</li>
            <li>Chaque joueur reçoit une main de départ de <strong>3 cartes</strong>, piochées dans le deck à jouer bien mélangé.</li>
            <li>Le Capitaine commence la partie. Le tour passe ensuite au joueur suivant dans le sens des aiguilles d'une montre.</li>
          </ol>
        </section>

        <section id="tour" class="reg-section">
          <h2>Déroulement d'un tour</h2>
          <p>À son tour, chaque joueur suit toujours les 4 mêmes étapes, dans cet ordre :</p>

          <div class="reg-step">
            <h3>Étape 1 — L'événement de mer</h3>
            <p>
              L'application annonce un événement qui s'applique à tout le monde pendant ce tour : une tempête, une brume épaisse, un coup de chance...
              Tout le monde subit (ou profite de) cet événement de la même façon, sauf indication contraire.
            </p>
          </div>

          <div class="reg-step">
            <h3>Étape 2 — Cartes ou pièces, à toi de choisir</h3>
            <p>
              Le joueur dont c'est le tour choisit <strong>une seule</strong> des deux options : piocher <strong>2 cartes</strong>, OU gagner <strong>2 pièces</strong>.
              Impossible de faire les deux ! Une main ne peut jamais dépasser 5 cartes — si une carte spéciale t'en fait gagner plus, tu devras en défausser à la fin de ton tour pour redescendre à 5.
            </p>
          </div>

          <div class="reg-step">
            <h3>Étape 3 — Joue tes cartes</h3>
            <p>
              Tu peux jouer autant de cartes que tu veux, dans l'ordre que tu veux, et viser n'importe quel autre joueur autour de la table.
              <strong>Mais dès que tu joues une carte Abordage (attaque), ton tour s'arrête immédiatement</strong>, même s'il te reste des cartes en main.
              Réfléchis bien à l'ordre dans lequel tu joues tes cartes !
            </p>
          </div>

          <div class="reg-step">
            <h3>Étape 4 — Le pouvoir de ton navire</h3>
            <p>
              Une fois par tour, tu peux activer le pouvoir spécial de ton navire (certains pouvoirs sont automatiques et n'ont pas besoin d'être activés, regarde bien la fiche de ton navire sur l'application).
            </p>
          </div>

          <div class="reg-tip">
            <strong>Quand un joueur t'attaque,</strong> tu n'es pas totalement impuissant ! Tu as le droit de jouer une carte Voiles juste après pour te défendre, avant que les dégâts ne soient comptés. Garde toujours une carte de défense sous le coude si tu peux.
          </div>
        </section>

        <section id="elimination" class="reg-section">
          <h2>Points de vie et élimination</h2>
          <ul class="reg-list">
            <li>Chaque joueur commence avec <strong>5 points de vie</strong> (6 pour le Capitaine).</li>
            <li>Quand un joueur tombe à 0 PV, il est éliminé : il ne joue plus jusqu'à la fin de la partie.</li>
            <li>Toutes les cartes en main et toutes les pièces du joueur éliminé sont données au joueur qui l'a éliminé.</li>
            <li>Si une carte touche plusieurs joueurs à la fois (comme un Tir groupé) et en élimine deux en même temps, l'auteur de l'attaque récupère les cartes et les pièces des deux.</li>
          </ul>
        </section>

        <section id="roles" class="reg-section">
          <h2>Les rôles secrets</h2>
          <p>
            En tout début de partie, chaque joueur découvre sa mission grâce aux cartes. Personne ne doit savoir le rôle des autres joueurs
            (sauf celui du Capitaine, annoncé à tous). Une seule règle simple : <strong>les rôles ne donnent aucun pouvoir spécial</strong>, juste un objectif à atteindre en secret.
            Tous les pouvoirs du jeu viennent des navires.
          </p>

          <div class="role-grid">
            <article class="role-card" v-for="role in roles" :key="role.name">
              <img :src="role.image" :alt="role.cat" class="role-img" />
              <h3 class="role-name">{{ role.name }}</h3>
              <div class="role-cat">{{ role.cat }} <span class="role-status">{{ role.status }}</span></div>
              <p class="role-mission">{{ role.mission }}</p>
            </article>
          </div>

          <div class="reg-tip">
            Si plusieurs missions semblent se réaliser « au même moment », ce n'est presque jamais vraiment le cas : chaque carte ou action se résout une par une. La toute première mission accomplie, dans l'ordre réel des actions, termine la partie.
          </div>
        </section>

        <section id="navires" class="reg-section">
          <h2>Les navires</h2>
          <p>
            Visible de tous, ton navire affiche tes points de vie de départ, tes dégâts d'attaque de base, et ton pouvoir spécial.
            Choisis-en un qui correspond à ton style de jeu : prudent, agressif, ou rusé !
          </p>
          <p><em>Pour plus de challenge et de fun, tire au hasard ton navire.</em></p>

          <div class="ship-table-wrap">
            <table class="ship-table">
              <thead>
                <tr>
                  <th>Navire</th>
                  <th>PV</th>
                  <th>Dégâts</th>
                  <th>Type</th>
                  <th>Pouvoir</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in ships" :key="s.name">
                  <td><strong>{{ s.name }}</strong></td>
                  <td>{{ s.hp }}</td>
                  <td>{{ s.dmg }}</td>
                  <td>{{ s.type }}</td>
                  <td>{{ s.power }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="precisions" class="reg-section">
          <h2>Petites précisions utiles</h2>
          <ul class="reg-list">
            <li>Tu peux défausser volontairement une carte que tu ne veux pas garder, à n'importe quel moment de ton tour.</li>
            <li>Si ta main dépasse 5 cartes en fin de tour (par exemple après un Coffre de contrebande), tu défausses l'excédent pour redescendre à 5.</li>
            <li>Si la pioche est un jour épuisée, on mélange simplement la défausse pour en faire une nouvelle pioche.</li>
            <li>Si un joueur doit quitter la partie en cours de route, il est traité comme éliminé : ses cartes et ses pièces vont au joueur assis à sa gauche.</li>
            <li>Techniquement, rien n'empêche de jouer une carte sur soi-même (par exemple un Sabotage sur son propre Trésor), mais ça n'a jamais beaucoup d'intérêt !</li>
          </ul>
        </section>

        <section id="contenu" class="reg-section reg-section--last">
          <h2>Contenu de la boîte</h2>
          <ul class="reg-list">
            <li>100 cartes à jouer</li>
            <li>Des pièces (jetons) pour la monnaie du jeu</li>
            <li>L'<strong>application compagnon</strong> ChatBordage (navires, rôles secrets, événements de mer, boutique)</li>
          </ul>
          <p class="reg-meta">4–6 joueurs · 7 à 77 ans · ~30 minutes</p>
          <p class="reg-credits">Tous droits réservés — Groupe 7 — 2026</p>
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
  { id: 'bienvenue', title: 'Bienvenue' },
  { id: 'but', title: 'But du jeu' },
  { id: 'mise-en-place', title: 'Mise en place' },
  { id: 'tour', title: 'Un tour de jeu' },
  { id: 'elimination', title: 'Élimination' },
  { id: 'roles', title: 'Rôles secrets' },
  { id: 'navires', title: 'Les navires' },
  { id: 'precisions', title: 'Précisions' },
  { id: 'contenu', title: 'Contenu' }
]

const roles = [
  {
    name: 'Le Capitaine',
    cat: 'Chat-rles Henri',
    status: '(rôle public)',
    image: '/chats/chat-rles-henri.png',
    mission: 'Survivre et faire en sorte qu\'il ne reste, à la fin, que lui-même et son Protecteur (qu\'il ne connaît pas !). +1 PV de départ.'
  },
  {
    name: 'Le Protecteur',
    cat: 'Miranda',
    status: '(rôle secret)',
    image: '/chats/miranda.png',
    mission: 'Garder le Capitaine en vie jusqu\'à la fin de la partie. Si le Capitaine survit et que le Protecteur est en vie, les deux gagnent ensemble !'
  },
  {
    name: 'Le Chasseur de primes',
    cat: 'Kim',
    status: '(rôle secret)',
    image: '/chats/kim.png',
    mission: 'Être le premier à couler 2 navires ennemis. Dès que c\'est fait, il gagne immédiatement, peu importe ce qui se passe ensuite.'
  },
  {
    name: 'Le Renégat',
    cat: 'Sylas',
    status: '(rôle secret)',
    image: '/chats/sylas.png',
    mission: 'Ne fait équipe avec personne. Doit être le tout dernier survivant : tous les autres joueurs, sans exception, doivent être éliminés.'
  },
  {
    name: 'Le Contrebandier',
    cat: 'Maskey',
    status: '(rôle secret)',
    image: '/chats/maskey.png',
    mission: 'Gagne dès qu\'il possède 15 pièces, à n\'importe quel moment de la partie. Mieux vaut garder un œil sur ses économies que sur ses dégâts.'
  }
]

const ships = [
  { name: 'La Frégate', hp: 6, dmg: 1, type: 'Passif', power: '+1 PV à chaque élimination ennemie.' },
  { name: 'Le Galion', hp: 5, dmg: 2, type: 'Passif', power: 'Main maximale portée à 6 cartes.' },
  { name: 'La Corvette', hp: 4, dmg: 1, type: 'Actif (1x/partie)', power: 'Esquive une attaque complètement.' },
  { name: 'Le Vaisseau Fantôme', hp: 5, dmg: 1, type: 'Passif', power: 'Ton rôle ne peut jamais être révélé par l\'ennemi.' },
  { name: 'La Caravelle', hp: 5, dmg: 1, type: 'Actif (passif en pratique)', power: 'Pioche 1 carte supplémentaire gratuite chaque tour.' },
  { name: 'Le Sloop', hp: 4, dmg: 1, type: 'Actif (1x/tour)', power: 'Échange une carte de ta main contre une carte au hasard de la pioche.' },
  { name: 'Le Brick', hp: 5, dmg: 1, type: 'Passif', power: 'Quand tu es attaqué, pioche 1 carte.' },
  { name: 'La Jonque', hp: 4, dmg: 1, type: 'Actif (1x/tour)', power: 'Regarde la carte du dessus de la pioche ; garde-la ou remets-la dessous.' },
  { name: 'Le Trois-Mâts', hp: 6, dmg: 1, type: 'Passif', power: 'Tes cartes Équipement ne peuvent pas être détruites.' },
  { name: 'La Felouque', hp: 4, dmg: 2, type: 'Passif', power: 'Si tu attaques un joueur qui a plus de PV que toi, +1 dégât bonus.' },
  { name: 'Le Cotre', hp: 5, dmg: 1, type: 'Actif (1x/partie)', power: 'Vole 1 carte au hasard dans la main d\'un adversaire.' },
  { name: 'Le Brigantin', hp: 4, dmg: 1, type: 'Passif', power: 'Quand tu élimines un joueur, pioche 2 cartes en bonus.' },
  { name: 'Le Clipper', hp: 4, dmg: 1, type: 'Actif (1x/tour)', power: 'Si tu n\'as joué aucune carte Attaque ce tour, gagne 1 pièce bonus.' },
  { name: 'La Gabare', hp: 5, dmg: 1, type: 'Passif', power: 'Gagne 1 pièce supplémentaire chaque fois que tu choisis l\'option pièces.' },
  { name: 'Le Cuirassé', hp: 7, dmg: 1, type: 'Passif', power: '-1 dégât sur toutes les attaques reçues (minimum 1).' }
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
