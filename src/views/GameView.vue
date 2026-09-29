<template>
  <div class="game-view">
    <!-- --- ÉCRAN DE LOBBY --- -->
    <template v-if="!isStarted && !isRouletteVisible">
      <div class="lobby-overlay" :class="`players-${playerCount}`">
        <!-- Titres dupliqués pour les deux côtés de la table -->
        <div class="lobby-titles">
          <h1 class="lobby-title title-top">{{ $t('game.lobby.title') }}</h1>
          <p class="companion-note">{{ $t('game.lobby.companionNote') }} <RouterLink to="/online">{{ $t('game.lobby.noBox') }}</RouterLink></p>
          
          <!-- SÉLECTEUR DE NOMBRE DE JOUEURS -->
          <div v-if="!allReady" class="player-count-selector">
            <span class="count-label">{{ $t('game.lobby.playerCount') }}</span>
            <div class="count-controls">
              <button @click="playerCount = Math.max(4, playerCount - 1)" :disabled="playerCount <= 4">-</button>
              <span class="count-value">{{ playerCount }}</span>
              <button @click="playerCount = Math.min(6, playerCount + 1)" :disabled="playerCount >= 6">+</button>
            </div>
          </div>

          <h1 class="lobby-title title-bottom">{{ $t('game.lobby.title') }}</h1>
        </div>
        
        <div 
          v-for="(player, index) in players" 
          :key="index" 
          :class="['corner-group', playerPositions[index]]"
        >
          <div class="selection-card" :class="{ 'is-ready': player.ready }">
            <h2 class="player-name">{{ $t('game.lobby.youArePlayer', { num: index + 1 }) }}</h2>
            
            <!-- SÉLECTEUR DE BATEAU -->
            <div class="selector">
              <button @click.stop="prevBoat(index)" :disabled="player.ready">◀</button>
              <div class="preview-box">
                <img :src="`/bateaux/${allBoats[player.boatIndex].file}`" class="preview-img" />
              </div>
              <button @click.stop="nextBoat(index)" :disabled="player.ready">▶</button>
            </div>
            <p class="item-name">{{ $t('ships.' + allBoats[player.boatIndex].abilityId + '.name') }}</p>
            <p class="boat-ability-text">{{ $t('ships.' + allBoats[player.boatIndex].abilityId + '.ability') }}</p>



            <button 
              class="ready-button" 
              :class="{ 'conflict-error': player.boatConflict }"
              @click="toggleReady(index)"
            >
              {{ player.boatConflict ? $t('game.lobby.alreadyTaken') : (player.ready ? $t('game.lobby.ready') : $t('game.lobby.notReady')) }}
            </button>
          </div>
        </div>

        <button 
          v-if="allReady" 
          class="start-game-button"
          @click="startGame"
        >
          {{ $t('game.lobby.start') }}
        </button>
      </div>
    </template>

    <!-- --- ROULETTE CAPITAINE --- -->
    <template v-else-if="isRouletteVisible">
      <div class="roulette-overlay">
        <div class="roulette-container">
          <h2 class="roulette-title">{{ $t('game.roulette.title') }}</h2>
          
          <div class="wheel-outer">
            <div class="wheel-pointer">▼</div>
            <div class="wheel" :class="{ 'small-wheel': players.length <= 2 }" :style="wheelStyle">
              <div 
                v-for="(player, index) in players" 
                :key="index" 
                class="wheel-segment"
                :style="getSegmentStyle(index)"
              ></div>
              <div 
                v-for="(player, index) in players" 
                :key="'boat-' + index" 
                class="wheel-boat-container"
                :style="getBoatContainerStyle(index)"
              >
                <img :src="`/bateaux/${allBoats[player.boatIndex].file}`" class="wheel-boat-img" :class="{ 'winner-anim': winnerAnimVisible && index === selectedSegment }" />
              </div>
            </div>
          </div>

          <div class="roulette-controls">
            <button 
              v-if="winnerIndex === null" 
              class="spin-button" 
              :disabled="isSpinning"
              @click="spinRoulette"
            >
              {{ isSpinning ? $t('game.roulette.spinning') : $t('game.roulette.spin') }}
            </button>

            <div v-else class="winner-reveal">
              <h3>{{ $t('game.roulette.captainChosen', { name: $t('ships.' + allBoats[players[winnerIndex].boatIndex].abilityId + '.name') }) }}</h3>
              <p class="bonus-text">{{ $t('game.roulette.hpBonus') }}</p>
              <button class="confirm-button" @click="confirmCaptain">{{ $t('game.roulette.startAdventure') }}</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- --- ÉCRAN DE JEU --- -->
    <template v-else>
      <div class="deck-area-controls">
        <button class="shop-button top-shop" @click="openShop(180)">{{ $t('header.shop') }}</button>
        <div class="turn-display top-turn">{{ $t('game.turn.activePlayer') }} {{ currentTurn + 1 }}</div>
      </div>

      <div 
        v-for="(player, index) in players" 
        :key="index" 
        :class="[
          'corner-group', 
          playerPositions[index], 
          { 'current-turn': currentTurn === index },
          { 'selectable-target': (isAttacking || isRevealingRole) && currentTurn !== index && player.hp > 0 },
          { 'eliminated': player.hp === 0 }
        ]"
        @click="handlePlayerClick(index)"
      >
        <div class="pair-container">
          <div class="avatar-box">
            <div v-if="currentTurn === index && player.hp > 0" class="turn-actions-floating">
              <button class="action-button finish-turn-btn" @click.stop="finishTurn">
                {{ $t('game.turn.finish') }}
              </button>
              <button class="action-button attack-btn" @click.stop="initiateAttack">
                {{ $t('game.turn.attackBtn') }}
              </button>
              <button
                v-if="player.canRevealRole"
                class="action-button reveal-role-btn"
                @click.stop="initiateRevealRole"
              >
                {{ $t('game.turn.useSpyglass') }}
              </button>
              <button
                v-if="allBoats[player.boatIndex].type === 'actif' && allBoats[player.boatIndex].abilityId !== 'corvette' && !player.abilityUsed"
                class="action-button ability-btn"
                :title="$t('ships.' + allBoats[player.boatIndex].abilityId + '.ability')"
                @click.stop="useBoatAbility(index)"
              >
                <span class="ability-btn-label">{{ $t('game.turn.shipPower') }}</span>
                <span class="ability-tooltip-bubble">{{ $t('ships.' + allBoats[player.boatIndex].abilityId + '.ability') }}</span>
              </button>
            </div>
            


            <div v-if="isAttacking && currentTurn === index" class="attack-prompt">
              {{ $t('game.turn.selectTarget') }} (-{{ selectedDamage }})
              <span v-if="wantedTargets > 1"> {{ selectedTargets.length }}/{{ wantedTargets }}</span>
            </div>

            <div v-if="isRevealingRole && currentTurn === index" class="attack-prompt">
              {{ $t('game.turn.selectSpyglassTarget') }}
            </div>

            <div v-if="showDamageModal && currentTurn === index" class="damage-modal" @click.stop>
              <div class="damage-modal-content">
                <div class="damage-modal-title" :title="$t('game.attack.hint')">{{ $t('game.turn.howManyHp') }}<small class="damage-sub">{{ $t('game.attack.hintShort') }}</small></div>

                <div class="damage-input-row">
                  <button class="damage-step minus" @click.stop="decreaseDamage">-</button>
                  <input type="number" min="1" v-model="damageInput" class="damage-input" />
                  <button class="damage-step plus" @click.stop="increaseDamage">+</button>
                </div>
                <div class="attack-modes">
                  <button v-for="m in ['single', 'two', 'all']" :key="m" class="mode-btn" :class="{ on: attackMode === m }" @click.stop="attackMode = m">
                    {{ $t('game.attack.mode.' + m) }}
                  </button>
                </div>
                <label class="pierce-row" @click.stop>
                  <input type="checkbox" v-model="attackPierce" /> {{ $t('game.attack.pierce') }}
                </label>
                <div class="damage-modal-actions">
                  <button class="action-button attack-confirm" @click.stop="confirmDamage">{{ $t('game.turn.attack') }}</button>
                  <button class="action-button cancel-button" @click.stop="cancelDamage">{{ $t('game.turn.cancel') }}</button>
                </div>
              </div>
            </div>

            <img :src="`/bateaux/${allBoats[player.boatIndex].file}`" class="boat-img" />
            <!-- Afficher le chat uniquement pour le Capitaine (rôle public) -->
            <img v-if="player.roleId === 'capitaine'" :src="`/chats/${allCats[player.catIndex].file}`" class="cat-img" />
            <div v-if="currentTurn === index" class="turn-badge">{{ $t('game.turn.yourTurn') }}</div>
          </div>
          
          <div class="player-stats" :title="$t('game.edit.open')" @click.stop="openEdit(index)">
            <div class="stat-item hp">
              <span class="stat-icon">❤️</span>
              <span class="stat-value">{{ player.hp }}</span>
            </div>
            <div class="stat-item gold">
              <img src="/coin.png" class="coin-img-icon" />
              <span class="stat-value">{{ player.gold }}</span>
            </div>
          </div>
        </div>
      </div>



      <div class="deck-area-controls bottom-area">
        <div class="turn-display bottom-turn">{{ $t('game.turn.activePlayer') }} {{ currentTurn + 1 }}</div>
        <button class="shop-button bottom-shop" @click="openShop(0)">{{ $t('header.shop') }}</button>
      </div>

      <!-- --- MODALE RÉVÉLATION DES RÔLES --- -->
      <div v-if="showRoleReveal" class="role-reveal-overlay">
        <div class="role-reveal-content">
          <template v-if="roleRevealStep === 'pass'">
            <h2 class="role-title">{{ $t('game.lobby.player') }} {{ roleRevealPlayerIndex + 1 }}</h2>
            <p class="role-desc" v-html="$t('game.reveal.passTablet', { num: roleRevealPlayerIndex + 1 }) + '<br/>' + $t('game.reveal.noPeeking')"></p>
            <button class="role-button" @click="nextRoleReveal">{{ $t('game.reveal.revealButton') }}</button>
          </template>
          <template v-else>
            <h2 class="role-title">{{ players[roleRevealPlayerIndex].roleId === 'capitaine' ? $t('game.reveal.publicRole') : $t('game.reveal.secretRole') }}</h2>
            <img :src="`/chats/${allCats[players[roleRevealPlayerIndex].catIndex].file}`" class="role-cat-img" />
            <h3 class="role-name">{{ $t('roles.' + players[roleRevealPlayerIndex].roleId + '.name') }}</h3>
            <p class="role-desc">{{ $t('roles.' + players[roleRevealPlayerIndex].roleId + '.desc') }}</p>
            <p v-if="players[roleRevealPlayerIndex].roleId === 'capitaine'" class="role-public-note" v-html="$t('game.reveal.publicRoleNote')"></p>
            <button class="role-button" @click="nextRoleReveal">
              {{
                roleRevealPlayerIndex === players.length - 1
                  ? $t('game.reveal.replaceTablet')
                  : players[roleRevealPlayerIndex].roleId === 'capitaine'
                    ? $t('game.reveal.announceAndNext')
                    : $t('game.reveal.hideAndNext')
              }}
            </button>
          </template>
        </div>
      </div>

      <!-- --- MODALE ÉVÉNEMENT DE MER --- -->
      <div v-if="showEventPhase && currentEvent" class="event-overlay">
        <div class="event-content">
          <h2 class="event-round">{{ $t('game.event.round', { round: currentRound }) }}</h2>
          <div class="event-icon">{{ currentEvent.icon }}</div>
          <h3 class="event-title">{{ $t('events.' + currentEvent.id + '.name') }}</h3>
          <p class="event-desc">{{ $t('events.' + currentEvent.id + '.desc') }}</p>
          <button class="event-button" @click="acknowledgeEvent">{{ $t('game.event.startRound') }}</button>
        </div>
      </div>

      <!-- --- MODALE PHASE DE RESSOURCES --- -->
      <div v-if="showResourcePhase" class="resource-overlay">
        <div class="resource-content">
          <h2 class="resource-title">{{ $t('game.resources.title') }}</h2>
          <p class="resource-desc">{{ $t('game.resources.desc', { num: currentTurn + 1 }) }}</p>
          <div class="resource-actions">
            <button class="resource-button gold-btn" @click="chooseGold">
              <img src="/coin.png" class="btn-icon" /> {{ $t('game.resources.takeCoins') }}
            </button>
            <button class="resource-button cards-btn" @click="chooseCards">
              <span class="btn-icon">🎴</span> {{ $t('game.resources.drawCards', { count: cardsToDrawAmount }) }}
            </button>
          </div>
        </div>
      </div>

      <!-- --- MODALE BOUTIQUE --- -->
      <div v-if="showShop" class="shop-overlay" @click.self="closeShop">
        <div class="shop-content" :style="{ transform: `rotate(${shopRotation}deg)` }">
          <button class="close-shop" @click="closeShop">✕</button>
          <h2 class="shop-title">{{ $t('header.shop') }}</h2>
          <div class="shop-grid">
            <div 
              v-for="item in availableShopItems" 
              :key="item.id" 
              class="shop-item"
              :class="{ 'disabled': players[currentTurn].gold < priceOf(item) }"
              @click="buyItem(item)"
            >
              <div class="item-icon">{{ item.icon }}</div>
              <div class="item-info">
                <span class="item-label">{{ $t('shop.items.' + item.id + '.name') }}</span>
                <span class="item-price">{{ priceOf(item) }} <img src="/coin.png" class="price-coin" /></span>
              </div>
            </div>
            <div v-if="availableShopItems.length === 0" class="empty-shop">
              {{ $t('game.shop.empty') }}
            </div>
          </div>
        </div>
      </div>
      <!-- --- MODALE DÉFENSE : la cible répond avec ses cartes physiques --- -->
      <div v-if="defenseIdx !== null && attackRun" class="resource-overlay">
        <div class="resource-content defense-content">
          <h2 class="resource-title">🛡 {{ $t('game.defense.title', { name: allCats[players[defenseIdx].catIndex].name }) }}</h2>
          <p class="resource-desc">
            {{ $t('game.defense.desc', { attacker: allCats[players[attackRun.attackerIdx].catIndex].name, dmg: finalDamage(attackRun.attackerIdx, defenseIdx, attackRun.base) }) }}
          </p>
          <div class="defense-actions">
            <button class="resource-button" @click="applyHit(defenseIdx, 'none')">💥 {{ $t('game.defense.none') }}</button>
            <template v-if="!attackRun.pierce">
              <button class="resource-button" @click="applyHit(defenseIdx, 'block')">⛵ {{ $t('game.defense.block') }}</button>
              <button class="resource-button" @click="applyHit(defenseIdx, 'reflect')">🐈 {{ $t('game.defense.reflect') }}</button>
              <button class="resource-button" @click="applyHit(defenseIdx, 'reduce')">🌫️ {{ $t('game.defense.reduce') }}</button>
            </template>
            <button v-if="canDodge(players[defenseIdx])" class="resource-button" @click="applyHit(defenseIdx, 'dodge')">🚢 {{ $t('game.defense.dodge') }}</button>
          </div>
          <p v-if="attackRun.pierce" class="damage-hint">{{ $t('game.defense.pierceNote') }}</p>
        </div>
      </div>

      <!-- --- MODALE AJUSTEMENT MANUEL (PV / pièces) --- -->
      <div v-if="editIdx !== null" class="resource-overlay" @click.self="closeEdit">
        <div class="resource-content edit-content">
          <h2 class="resource-title">{{ allCats[players[editIdx].catIndex].name }} — {{ $t('ships.' + allBoats[players[editIdx].boatIndex].abilityId + '.name') }}</h2>
          <p class="resource-desc">{{ $t('game.edit.desc') }}</p>
          <div class="edit-row">
            <span>❤️ {{ $t('game.edit.hp') }}</span>
            <button class="damage-step minus" @click="adjustHp(-1)">-</button>
            <b class="edit-val">{{ players[editIdx].hp }}</b>
            <button class="damage-step plus" @click="adjustHp(1)">+</button>
          </div>
          <div class="edit-row">
            <span><img src="/coin.png" class="coin-img-icon" /> {{ $t('game.edit.coins') }}</span>
            <button class="damage-step minus" @click="adjustGold(-1)">-</button>
            <b class="edit-val">{{ players[editIdx].gold }}</b>
            <button class="damage-step plus" @click="adjustGold(1)">+</button>
          </div>
          <button class="resource-button" @click="closeEdit">{{ $t('game.edit.done') }}</button>
        </div>
      </div>

      <!-- --- MODALE FIN DE PARTIE --- -->
      <div v-if="isGameOver" class="end-overlay">
        <div class="end-content">
          <div class="end-flag" aria-hidden="true">🏴‍☠️</div>
          <h2 class="end-title">{{ $t('game.end.gameOver') }}</h2>

          <div v-if="winners.length === 1" class="end-winner">
            <img :src="`/chats/${allCats[winners[0].catIndex].file}`" class="end-cat" />
            <div class="end-meta">
              <div class="end-label">{{ $t('game.end.winner') }}</div>
              <div class="end-name">{{ allCats[winners[0].catIndex].name }}</div>
              <div class="end-role">{{ $t('roles.' + winners[0].roleId + '.name') }}</div>
            </div>
          </div>
          <div v-else-if="winners.length > 1" class="end-winner duo">
            <div v-for="w in winners" :key="w.roleId" class="end-winner-card">
              <img :src="`/chats/${allCats[w.catIndex].file}`" class="end-cat" />
              <div class="end-name">{{ allCats[w.catIndex].name }}</div>
              <div class="end-role">{{ $t('roles.' + w.roleId + '.name') }}</div>
            </div>
          </div>

          <p class="end-reason">{{ victoryReason }}</p>

          <div class="end-actions">
            <button class="end-button primary" @click="restartGame">{{ $t('game.end.playAgain') }}</button>
            <button class="end-button" @click="goHome">{{ $t('game.end.backHome') }}</button>
          </div>
        </div>
      </div>
      <!-- --- MODALE POPUP UNIVERSELLE (DANS LES DEUX SENS) --- -->
      <div v-if="popupData" class="universal-popup-overlay" @click="closePopup">
        <div class="popup-container">
          <div class="popup-card popup-top">
            <h2 class="popup-title">{{ popupData.title }}</h2>
            <p class="popup-desc">{{ popupData.message }}</p>
          </div>
          <div class="popup-card popup-bottom">
            <h2 class="popup-title">{{ popupData.title }}</h2>
            <p class="popup-desc">{{ popupData.message }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { SHOP_ITEMS as GAME_SHOP_ITEMS, SEA_EVENTS, SHIPS, assignRoles, checkVictory as sharedCheckVictory } from '../game';

const { t } = useI18n();

const popupData = ref(null);
let popupTimeout = null;
const triggerPopup = (title, message) => {
  popupData.value = { title, message };
  if (popupTimeout) clearTimeout(popupTimeout);
  popupTimeout = setTimeout(() => {
    popupData.value = null;
  }, 4000);
};
const closePopup = () => {
  popupData.value = null;
  if (popupTimeout) clearTimeout(popupTimeout);
};

const allCats = [
  { file: 'antoine.png', name: 'Antoine' },
  { file: 'bob.png', name: 'Bob' },
  { file: 'chat-rles-henri.png', name: 'Chat-rles Henri' },
  { file: 'escobarre.png', name: 'Escobarre' },
  { file: 'harry.png', name: 'Harry' },
  { file: 'james.png', name: 'James' },
  { file: 'jose.png', name: 'José' },
  { file: 'kim.png', name: 'Kim' },
  { file: 'linette.png', name: 'Linette' },
  { file: 'maskey.png', name: 'Maskey' },
  { file: 'miranda.png', name: 'Miranda' },
  { file: 'pablo.png', name: 'Pablo' },
  { file: 'panoramix.png', name: 'Panoramix' },
  { file: 'sylas.png', name: 'Sylas' },
  { file: 'yasminou.png', name: 'Yasminou' }
];

const allBoats = [
  { file: 'Fregate.webp', name: 'La Frégate', abilityId: 'fregate', type: 'passif', ability: '+1 PV à chaque élimination ennemie.' },
  { file: 'Galion.webp', name: 'Le Galion', abilityId: 'galion', type: 'passif', ability: 'Main max à 6 cartes (non implémenté visuellement).' },
  { file: 'Corvette.webp', name: 'La Corvette', abilityId: 'corvette', type: 'actif', ability: 'Esquive une attaque (1x/partie).' },
  { file: 'Vaisseau_Fantôme.webp', name: 'Vaisseau Fantôme', abilityId: 'fantome', type: 'passif', ability: 'Rôle caché indétectable (non implémenté car pas de rôle).' },
  { file: 'Caravelle.webp', name: 'La Caravelle', abilityId: 'caravelle', type: 'passif', ability: 'Pioche 1 carte supplémentaire gratuite chaque tour.' },
  { file: 'sloop.webp', name: 'Le Sloop', abilityId: 'sloop', type: 'actif', ability: 'Échange une carte de la main (1x/tour).' },
  { file: 'brick.webp', name: 'Le Brick', abilityId: 'brick', type: 'passif', ability: 'Quand attaqué, pioche 1 carte.' },
  { file: 'jonque.webp', name: 'La Jonque', abilityId: 'jonque', type: 'actif', ability: 'Regarde et remet la 1ère carte (1x/tour).' },
  { file: 'trois-mats.webp', name: 'Trois-Mâts', abilityId: 'troismats', type: 'passif', ability: 'Équipements indestructibles (non implémenté).' },
  { file: 'felouque.webp', name: 'La Felouque', abilityId: 'felouque', type: 'passif', ability: 'Si cible a plus de PV, +1 dégât bonus.' },
  { file: 'cotre.webp', name: 'Le Cotre', abilityId: 'cotre', type: 'actif', ability: 'Vole 1 carte (1x/partie).' },
  { file: 'brigantin.webp', name: 'Le Brigantin', abilityId: 'brigantin', type: 'passif', ability: 'À l\'élimination d\'un joueur, pioche 2 cartes bonus.' },
  { file: 'clipper.webp', name: 'Le Clipper', abilityId: 'clipper', type: 'passif', ability: 'Si aucune attaque, gagne 1 pièce bonus en fin de tour.' },
  { file: 'gabare.webp', name: 'La Gabare', abilityId: 'gabare', type: 'passif', ability: '+1 pièce si l\'option pièces est choisie.' },
  { file: 'cuirasse.webp', name: 'Le Cuirassé', abilityId: 'cuirasse', type: 'passif', ability: '-1 dégât sur attaques reçues (min 1).' }
];

const isStarted = ref(false);
const isRouletteVisible = ref(false);
const isSpinning = ref(false);
const rouletteRotation = ref(0);
const winnerIndex = ref(null);
const selectedSegment = ref(null);
const winnerAnimVisible = ref(false);
const pixelsPerCm = ref(38);
const playerCount = ref(4);
const showShop = ref(false);
const showResourcePhase = ref(false);
const shopRotation = ref(0);
const currentTurn = ref(0);
const currentRound = ref(1);
const showEventPhase = ref(false);
const currentEvent = ref(null);

// Sequence de révélation des rôles
const showRoleReveal = ref(false);
const roleRevealPlayerIndex = ref(0);
const roleRevealStep = ref('pass'); // 'pass' | 'view'

const nextRoleReveal = () => {
  if (roleRevealStep.value === 'pass') {
    roleRevealStep.value = 'view';
    playRevealSound();
  } else {
    roleRevealPlayerIndex.value++;
    if (roleRevealPlayerIndex.value < players.value.length) {
      roleRevealStep.value = 'pass';
      playUiTap();
    } else {
      // Tous les joueurs ont vu leur rôle → premier tour, avec son événement de mer
      showRoleReveal.value = false;
      startRound();
    }
  }
};

const EVENT_ICONS = {
  calme: '☀️', tempete: '🌪️', brume: '🌫️', tresor: '🏝️', vents: '💨',
  sirenes: '🧜', mutinerie: '🏴‍☠️', reflux: '🌊', kraken: '🐙', aubaine: '🏷️'
};

// Effets que l'appli applique elle-même (PV, pièces) ; les autres sont des rappels pour la table.
const applyEventEffects = (ev) => {
  players.value.forEach(p => {
    if (p.hp <= 0) return;
    if (ev.id === 'tempete' && p.hp > 1) p.hp -= 1;
    if (ev.id === 'tresor') p.gold += 1;
    if (ev.id === 'reflux') p.hp = Math.min(p.maxHp ?? p.hp + 1, p.hp + 1);
  });
};

// Un événement de mer est tiré à CHAQUE tour (document de conception, section 3).
const startRound = () => {
  const ev = SEA_EVENTS[Math.floor(Math.random() * SEA_EVENTS.length)];
  currentEvent.value = { id: ev.id, icon: EVENT_ICONS[ev.id] ?? '🌊' };
  applyEventEffects(ev);
  // Garantir qu'on repasse par event → ressources même si flags traînaient
  showShop.value = false;
  showResourcePhase.value = false;
  isAttacking.value = false;
  showDamageModal.value = false;
  cardBeingPlayed.value = null;
  showEventPhase.value = true;
  playRevealSound();
  evaluateVictory();
};

const isAttacking = ref(false);
const isRevealingRole = ref(false);
const showDamageModal = ref(false);
const cardBeingPlayed = ref(null);

const acknowledgeEvent = () => {
  showEventPhase.value = false;
  showResourcePhase.value = true;
  playUiTap();
};

const isGameOver = ref(false);
const winner = ref(null);

// Mêmes règles que le jeu en ligne (moteur partagé) : on lui présente les joueurs sous sa forme habituelle.
const checkVictory = () => {
  const view = {
    players: players.value.map((p, i) => ({
      id: String(i), name: allCats[p.catIndex].name, roleId: p.roleId,
      isAlive: p.hp > 0, coins: p.gold, eliminationsCount: p.eliminations || 0
    }))
  };
  const v = sharedCheckVictory(view);
  if (!v) return null;
  const winners = v.winners.map(w => players.value[Number(w.id)]);
  const reasonKey = winners.length > 1 ? 'duo'
    : ['contrebandier', 'chasseur', 'capitaine', 'renegat'].includes(winners[0].roleId) ? winners[0].roleId : 'last';
  return { winners, reasonKey };
};

const victoryReason = ref('');
const winners = ref([]);

const evaluateVictory = () => {
  const v = checkVictory();
  if (v) {
    isGameOver.value = true;
    winners.value = v.winners;
    winner.value = v.winners[0] ?? null;
    victoryReason.value = t('game.victory.' + v.reasonKey);
    return true;
  }
  return false;
};

import { useRouter } from 'vue-router';
const __router = useRouter();
const goHome = () => __router.push('/');

const restartGame = () => {
  // Reset complet vers le lobby (les joueurs gardent leur navire/chat de départ choisi)
  isGameOver.value = false;
  winner.value = null;
  winners.value = [];
  victoryReason.value = '';
  isStarted.value = false;
  isRouletteVisible.value = false;
  winnerIndex.value = null;
  selectedSegment.value = null;
  showShop.value = false;
  showResourcePhase.value = false;
  showEventPhase.value = false;
  currentEvent.value = null;
  showRoleReveal.value = false;
  roleRevealPlayerIndex.value = 0;
  roleRevealStep.value = 'pass';
  isAttacking.value = false;
  isRevealingRole.value = false;
  showDamageModal.value = false;
  attackRun.value = null;
  defenseIdx.value = null;
  editIdx.value = null;
  selectedTargets.value = [];

  currentTurn.value = 0;
  currentRound.value = 1;
  // Reset shop items
  shopItems.value.forEach(it => { it.purchased = false; });
  // Reset des players (sans toucher au navire/chat)
  players.value.forEach(p => {
    p.hp = getBaseHp(p.boatIndex);
    p.maxHp = p.hp;
    p.gold = 0;
    p.ready = false;
    p.roleId = null;
    p.eliminations = 0;
    p.abilityUsed = false;
    p.boatConflict = false;
    p.truceTurnsLeft = 0;
    p.buffNextAttack = 0;
    p.revivePending = false;
    p.canRevealRole = false;
  });
};

const nextTurn = () => {
  // Reset des états de tour
  isAttacking.value = false;
  isRevealingRole.value = false;
  showDamageModal.value = false;
  cardBeingPlayed.value = null;
  showShop.value = false;
  showResourcePhase.value = false;
  showEventPhase.value = false;
  currentEvent.value = null;

  // Évaluer la victoire (toutes conditions)
  if (evaluateVictory()) return;

  // Trouver le prochain joueur vivant en sens horaire
  const total = players.value.length;
  let next = (currentTurn.value + 1) % total;
  let guard = total;
  while (players.value[next].hp <= 0 && guard-- > 0) {
    next = (next + 1) % total;
  }

  // Compte les tours de table (le premier joueur revient)
  if (next <= currentTurn.value) currentRound.value += 1;
  currentTurn.value = next;

  // Reset des pouvoirs actifs 1x/tour pour le joueur qui va jouer
  const ship = allBoats[players.value[next].boatIndex];
  if (ship && (ship.abilityId === 'sloop' || ship.abilityId === 'jonque')) {
    players.value[next].abilityUsed = false;
  }

  // Décrémenter trêve
  if (players.value[next].truceTurnsLeft > 0) players.value[next].truceTurnsLeft -= 1;

  playUiTap();

  // Chaque tour commence par un événement de mer, puis le choix cartes / pièces.
  startRound();
};

// Le Clipper gagne 1 pièce en fin de tour s'il n'a pas attaqué (une attaque termine le tour autrement).
const finishTurn = () => {
  const p = players.value[currentTurn.value];
  if (p.hp > 0 && allBoats[p.boatIndex].abilityId === 'clipper') {
    p.gold += 1;
    triggerPopup(t('game.popup.clipper.title'), t('game.popup.clipper.message'));
    playSuccessChime();
  }
  nextTurn();
};

const useBoatAbility = (playerIndex) => {
  const player = players.value[playerIndex];
  const boat = allBoats[player.boatIndex];
  if (player.abilityUsed || boat.type !== 'actif') return;
  // Les pouvoirs qui concernent la pioche physique : rappeler au joueur verbalement
  triggerPopup(t('game.popup.abilityActivated.title'), `${t('ships.' + boat.abilityId + '.name')} :\n${t('ships.' + boat.abilityId + '.ability')}`);
  player.abilityUsed = true;
  playSuccessChime();
};

// Caravelle : 1 carte gratuite par tour, que le joueur pioche OU prenne des pièces (livret de règles).
const caravelleReminder = (player) => {
  if (allBoats[player.boatIndex].abilityId === 'caravelle') {
    triggerPopup(t('game.popup.caravelle.title'), t('game.popup.caravelle.message'));
  }
};

const chooseGold = () => {
  const player = players.value[currentTurn.value];
  const boat = allBoats[player.boatIndex];

  let goldGained = 2;
  // Pouvoir passif: La Gabare (+1 pièce)
  if (boat.abilityId === 'gabare') {
    goldGained += 1;
  }

  player.gold += goldGained;
  showResourcePhase.value = false;
  playSuccessChime();
  caravelleReminder(player);
  // Le Contrebandier peut gagner dès qu'il atteint 15 pièces
  evaluateVictory();
};

const cardsToDrawAmount = computed(() => {
  // Vents favorables : +1 carte piochée. (La carte gratuite de la Caravelle est indépendante du choix.)
  return 2 + (currentEvent.value && currentEvent.value.id === 'vents' ? 1 : 0);
});

const chooseCards = () => {
  const amount = cardsToDrawAmount.value;
  if (amount > 2) {
    triggerPopup(t('game.popup.bonusDraw.title'), t('game.popup.bonusDraw.message', { amount }));
  } else {
    caravelleReminder(players.value[currentTurn.value]);
  }
  showResourcePhase.value = false;
  playSuccessChime();
};

const SHOP_ICONS = {
  reparations: '❤️',
  poudre: '💣',
  coffre: '📦',
  'longue-vue': '🔭',
  treve: '🏳️',
  revivre: '✝️'
};
const shopItems = ref(GAME_SHOP_ITEMS.map(it => ({
  id: it.id,
  name: it.name,
  icon: SHOP_ICONS[it.id] || '🎒',
  price: it.price,
  description: it.description,
  effect: it.effect,
  purchased: false
})));

const availableShopItems = computed(() => shopItems.value.filter(item => !item.purchased));
// Événement « Aubaine » : −1 pièce sur tous les articles ce tour (minimum 1).
const priceOf = (item) => Math.max(1, item.price - (currentEvent.value && currentEvent.value.id === 'aubaine' ? 1 : 0));

const buyItem = (item) => {
  const player = players.value[currentTurn.value];
  if (player.gold < priceOf(item) || item.purchased) {
    playHitSound();
    return;
  }
  player.gold -= priceOf(item);
  item.purchased = true;

  // Effets boutique (livret de règles)
  switch (item.effect) {
    case 'HEAL_FULL':
      // Restaure aux PV de départ du navire (plus bonus Capitaine si applicable)
      player.hp = getBaseHp(player.boatIndex) + (player.roleId === 'capitaine' ? 1 : 0);
      break;
    case 'BUFF_NEXT_ATTACK_2':
      player.buffNextAttack = (player.buffNextAttack || 0) + 2;
      break;
    case 'DRAW_3':
      triggerPopup(t('game.popup.contrabandChest.title'), t('game.popup.contrabandChest.message'));
      break;
    case 'TRUCE_2':
      player.truceTurnsLeft = 2;
      break;
    case 'REVIVE_PENDING':
      player.revivePending = true;
      break;
    case 'REVEAL_ROLE':
      // Pas de ciblage UI ici — on stocke un flag, l'UI peut s'en servir plus tard
      player.canRevealRole = true;
      break;
  }
  playSuccessChime();
};
const selectedDamage = ref(1);
const damageInput = ref(String(selectedDamage.value));
const attackMode = ref('single');   // 'single' | 'two' (Tir groupé) | 'all' (Mitraille)
const attackPierce = ref(false);    // Coup de griffe : ignore les Voiles
const selectedTargets = ref([]);
const attackRun = ref(null);        // { targets, i, base, attackerIdx, pierce }
const defenseIdx = ref(null);       // joueur ciblé qui doit répondre (Voile, Corvette…)
const editIdx = ref(null);          // joueur dont on ajuste PV / pièces à la main

const livingOthers = () => players.value.map((_, i) => i).filter(i => i !== currentTurn.value && players.value[i].hp > 0);
const wantedTargets = computed(() => (attackMode.value === 'two' ? Math.min(2, livingOthers().length) : 1));

const initiateAttack = () => {
  showDamageModal.value = true;
  selectedDamage.value = 1;
  damageInput.value = "1";
  attackMode.value = 'single';
  attackPierce.value = false;
  selectedTargets.value = [];
  playUiTap();
};
const decreaseDamage = () => {
  if (selectedDamage.value > 1) {
    selectedDamage.value--;
    damageInput.value = String(selectedDamage.value);
    playUiTap();
  }
};
const increaseDamage = () => {
  selectedDamage.value++;
  damageInput.value = String(selectedDamage.value);
  playUiTap();
};
const cancelDamage = () => {
  showDamageModal.value = false;
  isAttacking.value = false;
  selectedTargets.value = [];
  playUiTap();
};
const confirmDamage = () => {
  let val = parseInt(damageInput.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  selectedDamage.value = val;
  showDamageModal.value = false;
  selectedTargets.value = [];
  playUiTap();
  if (attackMode.value === 'all') {
    if (livingOthers().length) startAttack(livingOthers());
  } else {
    isAttacking.value = true;
  }
};

const initiateRevealRole = () => {
  isRevealingRole.value = true;
  playUiTap();
};

const performRevealRole = (targetIdx) => {
  const target = players.value[targetIdx];
  const buyer = players.value[currentTurn.value];
  const catName = allCats[target.catIndex].name;
  // Vaisseau Fantôme : son rôle ne peut jamais être révélé par l'ennemi
  if (allBoats[target.boatIndex].abilityId === 'fantome') {
    triggerPopup(t('game.popup.spyglass.title'), t('game.popup.ghostShield', { name: catName }));
  } else {
    triggerPopup(
      t('game.popup.spyglass.title'),
      t('game.popup.spyglass.message', { name: catName, role: t('roles.' + target.roleId + '.name') })
    );
  }
  // Consommer la longue-vue
  buyer.canRevealRole = false;
  isRevealingRole.value = false;
  playSuccessChime();
};

const handlePlayerClick = (index) => {
  if (isRevealingRole.value) {
    if (index !== currentTurn.value && players.value[index].hp > 0) {
      performRevealRole(index);
    }
  } else if (isAttacking.value) {
    pickTarget(index);
  }
};

// ---- Attaque : choix des cibles → défense de chaque cible → dégâts (mêmes règles que le jeu en ligne) ----
const pickTarget = (targetIdx) => {
  if (!isAttacking.value || targetIdx === currentTurn.value) return;
  const target = players.value[targetIdx];
  if (target.hp <= 0 || selectedTargets.value.includes(targetIdx)) return;

  // Trêve : cible intouchable, on garde le tour pour choisir quelqu'un d'autre
  if (target.truceTurnsLeft && target.truceTurnsLeft > 0) {
    triggerPopup(t('game.popup.truce.title'), t('game.popup.truce.message', { name: allCats[target.catIndex].name }));
    playHitSound();
    return;
  }

  selectedTargets.value.push(targetIdx);
  playUiTap();
  if (selectedTargets.value.length >= wantedTargets.value) {
    isAttacking.value = false;
    startAttack([...selectedTargets.value]);
  }
};

const startAttack = (targets) => {
  const attacker = players.value[currentTurn.value];
  let base = selectedDamage.value;
  // Poudre noire (boutique) : +2 sur la prochaine attaque, consommée une fois
  if (attacker.buffNextAttack) {
    base += attacker.buffNextAttack;
    attacker.buffNextAttack = 0;
  }
  attackRun.value = { targets, i: 0, base, attackerIdx: currentTurn.value, pierce: attackPierce.value };
  resolveNext();
};

const canDodge = (player) => allBoats[player.boatIndex].abilityId === 'corvette' && !player.abilityUsed;

// Dégâts finaux sur une cible : bonus du navire, brume, Felouque, Cuirassé.
const finalDamage = (attackerIdx, targetIdx, base) => {
  const attacker = players.value[attackerIdx];
  const target = players.value[targetIdx];
  let dmg = base + (getShipDamage(attacker.boatIndex) - 1);
  if (currentEvent.value && currentEvent.value.id === 'brume') dmg = Math.max(1, dmg - 1);
  if (allBoats[attacker.boatIndex].abilityId === 'felouque' && target.hp > attacker.hp) dmg += 1;
  if (allBoats[target.boatIndex].abilityId === 'cuirasse') dmg = Math.max(1, dmg - 1);
  return dmg;
};

const resolveNext = () => {
  const run = attackRun.value;
  if (!run || isGameOver.value) return;
  while (run.i < run.targets.length) {
    const ti = run.targets[run.i];
    const target = players.value[ti];
    if (target.hp <= 0) { run.i++; continue; }
    if (target.truceTurnsLeft && target.truceTurnsLeft > 0) {
      triggerPopup(t('game.popup.truce.title'), t('game.popup.truce.message', { name: allCats[target.catIndex].name }));
      run.i++;
      continue;
    }
    // Une attaque « perforante » ignore les Voiles, mais pas l'esquive de la Corvette.
    if (run.pierce && !canDodge(target)) { applyHit(ti, 'none'); return; }
    defenseIdx.value = ti; // on attend la réponse de la cible (elle a ses cartes en main)
    return;
  }
  finishAttack();
};

const applyHit = (ti, choice) => {
  const run = attackRun.value;
  if (!run) return;
  defenseIdx.value = null;
  const target = players.value[ti];
  let dmg = finalDamage(run.attackerIdx, ti, run.base);
  if (choice === 'reduce') dmg = Math.max(1, dmg - 2);           // Cape de brume
  if (choice === 'dodge') target.abilityUsed = true; // Corvette : 1x / partie
  const blocked = choice === 'block' || choice === 'reflect' || choice === 'dodge';

  if (blocked) {
    playSuccessChime();
  } else {
    playShopSound();
    damageTo(ti, dmg, run.attackerIdx);
  }
  // Esquive féline : renvoie 1 dégât à l'assaillant
  if (choice === 'reflect') damageTo(run.attackerIdx, 1, ti);

  // Brick : pioche 1 carte dès qu'il est attaqué, même si l'attaque est bloquée
  if (allBoats[target.boatIndex].abilityId === 'brick' && target.hp > 0 && !isGameOver.value) {
    triggerPopup(t('game.popup.brickPower.title'), t('game.popup.brickPower.message', { name: t('ships.brick.name') }));
  }
  run.i++;
  resolveNext();
};

const finishAttack = () => {
  const run = attackRun.value;
  attackRun.value = null;
  defenseIdx.value = null;
  if (!run || isGameOver.value) return;
  // Le Kraken punit l'assaillant de 2 dégâts
  if (currentEvent.value && currentEvent.value.id === 'kraken' && players.value[run.attackerIdx].hp > 0) {
    triggerPopup(t('game.popup.kraken.title'), t('game.popup.kraken.message', { name: allCats[players.value[run.attackerIdx].catIndex].name }));
    damageTo(run.attackerIdx, 2, null);
    if (isGameOver.value) return;
  }
  playUiTap();
  // RÈGLE : Jouer une carte attaque met fin au tour immédiatement
  nextTurn();
};

// Applique des dégâts à un joueur (attaque, renvoi, Kraken, ajustement manuel) et gère son élimination.
const damageTo = (ti, amount, attackerIdx) => {
  const target = players.value[ti];
  if (target.hp <= 0) return;
  target.hp = Math.max(0, target.hp - amount);
  playHitSound();
  if (target.hp > 0) return;

  const catName = allCats[target.catIndex].name;
  // Revivre une fois : la cible revient avec 1 PV au lieu d'être éliminée
  if (target.revivePending) {
    target.revivePending = false;
    target.hp = 1;
    triggerPopup(t('game.popup.revive.title'), t('game.popup.revive.message', { name: catName }));
    return;
  }

  const attacker = attackerIdx !== null && attackerIdx !== undefined ? players.value[attackerIdx] : null;
  let message = t('game.popup.eliminated.message', { name: catName, role: t('roles.' + target.roleId + '.name') });
  if (attacker && attacker.hp > 0) {
    attacker.eliminations += 1;
    attacker.gold += target.gold;
    message += ' ' + t('game.popup.eliminated.loot', { taker: allCats[attacker.catIndex].name });
    // La Frégate regagne 1 PV, le Brigantin pioche 2 cartes physiques
    if (allBoats[attacker.boatIndex].abilityId === 'fregate') attacker.hp = Math.min(attacker.maxHp ?? attacker.hp + 1, attacker.hp + 1);
    if (allBoats[attacker.boatIndex].abilityId === 'brigantin') message += ' ' + t('game.popup.brigantinPower.message');
  } else {
    message += ' ' + t('game.popup.eliminated.discard');
  }
  target.gold = 0;
  // Le rôle d'un joueur éliminé est révélé à tous.
  triggerPopup(t('game.popup.eliminated.title'), message);
  evaluateVictory();
};

// Ajustement manuel : les cartes physiques (Rhum, Cale, Coffre, équipements…) changent PV et pièces.
const openEdit = (index) => {
  if (isGameOver.value || attackRun.value || showRoleReveal.value) return;
  if (isAttacking.value || isRevealingRole.value) { handlePlayerClick(index); return; }
  editIdx.value = index;
  playUiTap();
};
const closeEdit = () => { editIdx.value = null; };
const adjustHp = (delta) => {
  const p = players.value[editIdx.value];
  if (!p || p.hp <= 0) return;
  if (delta < 0) damageTo(editIdx.value, -delta, null);
  else p.hp += delta;
  if (p.hp <= 0) closeEdit();
  playUiTap();
};
const adjustGold = (delta) => {
  const p = players.value[editIdx.value];
  if (!p) return;
  p.gold = Math.max(0, p.gold + delta);
  evaluateVictory();
  playUiTap();
};

const openShop = (rotation) => {
  shopRotation.value = rotation;
  showShop.value = true;
  playShopSound();
  playUiTap();
};

const closeShop = () => {
  showShop.value = false;
  playUiTap();
};

const playerPositions = computed(() => {
  const map = {
    2: ['top-center', 'bottom-center'],
    3: ['top-center', 'bottom-right', 'bottom-left'],
    4: ['top-left', 'top-right', 'bottom-right', 'bottom-left'],
    5: ['top-left', 'top-right', 'bottom-right', 'bottom-center', 'bottom-left'],
    6: ['top-left', 'top-center', 'top-right', 'bottom-right', 'bottom-center', 'bottom-left']
  };

  return map[playerCount.value] || map[4];
});

const getRandomIndex = (max) => Math.floor(Math.random() * max);

const allRoles = [
  { id: 'capitaine', name: 'Capitaine', isPublic: true, desc: 'Survivre jusqu\'au duel final.' },
  { id: 'protecteur', name: 'Protecteur', isPublic: false, desc: 'Garder le Capitaine en vie jusqu\'à la fin.' },
  { id: 'chasseur', name: 'Chasseur de Primes', isPublic: false, desc: 'Couler (éliminer) 2 navires ennemis avant tout le monde.' },
  { id: 'renegat', name: 'Renégat', isPublic: false, desc: 'Être le dernier survivant (voir l\'élimination de tous les autres).' },
  { id: 'contrebandier', name: 'Contrebandier', isPublic: false, desc: 'Accumuler 15 pièces à n\'importe quel moment.' }
];

const players = ref(Array.from({ length: 4 }, () => ({ 
  boatIndex: getRandomIndex(allBoats.length), 
  catIndex: getRandomIndex(allCats.length), 
  ready: false, 
  hp: 5, 
  gold: 0,
  boatConflict: false,
  roleId: null,
  eliminations: 0 // Pour le Chasseur de primes
})));

watch(playerCount, (newCount) => {
  const currentCount = players.value.length;
  if (newCount > currentCount) {
    for (let i = currentCount; i < newCount; i++) {
      players.value.push({ 
        boatIndex: getRandomIndex(allBoats.length), 
        catIndex: getRandomIndex(allCats.length), 
        ready: false, 
        hp: 5, 
        gold: 0,
        hand: [],
        boatConflict: false,
        roleId: null,
        eliminations: 0
      });
    }
  } else if (newCount < currentCount) {
    players.value.splice(newCount);
  }
});

const allReady = computed(() => players.value.every(p => p.ready));

const nextBoat = (idx) => { players.value[idx].boatIndex = (players.value[idx].boatIndex + 1) % allBoats.length; };
const prevBoat = (idx) => { players.value[idx].boatIndex = (players.value[idx].boatIndex - 1 + allBoats.length) % allBoats.length; };
const toggleReady = (idx) => { 
  const player = players.value[idx];
  if (!player.ready) {
    const isBoatTaken = players.value.some((p, i) => i !== idx && p.ready && p.boatIndex === player.boatIndex);
    if (isBoatTaken) {
      playHitSound();
      // Force Vue to notice the deep change
      player.boatConflict = true;
      players.value[idx] = { ...player }; 
      setTimeout(() => { 
        if (players.value[idx]) {
          players.value[idx].boatConflict = false;
          players.value[idx] = { ...players.value[idx] }; 
        }
      }, 2000);
      return;
    }
  }
  player.ready = !player.ready; 
  players.value[idx] = { ...player };
  playUiTap();
};

const isBoatAnimVisible = ref(false);
const animBoatFile = ref(allBoats[0].file);
const boatAnimDuration = 1800; // ms

const startGame = () => {
  // Marquer la partie comme démarrée pour quitter l'écran de lobby
  isStarted.value = true;
  isRouletteVisible.value = true;
};

const playRevealSound = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = 0.08;
  master.connect(context.destination);

  const notes = [392, 523.25, 659.25];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index === 0 ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + index * 0.14);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.12, context.currentTime + index * 0.14 + 0.12);

    gain.gain.setValueAtTime(0.0001, context.currentTime + index * 0.14);
    gain.gain.exponentialRampToValueAtTime(1, context.currentTime + index * 0.14 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + index * 0.14 + 0.22);

    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(context.currentTime + index * 0.14);
    oscillator.stop(context.currentTime + index * 0.14 + 0.24);
  });

  const drum = context.createOscillator();
  const drumGain = context.createGain();
  drum.type = 'sine';
  drum.frequency.setValueAtTime(120, context.currentTime);
  drum.frequency.exponentialRampToValueAtTime(45, context.currentTime + 0.25);
  drumGain.gain.setValueAtTime(0.25, context.currentTime);
  drumGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);
  drum.connect(drumGain);
  drumGain.connect(master);
  drum.start(context.currentTime);
  drum.stop(context.currentTime + 0.3);

  setTimeout(() => context.close(), 1200);
};

// Petit clic neutre pour les interactions UI (ready, draw, buy…)
const playUiTap = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.06);
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.13);
  setTimeout(() => ctx.close(), 400);
};

// Son d'impact grave pour les conflits / erreurs / attaques
const playHitSound = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.18);
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
  setTimeout(() => ctx.close(), 600);
};

const playSuccessChime = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
  setTimeout(() => ctx.close(), 500);
};

const playShopSound = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = new AudioContextClass();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
  setTimeout(() => ctx.close(), 400);
};
const spinRoulette = () => {
  if (isSpinning.value) return;
  
  isSpinning.value = true;
  winnerIndex.value = null;

  const spins = 5 + Math.floor(Math.random() * 5);
  const segmentAngle = 360 / players.value.length;
  const randomSegment = Math.floor(Math.random() * players.value.length);
  selectedSegment.value = randomSegment;

  // Calculer l'angle du centre du segment choisi
  let centerAngle = randomSegment * segmentAngle + segmentAngle / 2;
  if (players.value.length <= 2) centerAngle -= 90;

  const currentRotation = rouletteRotation.value || 0;
  const extraRotation = spins * 360 + (centerAngle - (currentRotation % 360) + 360) % 360;
  rouletteRotation.value = currentRotation + extraRotation;

  const spinDuration = 4000;
  setTimeout(() => {
    isSpinning.value = false;
    playRevealSound();
    // jouer une petite animation de révélation avant d'afficher le gagnant
    winnerAnimVisible.value = true;
    setTimeout(() => {
      winnerIndex.value = selectedSegment.value;
      winnerAnimVisible.value = false;
    }, 800);
  }, spinDuration);
};

// Les identifiants du moteur (trois-mats) diffèrent de ceux de l'interface (troismats).
const shipOf = (boatIndex) => {
  const id = allBoats[boatIndex].abilityId;
  return SHIPS.find(sh => sh.id === (id === 'troismats' ? 'trois-mats' : id));
};
const getBaseHp = (boatIndex) => shipOf(boatIndex)?.hp ?? 5;
const getShipDamage = (boatIndex) => shipOf(boatIndex)?.damage ?? 1;

const confirmCaptain = () => {
  if (winnerIndex.value !== null) {
    // Le Capitaine reçoit le rôle 'capitaine'
    players.value[winnerIndex.value].roleId = 'capitaine';

    // Distribuer les autres rôles : toujours 1 Capitaine + 1 Protecteur, le reste tiré comme en ligne
    const hiddenRoles = assignRoles(players.value.length);
    hiddenRoles.splice(hiddenRoles.indexOf('capitaine'), 1);

    let roleIndex = 0;
    players.value.forEach((player, idx) => {
      if (idx !== winnerIndex.value) {
        player.roleId = hiddenRoles[roleIndex];
        roleIndex++;
      }

      // PV de départ du navire (plus bonus Capitaine)
      player.hp = getBaseHp(player.boatIndex) + (idx === winnerIndex.value ? 1 : 0);
      player.maxHp = player.hp;
    });

    isRouletteVisible.value = false;
    isStarted.value = true;
    currentTurn.value = 0;
    
    // Début de la séquence de révélation des rôles
    showRoleReveal.value = true;
    roleRevealPlayerIndex.value = 0;
    roleRevealStep.value = 'pass';
  }
};

const getSegmentStyle = (index) => {
  const angle = 360 / players.value.length;
  if (players.value.length <= 2) {
    return {
      transform: `rotate(${index * angle}deg)`,
      backgroundColor: index % 2 === 0 ? '#5d2a18' : '#3d1c10',
      border: '1px solid #f1d3a1'
    };
  }
  return {
    transform: `rotate(${index * angle}deg) skewY(${90 - angle}deg)`,
    backgroundColor: index % 2 === 0 ? '#5d2a18' : '#3d1c10',
    border: '1px solid #f1d3a1'
  };
};

const getBoatContainerStyle = (index) => {
  const angle = 360 / players.value.length;
  const translateY = players.value.length <= 2 ? '-10vmin' : '-12vmin';
  let ang = index * angle + angle / 2;
  if (players.value.length <= 2) ang -= 90; // place boats top/bottom instead of left/right
  return {
    transform: `rotate(${ang}deg) translateY(${translateY})`
  };
};

const wheelBackground = computed(() => {
  const n = players.value.length || 1;
  const angle = 360 / n;
  const stops = players.value.map((p, i) => {
    const color = i % 2 === 0 ? '#5d2a18' : '#3d1c10';
    const from = i * angle;
    const to = (i + 1) * angle;
    return `${color} ${from}deg ${to}deg`;
  }).join(', ');
  const startAngle = n <= 2 ? -90 : 0;
  return `conic-gradient(from ${startAngle}deg, ${stops})`;
});

const wheelStyle = computed(() => ({
  transform: `rotate(-${rouletteRotation.value}deg)`,
  background: wheelBackground.value
}));

const updateDPI = () => {
  const div = document.createElement('div');
  div.style.width = '1cm';
  div.style.position = 'absolute';
  div.style.left = '-100%';
  document.body.appendChild(div);
  pixelsPerCm.value = div.offsetWidth;
  document.body.removeChild(div);
};

onMounted(() => {
  updateDPI();
  window.addEventListener('resize', updateDPI);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateDPI);
});
</script>

<style scoped>
.game-view {
  width: 100vw;
  height: 100vh;
  background-image: url('/bois.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  overflow: hidden;
  --ppcm: v-bind(pixelsPerCm);
}

/* --- COMPAGNON : attaque, défense, ajustement --- */
.companion-note { margin: 4px auto 0; max-width: 34rem; text-align: center; font-size: .9rem; color: var(--color-text-muted); }
.companion-note a { color: var(--color-turquoise); }
.damage-hint { font-size: .8rem; opacity: .85; margin: 4px 0; max-width: 18rem; }
.attack-modes { display: flex; gap: 4px; justify-content: center; margin: 4px 0 2px; flex-wrap: wrap; }
.mode-btn { padding: 3px 7px; border-radius: 999px; border: 2px solid rgba(200, 162, 74, .6); background: transparent; color: inherit; cursor: pointer; font-size: .7rem; }
.damage-sub { display: block; font-size: .68rem; opacity: .8; font-weight: normal; }
.mode-btn.on { background: var(--color-gold); color: var(--color-ink); }
.pierce-row { display: flex; align-items: center; gap: 6px; justify-content: center; font-size: .72rem; margin-bottom: 2px; }
.defense-actions { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
.edit-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 12px 0; }
.edit-val { min-width: 2.2rem; text-align: center; font-size: 1.6rem; }

/* --- LOBBY STYLES --- */
.lobby-overlay {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.lobby-titles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15vmin;
  pointer-events: none;
  z-index: 10;
}

.players-2 .lobby-titles,
.players-3 .lobby-titles,
.players-5 .lobby-titles,
.players-6 .lobby-titles {
  gap: 2vmin;
}

.lobby-title {
  font-family: 'Georgia', serif;
  color: #f1d3a1;
  text-shadow: 2px 2px 10px rgba(0,0,0,0.8);
  font-size: clamp(1.2rem, 5vmin, 3rem);
  margin: 0;
  white-space: nowrap;
}

.title-top {
  transform: rotate(180deg);
}

.selection-card {
  background: rgba(93, 42, 24, 0.95);
  border: 2px solid #3d1c10;
  border-radius: 12px;
  padding: 6px;
  width: 30vmin;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.selection-card.is-ready {
  border-color: #4CAF50;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
}

.player-name {
  color: #f1d3a1;
  font-size: 0.9rem;
  margin: 0;
  background: #3d1c10;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  padding: 4px 6px;
  border: 1px solid #f1d3a1;
}

.selector {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.selector button {
  background: #3d1c10;
  border: 1px solid #f1d3a1;
  color: #f1d3a1;
  font-size: 0.8rem;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
}

.preview-box {
  width: 14vmin;
  height: 8vmin;
  background: rgba(0,0,0,0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible; /* Pour laisser dépasser la bulle d'info */
  border: 1px solid rgba(241, 211, 161, 0.2);
  position: relative;
}

.boat-preview {
  cursor: help;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.info-icon {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 18px;
  height: 18px;
  background: #f1d3a1;
  color: #3d1c10;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #3d1c10;
  z-index: 5;
}

.boat-ability-text {
  font-size: 0.72rem;
  font-style: italic;
  color: #c8a24a;
  text-align: center;
  margin: 4px 8px 0;
  line-height: 1.35;
  min-height: 2.7em;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cat-preview {
  width: 55%;
}

.item-name {
  color: #f1d3a1;
  font-weight: bold;
  font-size: 0.75rem;
  margin: 2px 0;
}

.ready-button {
  width: 100%;
  padding: 6px;
  font-size: 0.8rem;
  background: #3d1c10;
  color: #f1d3a1;
  border: 2px solid #f1d3a1;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 4px;
}

.is-ready .ready-button {
  background: #4CAF50;
  color: white;
  border-color: white;
}

.ready-button.conflict-error {
  background: #c62828 !important;
  color: white !important;
  border-color: #8e0000 !important;
  animation: shake 0.4s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
}

.start-game-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 15px 40px;
  font-size: 1.5rem;
  background: #5d2a18;
  color: #f1d3a1;
  border: 4px solid #3d1c10;
  border-radius: 12px;
  font-family: 'Georgia', serif;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 0 40px rgba(0,0,0,0.8);
  z-index: 100;
}

/* --- GAME STYLES --- */
.corner-group {
  position: absolute;
  width: 35vmin;
  height: 35vmin;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pair-container {
  display: flex;
  align-items: center; /* Aligne l'avatar et les stats horizontalement */
  gap: 2vmin;
}

.avatar-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.player-stats {
  display: flex;
  flex-direction: column;
  gap: 1vmin;
  background-image: url('/paper.png');
  background-size: cover;
  background-position: center;
  padding: 1.5vmin;
  transform: rotate(20deg);
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1vmin;
  color: #3d1c10; /* Couleur sombre pour contraster avec le papier clair */
  font-family: 'Georgia', serif;
  font-weight: bold;
  font-size: clamp(0.7rem, 2vmin, 1.2rem);
}

.stat-icon, .coin-img-icon {
  font-size: 1.2em;
  width: 1.2em;
  height: 1.2em;
  object-fit: contain;
}

.boat-img {
  width: 22vmin;
  height: 15vmin;
  max-width: 250px;
  min-width: 80px;
  object-fit: contain;
}

.cat-img {
  width: 9vmin; /* Taille réduite de 12vmin à 9vmin */
  max-width: 80px;
  min-width: 30px;
  height: auto;
  margin-top: -4vmin;
  z-index: 2;
}

.shop-button {
  padding: 1.5vh 5vw;
  font-size: clamp(0.9rem, 3vmin, 1.5rem);
  font-family: 'Georgia', serif;
  font-weight: bold;
  text-transform: uppercase;
  color: #f1d3a1;
  background-color: #5d2a18;
  border: 4px solid #3d1c10;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5), inset 0 0 10px rgba(0,0,0,0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.deck-area-controls {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1vh;
  z-index: 10;
}

.deck-area-controls:not(.bottom-area) { top: 2vh; transform: translateX(-50%) rotate(180deg); }
.bottom-area { bottom: 2vh; }

.turn-display {
  background: rgba(93, 42, 24, 0.9);
  color: #f1d3a1;
  padding: 5px 15px;
  border-radius: 15px;
  border: 1px solid #f1d3a1;
  font-family: 'Georgia', serif;
  font-weight: bold;
  font-size: 0.9rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.turn-actions-floating {
  position: absolute;
  top: -90px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 100;
}

.finish-turn-btn {
  background: #2e7d32;
  color: white;
  border: 2px solid #1b5e20;
  font-size: 0.7rem;
  padding: 5px 12px;
  white-space: nowrap;
}

.attack-btn {
  background: #c0392b;
  color: white;
  border: 2px solid #922b21;
  font-size: 0.7rem;
  padding: 5px 12px;
  white-space: nowrap;
}

.ability-btn {
  position: relative;
  background: #f39c12;
  color: #3d1c10;
  border: 2px solid #e67e22;
  font-size: 0.7rem;
  padding: 5px 12px;
  white-space: nowrap;
}
.ability-btn .ability-tooltip-bubble {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  width: max-content;
  max-width: 240px;
  white-space: normal;
  background: #1a0f10;
  color: #f7eed8;
  border: 2px solid #c8a24a;
  border-radius: 8px;
  padding: 10px 12px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  text-align: center;
  text-transform: none;
  letter-spacing: normal;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
  z-index: 200;
  box-shadow: 0 10px 24px rgba(0,0,0,0.5);
}
.ability-btn .ability-tooltip-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: #c8a24a;
}
.ability-btn:hover .ability-tooltip-bubble,
.ability-btn:focus .ability-tooltip-bubble {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.damage-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(93, 42, 24, 0.98);
  border: 2px solid #f1d3a1;
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.8);
  z-index: 250;
  width: 220px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.damage-modal-title {
  color: #f1d3a1;
  font-family: 'Georgia', serif;
  text-align: center;
  font-size: 1.1rem;
}
.damage-input-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
.damage-step {
  background: #3d1c10;
  color: #f1d3a1;
  border: 1px solid #f1d3a1;
  width: 35px;
  height: 35px;
  font-size: 1.2rem;
  border-radius: 4px;
  cursor: pointer;
}
.damage-input {
  width: 50px;
  height: 35px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  background: #1a0f10;
  color: #f1d3a1;
  border: 1px solid #f1d3a1;
  border-radius: 4px;
}
.damage-modal-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}
.attack-confirm {
  margin-top: 10px;
  background: #c0392b;
  color: white;
  border: 1px solid #922b21;
  padding: 8px 12px;
  font-size: 0.9rem;
}
.cancel-button {
  background: #3d1c10;
  color: white;
  border: 1px solid #555;
  padding: 8px 12px;
  font-size: 0.9rem;
}

.turn-badge {
  position: absolute;
  top: 10px;
  right: -20px;
  background-color: #c0392b;
  color: white;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  animation: pulse 2s infinite;
  z-index: 10;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* --- CARDS IN HAND STYLES --- */
.player-hand-container {
  position: absolute;
  top: 105%;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  z-index: 90;
  padding: 12px 0;
}

.player-hand {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: flex-end;
}

.playing-card {
  width: 96px;
  height: 138px;
  background-color: #f3e3c2;
  background-image:
    linear-gradient(160deg, rgba(243, 227, 194, 0.92) 0%, rgba(216, 192, 144, 0.92) 100%),
    url('/paper.png');
  background-size: 100% 100%, cover;
  background-blend-mode: multiply;
  border-radius: 10px;
  border: 2px solid #4f1219;
  box-shadow:
    0 10px 22px rgba(0, 0, 0, 0.55),
    inset 0 0 0 2px rgba(200, 162, 74, 0.55),
    inset 0 0 0 3px rgba(243, 227, 194, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), filter 0.2s, box-shadow 0.2s;
  padding: 12px 8px 10px;
  text-align: center;
  position: relative;
  color: #4f1219;
  overflow: hidden;
}
.playing-card::before {
  content: '';
  position: absolute;
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 6px;
  border-radius: 6px;
  border: 1px solid rgba(168, 133, 47, 0.5);
  pointer-events: none;
}

.playing-card:hover {
  transform: translateY(-22px) scale(1.08) rotate(-1deg);
  z-index: 10;
  box-shadow:
    0 18px 32px rgba(0, 0, 0, 0.6),
    inset 0 0 0 2px rgba(200, 162, 74, 0.85),
    inset 0 0 0 3px rgba(243, 227, 194, 0.6);
  filter: drop-shadow(0 0 12px rgba(241, 211, 161, 0.6));
}

.playing-card.attack {
  border-color: #8b1c1c;
  box-shadow:
    0 10px 22px rgba(0, 0, 0, 0.55),
    inset 0 0 0 2px rgba(200, 162, 74, 0.55),
    inset 0 0 0 3px rgba(243, 227, 194, 0.4),
    inset 0 0 20px rgba(139, 28, 28, 0.18);
}
.playing-card.defense {
  border-color: #1e3a6e;
  box-shadow:
    0 10px 22px rgba(0, 0, 0, 0.55),
    inset 0 0 0 2px rgba(200, 162, 74, 0.55),
    inset 0 0 0 3px rgba(243, 227, 194, 0.4),
    inset 0 0 20px rgba(30, 58, 110, 0.18);
}
.playing-card.heal {
  border-color: #1f5a25;
  box-shadow:
    0 10px 22px rgba(0, 0, 0, 0.55),
    inset 0 0 0 2px rgba(200, 162, 74, 0.55),
    inset 0 0 0 3px rgba(243, 227, 194, 0.4),
    inset 0 0 20px rgba(31, 90, 37, 0.18);
}

.card-icon {
  font-size: 2.2rem;
  line-height: 1;
  margin-top: 4px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25));
}

.card-name {
  font-family: 'Pirata One', 'Georgia', serif;
  font-weight: 400;
  font-size: 0.95rem;
  color: #4f1219;
  line-height: 1.05;
  letter-spacing: 0.02em;
  padding: 0 2px;
}

.card-value {
  font-family: 'Pirata One', serif;
  font-weight: 400;
  font-size: 1.15rem;
  color: #8b1c1c;
  letter-spacing: 0.04em;
  text-shadow: 0 1px 0 rgba(243, 227, 194, 0.6);
}

.playing-card.heal .card-value { color: #1f5a25; }
.playing-card.defense .card-value { color: #1e3a6e; }

.selectable-target {
  cursor: crosshair;
  transition: transform 0.2s;
}

.selectable-target:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 0 20px #c62828);
}

/* Styles pour joueur éliminé (gris, un peu fade) */
.eliminated .boat-img,
.eliminated .cat-img,
.eliminated .player-stats {
  filter: grayscale(100%) brightness(75%);
  opacity: 0.65;
}

.eliminated .turn-badge,
.eliminated .turn-actions-floating {
  display: none;
}

@keyframes pulse-red {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}


.top-left { top: 2vh; left: 2vw; transform: rotate(135deg); }
.top-right { top: 2vh; right: 2vw; transform: rotate(-135deg); }
.top-center { top: 2vh; left: 50%; transform: translateX(-50%) rotate(180deg); }
.bottom-right { bottom: 2vh; right: 2vw; transform: rotate(-45deg); }
.bottom-left { bottom: 2vh; left: 2vw; transform: rotate(45deg); }
.bottom-center { bottom: 2vh; left: 50%; transform: translateX(-50%); }

.player-count-selector {
  pointer-events: auto;
  background: rgba(93, 42, 24, 0.9);
  border: 2px solid #f1d3a1;
  padding: 10px 20px;
  border-radius: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
}

.count-label {
  color: #f1d3a1;
  font-family: 'Georgia', serif;
  font-size: 0.9rem;
  font-weight: bold;
}

.count-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.count-controls button {
  background: #3d1c10;
  border: 1px solid #f1d3a1;
  color: #f1d3a1;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.count-value {
  color: #f1d3a1;
  font-size: 1.5rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

/* --- TURN INDICATOR & ACTIONS --- */
.turn-controls {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2vmin;
  z-index: 50;
  pointer-events: auto;
  transition: transform 0.5s ease-in-out;
}

.active-player-info {
  background: rgba(93, 42, 24, 0.9);
  padding: 1vh 2vw;
  border-radius: 20px;
  border: 2px solid #f1d3a1;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
}

.turn-label {
  color: #f1d3a1;
  font-family: 'Georgia', serif;
  font-weight: bold;
  font-size: clamp(0.8rem, 2.5vmin, 1.4rem);
  text-transform: uppercase;
  white-space: nowrap;
}

.action-button {
  padding: 1.5vh 4vw;
  font-family: 'Georgia', serif;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  text-transform: uppercase;
}

.finish-turn {
  background: #2e7d32;
  color: white;
  border: 3px solid #1b5e20;
  font-size: clamp(0.7rem, 2vmin, 1.2rem);
}

.finish-turn:hover {
  background: #388e3c;
  transform: scale(1.05);
}

.turn-badge {
  position: absolute;
  top: -20px;
  background: #f1d3a1;
  color: #3d1c10;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 0.7rem;
  border: 1px solid #3d1c10;
  white-space: nowrap;
  animation: bounce 2s infinite;
}

.current-turn .pair-container {
  filter: drop-shadow(0 0 15px rgba(241, 211, 161, 0.8));
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-10px);}
  60% {transform: translateY(-5px);}
}

@media (max-width: 600px) {
  .corner-group { width: 45vmin; height: 45vmin; }
  .lobby-title { font-size: 1.2rem; }
}

/* --- ROLE REVEAL OVERLAY STYLES --- */
.role-reveal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
}

.role-reveal-content {
  background-image: url('/paper.png');
  background-size: cover;
  background-position: center;
  padding: 5vmin;
  border-radius: 12px;
  text-align: center;
  max-width: 600px;
  width: 80vw;
  animation: scaleUp 0.3s ease-out;
}

.role-title {
  font-family: 'Georgia', serif;
  color: #3d1c10;
  font-size: 2.5rem;
  margin-top: 0;
  text-transform: uppercase;
  border-bottom: 2px solid #3d1c10;
  padding-bottom: 10px;
}

.role-cat-img {
  display: block;
  width: 120px;
  height: auto;
  margin: 20px auto;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
}

.role-name {
  font-family: 'Georgia', serif;
  color: #c62828;
  font-size: 2rem;
  margin: 10px 0;
  text-transform: uppercase;
}

.role-desc {
  font-family: 'Georgia', serif;
  color: #5d2a18;
  font-size: 1.2rem;
  font-weight: bold;
  margin: 20px 0;
}

.role-public-note {
  font-family: 'Georgia', serif;
  color: #c62828;
  font-size: 1rem;
  font-style: italic;
  margin-bottom: 20px;
}

.role-button {
  background: #3d1c10;
  color: #f1d3a1;
  border: 3px solid #5d2a18;
  padding: 15px 40px;
  font-size: 1.2rem;
  font-family: 'Georgia', serif;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  transition: all 0.2s ease;
  text-transform: uppercase;
  margin-top: 20px;
}

.role-button:hover {
  transform: translateY(-3px);
  background: #5d2a18;
  color: white;
}

/* --- EVENT OVERLAY STYLES --- */
.event-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.event-content {
  background-image: url('/paper.png');
  background-size: cover;
  background-position: center;
  padding: 5vmin;
  border-radius: 12px;
  box-shadow: 0 0 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.3);
  text-align: center;
  max-width: 600px;
  width: 80vw;
  animation: scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.event-round {
  color: #c62828;
  font-family: 'Georgia', serif;
  text-transform: uppercase;
  font-size: 1.2rem;
  letter-spacing: 2px;
  margin-top: 0;
  margin-bottom: 10px;
}

.event-icon {
  font-size: 5rem;
  margin: 10px 0;
  filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
}

.event-title {
  font-family: 'Georgia', serif;
  color: #3d1c10;
  font-size: 2.5rem;
  margin: 10px 0;
  text-transform: uppercase;
}

.event-desc {
  font-family: 'Georgia', serif;
  color: #5d2a18;
  font-size: 1.4rem;
  font-style: italic;
  margin: 20px 0 30px 0;
  line-height: 1.4;
}

.event-button {
  background: #3d1c10;
  color: #f1d3a1;
  border: 3px solid #5d2a18;
  padding: 15px 40px;
  font-size: 1.2rem;
  font-family: 'Georgia', serif;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.event-button:hover {
  transform: translateY(-3px);
  background: #5d2a18;
  color: white;
}

@keyframes scaleUp {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* --- SHOP OVERLAY STYLES --- */
.resource-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.resource-content {
  background-image: url('/paper.png');
  background-size: cover;
  background-position: center;
  padding: 4vmin;
  border-radius: 8px;
  text-align: center;
  max-width: 90vw;
  animation: fadeIn 0.3s ease-out;
}

.resource-title {
  font-family: 'Georgia', serif;
  color: #3d1c10;
  margin-top: 0;
  text-transform: uppercase;
  font-size: 2rem;
  border-bottom: 2px solid #3d1c10;
  padding-bottom: 10px;
}

.resource-desc {
  font-family: 'Georgia', serif;
  color: #5d2a18;
  font-size: 1.2rem;
  font-weight: bold;
  margin: 20px 0 30px 0;
}

.resource-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.resource-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  font-size: 1.2rem;
  font-weight: bold;
  font-family: 'Georgia', serif;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, filter 0.2s;
  border: 3px solid #3d1c10;
  box-shadow: 0 5px 15px rgba(0,0,0,0.4);
}

.resource-button:hover {
  transform: translateY(-5px);
  filter: brightness(1.1);
}

.gold-btn {
  background: #f1c40f;
  color: #3d1c10;
}

.cards-btn {
  background: #3498db;
  color: white;
}

.btn-icon {
  width: 24px;
  height: 24px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.shop-content {
  background-image: url('/paper.png');
  background-size: cover;
  background-position: center;
  width: 80vmin;
  max-width: 500px;
  padding: 4vmin;
  border-radius: 8px;
  border: 4px solid #3d1c10;
  box-shadow: 0 20px 50px rgba(0,0,0,0.8);
  position: relative;
  transition: transform 0.3s ease-out;
}

.close-shop {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #3d1c10;
  color: #f1d3a1;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
}

.shop-title {
  text-align: center;
  font-family: 'Georgia', serif;
  color: #3d1c10;
  margin-top: 0;
  text-transform: uppercase;
  border-bottom: 2px solid #3d1c10;
  padding-bottom: 10px;
}

.shop-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(0,0,0,0.05);
  padding: 10px;
  border-radius: 6px;
  border: 1px dashed #3d1c10;
  cursor: pointer;
  transition: background 0.2s;
}

.shop-item:hover:not(.disabled) {
  background: rgba(0,0,0,0.1);
}

.shop-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(80%);
}

.empty-shop {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px;
  font-family: 'Georgia', serif;
  color: #3d1c10;
  font-style: italic;
  font-size: 1.2rem;
}

.item-icon {
  font-size: 2rem;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-label {
  font-weight: bold;
  color: #3d1c10;
}

.item-price {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #5d2a18;
  font-weight: bold;
}

.price-coin {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

/* --- ROULETTE STYLES --- */
.roulette-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.roulette-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4vmin;
}



.roulette-title {
  color: #f1d3a1;
  font-family: 'Georgia', serif;
  font-size: 2.5rem;
  text-shadow: 0 0 10px rgba(241, 211, 161, 0.5);
  margin: 0;
}

.wheel-outer {
  position: relative;
  width: 60vmin;
  height: 60vmin;
  border: 8px solid #3d1c10;
  border-radius: 50%;
  box-shadow: 0 0 50px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,0,0,0.5);
  overflow: hidden;
}

.wheel-pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  color: #f1d3a1;
  font-size: 3rem;
  z-index: 10;
  filter: drop-shadow(0 2px 5px rgba(0,0,0,0.8));
}

.wheel {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: transform 4s cubic-bezier(0.15, 0, 0.15, 1);
}

.wheel-segment {
  position: absolute;
  top: 0;
  right: 0;
  display: none;
}

.wheel.small-wheel .wheel-segment {
  /* For 2-player mode use half-circle segments */
  width: 100%;
  height: 50%;
  left: 0;
  right: 0;
  transform-origin: 50% 100%;
}

.wheel-boat-container {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12vmin;
  height: 12vmin;
  margin-top: -6vmin;
  margin-left: -6vmin;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: 50% 50%;
}

.wheel-boat-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));
  padding-bottom: 24px;
}

.wheel-boat-img.winner-anim {
  animation: winnerPop 0.8s ease-out;
  transform-origin: 50% 50%;
}

@keyframes winnerPop {
  0% { transform: scale(1); filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5)); }
  40% { transform: scale(1.35); filter: drop-shadow(0 8px 20px rgba(255,215,0,0.6)); }
  100% { transform: scale(1); filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5)); }
}

.spin-button, .confirm-button {
  padding: 15px 40px;
  font-size: 1.5rem;
  font-family: 'Georgia', serif;
  font-weight: bold;
  background: #5d2a18;
  color: #f1d3a1;
  border: 4px solid #3d1c10;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  transition: all 0.2s;
}

.spin-button:hover:not(:disabled), .confirm-button:hover {
  transform: translateY(-3px);
  background: #7a3a24;
}

.spin-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.winner-reveal {
  text-align: center;
  animation: fadeIn 0.5s ease-out;
}

.winner-reveal h3 {
  color: #f1d3a1;
  font-size: 1.8rem;
  margin: 0 0 10px 0;
}

.bonus-text {
  color: #4CAF50;
  font-weight: bold;
  font-size: 1.2rem;
  margin: 0 0 20px 0;
  animation: pulse-green 1.5s infinite;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-green {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

/* ============ FIN DE PARTIE ============ */
.end-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, rgba(107, 25, 34, 0.92) 0%, rgba(20, 5, 8, 0.97) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(6px);
  animation: end-fadein 0.5s ease both;
}
@keyframes end-fadein {
  from { opacity: 0; }
  to { opacity: 1; }
}
.end-content {
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.98) 0%, rgba(45, 10, 15, 0.98) 100%);
  border: 3px solid #c8a24a;
  border-radius: 20px;
  padding: 48px 56px;
  max-width: 640px;
  width: calc(100% - 40px);
  text-align: center;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(245, 233, 212, 0.1);
  animation: end-zoom 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
}
@keyframes end-zoom {
  from { opacity: 0; transform: scale(0.85) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.end-flag {
  font-size: 64px;
  margin-bottom: 12px;
  animation: end-flag-bob 2.4s ease-in-out infinite;
}
@keyframes end-flag-bob {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-6px) rotate(2deg); }
}
.end-title {
  font-family: 'Pirata One', serif;
  color: #c8a24a;
  font-size: clamp(38px, 5vw, 52px);
  margin: 0 0 28px;
  letter-spacing: 0.04em;
  text-shadow: 0 3px 0 #4f1219, 0 6px 14px rgba(0, 0, 0, 0.5);
}
.end-winner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.end-winner.duo {
  flex-direction: row;
  justify-content: center;
  gap: 28px;
  flex-wrap: wrap;
}
.end-winner-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.end-cat {
  width: 130px;
  height: 130px;
  object-fit: contain;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.55));
  animation: end-cat-pulse 2s ease-in-out infinite;
}
.end-winner.duo .end-cat { width: 100px; height: 100px; }
@keyframes end-cat-pulse {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.04); }
}
.end-label {
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #d8c9a4;
  opacity: 0.7;
}
.end-name {
  font-family: 'Pirata One', serif;
  color: #c8a24a;
  font-size: 28px;
  letter-spacing: 0.03em;
  text-shadow: 0 2px 0 #4f1219;
}
.end-role {
  color: #f7eed8;
  font-size: 15px;
  font-style: italic;
}
.end-reason {
  background: rgba(58, 170, 176, 0.12);
  border-left: 4px solid #3aaab0;
  border-radius: 8px;
  padding: 14px 18px;
  color: #f7eed8;
  font-style: italic;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 auto 28px;
  max-width: 480px;
  text-align: left;
}
.end-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
.end-button {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 13px 26px;
  border-radius: 12px;
  border: 2px solid #c8a24a;
  background: transparent;
  color: #c8a24a;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s, color 0.15s;
}
.end-button:hover {
  background: rgba(200, 162, 74, 0.15);
  transform: translateY(-2px);
}
.end-button.primary {
  background: linear-gradient(180deg, #c8a24a 0%, #a8852f 100%);
  color: #4f1219;
  border-color: #4f1219;
  box-shadow: 0 4px 0 #4f1219;
}
.end-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #4f1219;
}
.end-button.primary:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #4f1219;
}

.universal-popup-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}
.popup-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15vmin;
}
.popup-card {
  background: rgba(93, 42, 24, 0.95);
  border: 2px solid #f1d3a1;
  border-radius: 12px;
  padding: 20px 30px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.8);
  max-width: 80vw;
}
.popup-top {
  transform: rotate(180deg);
}
.popup-title {
  font-family: 'Georgia', serif;
  color: #f1d3a1;
  font-size: 1.8rem;
  margin: 0 0 10px 0;
  text-transform: uppercase;
}
.popup-desc {
  color: white;
  font-size: 1.2rem;
  margin: 0;
  white-space: pre-line;
}

/* ========= UNLOCK OVERLAY Scoped Styles ========= */
</style>
