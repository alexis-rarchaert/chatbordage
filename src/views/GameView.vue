<template>
  <div class="game-view">
    <!-- --- ÉCRAN DE VERROUILLAGE BOÎTE --- -->
    <template v-if="!isUnlocked">
      <div class="unlock-overlay">
        <div class="unlock-card">
          <div class="pirate-skull-icon" aria-hidden="true">🏴‍☠️</div>
          <h1 class="unlock-title">{{ $t('game.unlock.title') }}</h1>
          <p class="unlock-desc">{{ $t('game.unlock.desc') }}</p>
          
          <form @submit.prevent="validateCode" class="unlock-form">
            <div class="input-wrap">
              <input 
                :value="boxCode" 
                @input="formatCodeInput"
                type="text" 
                :placeholder="$t('game.unlock.placeholder')" 
                class="unlock-input"
                :class="{ 'input-error': unlockError }"
                :disabled="validatingCode"
                required
              />
            </div>
            <p v-if="unlockError" class="unlock-error-msg">{{ $t('game.unlock.error') }}</p>
            
            <div class="unlock-buttons">
              <button type="submit" class="btn-primary unlock-btn" :disabled="validatingCode">
                {{ validatingCode ? $t('game.unlock.validating') : $t('game.unlock.submit') }}
              </button>
              <RouterLink to="/" class="btn-secondary unlock-cancel-btn" :class="{ disabled: validatingCode }">
                {{ $t('game.unlock.cancel') }}
              </RouterLink>
            </div>
          </form>
        </div>
      </div>
    </template>

    <!-- --- ÉCRAN DE LOBBY --- -->
    <template v-else-if="!isStarted && !isRouletteVisible">
      <div class="lobby-overlay" :class="`players-${playerCount}`">
        <!-- Titres dupliqués pour les deux côtés de la table -->
        <div class="lobby-titles">
          <h1 class="lobby-title title-top">{{ $t('game.lobby.title') }}</h1>
          
          <!-- SÉLECTEUR DE NOMBRE DE JOUEURS -->
          <div v-if="!allReady" class="player-count-selector">
            <span class="count-label">{{ $t('game.lobby.playerCount') }}</span>
            <div class="count-controls">
              <button @click="playerCount = Math.max(2, playerCount - 1)" :disabled="playerCount <= 2">-</button>
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
              <button class="action-button finish-turn-btn" @click.stop="nextTurn">
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
                v-if="allBoats[player.boatIndex].type === 'actif' && !player.abilityUsed"
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
            </div>

            <div v-if="isRevealingRole && currentTurn === index" class="attack-prompt">
              {{ $t('game.turn.selectSpyglassTarget') }}
            </div>

            <div v-if="showDamageModal && currentTurn === index" class="damage-modal" @click.stop>
              <div class="damage-modal-content">
                <div class="damage-modal-title">{{ $t('game.turn.howManyHp') }}</div>
                <div class="damage-input-row">
                  <button class="damage-step minus" @click.stop="decreaseDamage">-</button>
                  <input type="number" min="1" v-model="damageInput" class="damage-input" />
                  <button class="damage-step plus" @click.stop="increaseDamage">+</button>
                </div>
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
          
          <div class="player-stats">
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
              :class="{ 'disabled': players[currentTurn].gold < item.price }"
              @click="buyItem(item)"
            >
              <div class="item-icon">{{ item.icon }}</div>
              <div class="item-info">
                <span class="item-label">{{ $t('shop.items.' + item.id + '.name') }}</span>
                <span class="item-price">{{ item.price }} <img src="/coin.png" class="price-coin" /></span>
              </div>
            </div>
            <div v-if="availableShopItems.length === 0" class="empty-shop">
              {{ $t('game.shop.empty') }}
            </div>
          </div>
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
import { SHOP_ITEMS as GAME_SHOP_ITEMS } from '../game';
import { verifyActivationCode } from '../lib/supabase';

const { t } = useI18n();

const isUnlocked = ref(localStorage.getItem('game_unlocked') === 'true');
const boxCode = ref('');
const unlockError = ref(false);
const validatingCode = ref(false);

const formatCodeInput = (event) => {
  // Strip non-alphanumeric, force uppercase
  let value = event.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Truncate to 16 characters
  if (value.length > 16) {
    value = value.slice(0, 16);
  }
  
  // Group into blocks of 4 separated by hyphens
  const parts = [];
  for (let i = 0; i < value.length; i += 4) {
    parts.push(value.slice(i, i + 4));
  }
  
  boxCode.value = parts.join('-');
};

const validateCode = async () => {
  if (validatingCode.value) return;
  validatingCode.value = true;
  unlockError.value = false;

  try {
    const isValid = await verifyActivationCode(boxCode.value);
    if (isValid) {
      isUnlocked.value = true;
      localStorage.setItem('game_unlocked', 'true');
    } else {
      unlockError.value = true;
    }
  } catch (err) {
    console.error('Error validating code:', err);
    unlockError.value = true;
  } finally {
    validatingCode.value = false;
  }
};

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
      // Tous les joueurs ont vu leur rôle → premier tour, pas d'événement
      showRoleReveal.value = false;
      showResourcePhase.value = true;
    }
  }
};

const seaEvents = [
  { id: 'tempete', name: 'Tempête !', desc: 'La mer se déchaîne. Les attaques infligent +1 Dégât ce tour-ci.', icon: '🌪️' },
  { id: 'brume', name: 'Brume épaisse', desc: 'Impossible de viser juste. Les attaques ont 50% de chances d\'échouer ce tour-ci.', icon: '🌫️' },
  { id: 'tresor', name: 'Île au trésor', desc: 'Une île regorgeant de richesses ! Chaque joueur pioche 1 carte supplémentaire ce tour-ci.', icon: '🏝️' },
  { id: 'calme', name: 'Mer d\'huile', desc: 'Une journée calme en mer. Aucun effet particulier.', icon: '☀️' }
];

const startRound = () => {
  const randomEvent = seaEvents[Math.floor(Math.random() * seaEvents.length)];
  currentEvent.value = randomEvent;
  // Garantir qu'on repasse par event → ressources même si flags traînaient
  showShop.value = false;
  showResourcePhase.value = false;
  isAttacking.value = false;
  showDamageModal.value = false;
  cardBeingPlayed.value = null;
  showEventPhase.value = true;
  playRevealSound();
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

const checkVictory = () => {
  const alive = players.value.filter(p => p.hp > 0);

  // Contrebandier : 15 pièces atteintes
  for (const p of players.value) {
    if (p.roleId === 'contrebandier' && p.gold >= 15) {
      return { winners: [p], reasonKey: 'contrebandier' };
    }
  }
  // Chasseur de primes : 2 éliminations
  for (const p of players.value) {
    if (p.roleId === 'chasseur' && (p.eliminations || 0) >= 2) {
      return { winners: [p], reasonKey: 'chasseur' };
    }
  }
  // Capitaine + Protecteur : seuls survivants
  if (alive.length === 2) {
    const cap = alive.find(p => p.roleId === 'capitaine');
    const prot = alive.find(p => p.roleId === 'protecteur');
    if (cap && prot) return { winners: [cap, prot], reasonKey: 'duo' };
  }
  // Renégat / Capitaine seul
  if (alive.length === 1) {
    const last = alive[0];
    if (last.roleId === 'renegat') return { winners: [last], reasonKey: 'renegat' };
    if (last.roleId === 'capitaine') return { winners: [last], reasonKey: 'capitaine' };
  }
  return null;
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

  currentTurn.value = 0;
  currentRound.value = 1;
  // Reset shop items
  shopItems.value.forEach(it => { it.purchased = false; });
  // Reset des players (sans toucher au navire/chat)
  players.value.forEach(p => {
    p.hp = getBaseHp(p.boatIndex);
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

  // Détecte si on reboucle vers le début (fin du tour du dernier joueur)
  const isEndOfRound = next <= currentTurn.value;
  if (isEndOfRound) currentRound.value += 1;
  currentTurn.value = next;

  // Reset des pouvoirs actifs 1x/tour pour le joueur qui va jouer
  const ship = allBoats[players.value[next].boatIndex];
  if (ship && (ship.abilityId === 'sloop' || ship.abilityId === 'jonque' || ship.abilityId === 'clipper')) {
    players.value[next].abilityUsed = false;
  }

  // Décrémenter trêve
  if (players.value[next].truceTurnsLeft > 0) players.value[next].truceTurnsLeft -= 1;

  playUiTap();

  if (isEndOfRound) {
    // Fin du dernier tour du round → événement de mer d'abord
    startRound();
  } else {
    // Tour intermédiaire → directement la phase de ressources
    showResourcePhase.value = true;
  }
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
  // Le Contrebandier peut gagner dès qu'il atteint 15 pièces
  evaluateVictory();
};

const cardsToDrawAmount = computed(() => {
  if (!players.value || players.value.length === 0) return 2;
  const player = players.value[currentTurn.value];
  if (!player) return 2;
  
  const boat = allBoats[player.boatIndex];
  let amount = 2;
  
  // Bonus navire
  if (boat.abilityId === 'caravelle') amount += 1;
  // Bonus événement
  if (currentEvent.value && currentEvent.value.id === 'tresor') amount += 1;
  
  return amount;
});

const chooseCards = () => {
  const amount = cardsToDrawAmount.value;
  if (amount > 2) {
    triggerPopup(t('game.popup.bonusDraw.title'), t('game.popup.bonusDraw.message', { amount }));
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

const buyItem = (item) => {
  const player = players.value[currentTurn.value];
  if (player.gold < item.price || item.purchased) {
    playHitSound();
    return;
  }
  player.gold -= item.price;
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

const initiateAttack = () => {
  showDamageModal.value = true;
  selectedDamage.value = 1;
  damageInput.value = "1";
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
  playUiTap();
};
const confirmDamage = () => {
  let val = parseInt(damageInput.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  selectedDamage.value = val;
  showDamageModal.value = false;
  isAttacking.value = true;
  playUiTap();
};

const initiateRevealRole = () => {
  isRevealingRole.value = true;
  playUiTap();
};

const performRevealRole = (targetIdx) => {
  const target = players.value[targetIdx];
  const roleName = t('roles.' + target.roleId + '.name');
  triggerPopup(
    t('game.popup.spyglass.title'), 
    t('game.popup.spyglass.message', { name: allCats[target.catIndex].name, role: roleName })
  );
  // Consommer la longue-vue
  players.value[currentTurn.value].canRevealRole = false;
  isRevealingRole.value = false;
  playSuccessChime();
};

const handlePlayerClick = (index) => {
  if (isRevealingRole.value) {
    if (index !== currentTurn.value && players.value[index].hp > 0) {
      performRevealRole(index);
    }
  } else {
    performAttack(index);
  }
};const performAttack = (targetIdx) => {
  if (!isAttacking.value || targetIdx === currentTurn.value) return;
  // Ne pas attaquer un joueur déjà éliminé
  if (players.value[targetIdx].hp <= 0) return;

  // Désactive immédiatement l'attaque pour éviter les double-clics sur d'autres cibles
  isAttacking.value = false;

  const attacker = players.value[currentTurn.value];
  const target = players.value[targetIdx];
  const attackerBoat = allBoats[attacker.boatIndex];
  const targetBoat = allBoats[target.boatIndex];

  // Trêve : impossible d'attaquer une cible sous protection
  if (target.truceTurnsLeft && target.truceTurnsLeft > 0) {
    triggerPopup(t('game.popup.truce.title'), t('game.popup.truce.message', { name: allCats[target.catIndex].name }));
    // Carte non consommée — on garde le tour pour rejouer
    isAttacking.value = true;
    playHitSound();
    return;
  }

  // Calculer les dégâts (prendre en compte la tempête)
  let actualDamage = selectedDamage.value;
  if (currentEvent.value && currentEvent.value.id === 'tempete') {
    actualDamage += 1;
  }

  // Buff Poudre noire (achat boutique)
  if (attacker.buffNextAttack) {
    actualDamage += attacker.buffNextAttack;
    attacker.buffNextAttack = 0;
  }

  // Pouvoir passif: La Felouque (+1 dégât si la cible a plus de PV)
  if (attackerBoat.abilityId === 'felouque' && target.hp > attacker.hp) {
    actualDamage += 1;
  }

  // Pouvoir passif: Le Cuirassé (-1 dégât reçu, minimum 1)
  if (targetBoat.abilityId === 'cuirasse') {
    actualDamage = Math.max(1, actualDamage - 1);
  }

  // Gérer la brume (50% de chance d'échec)
  if (currentEvent.value && currentEvent.value.id === 'brume' && Math.random() < 0.5) {
    triggerPopup(t('game.popup.failedAttack.title'), t('game.popup.failedAttack.message'));
    playHitSound(); // Bruit d'échec
  } else {
    // Appliquer le dégât choisi par l'attaquant
    target.hp = Math.max(0, target.hp - actualDamage);
    playShopSound();
    playHitSound();

    // Pouvoir passif: Le Brick (pioche 1 carte physique quand attaqué)
    if (targetBoat.abilityId === 'brick' && target.hp > 0) {
      triggerPopup(t('game.popup.brickPower.title'), t('game.popup.brickPower.message', { name: t('ships.' + allBoats[target.boatIndex].abilityId + '.name') }));
    }
  }

  // Pouvoir passif: Le Brigantin (pioche 2 cartes si on élimine un joueur)
  if (target.hp === 0) {
  // Revivre une fois : la cible revient avec 1 PV au lieu d'être éliminée
  if (target.revivePending) {
    target.revivePending = false;
    target.hp = 1;
    triggerPopup(t('game.popup.revive.title'), t('game.popup.revive.message', { name: allCats[target.catIndex].name }));
  } else {
  attacker.eliminations += 1;
  // Pouvoir passif: Le Brigantin (pioche 2 cartes physiques à l'élimination)
  if (attackerBoat.abilityId === 'brigantin') {
    triggerPopup(t('game.popup.brigantinPower.title'), t('game.popup.brigantinPower.message'));
  }
  // Transfert des pièces du joueur éliminé
  attacker.gold += target.gold;
  target.gold = 0;
  // Pouvoir passif: La Frégate (+1 PV si on élimine un joueur)
  if (attackerBoat.abilityId === 'fregate') {
    attacker.hp += 1;
  }
  }
  }



  playUiTap();
  // RÈGLE : Jouer une carte attaque met fin au tour immédiatement (et relance startRound pour le prochain)
  nextTurn();
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

const getBaseHp = (boatIndex) => {
  const boatId = allBoats[boatIndex].abilityId;
  if (boatId === 'fregate' || boatId === 'troismats') return 6;
  if (boatId === 'cuirasse') return 7;
  if (['corvette', 'sloop', 'jonque', 'felouque', 'brigantin', 'clipper'].includes(boatId)) return 4;
  return 5;
};

const confirmCaptain = () => {
  if (winnerIndex.value !== null) {
    // Le Capitaine reçoit le rôle 'capitaine'
    players.value[winnerIndex.value].roleId = 'capitaine';

    // Distribuer les autres rôles aux autres joueurs
    const availableHiddenRoles = allRoles.filter(r => r.id !== 'capitaine').map(r => r.id);
    // Mélanger les rôles cachés
    for (let i = availableHiddenRoles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableHiddenRoles[i], availableHiddenRoles[j]] = [availableHiddenRoles[j], availableHiddenRoles[i]];
    }

    let roleIndex = 0;
    players.value.forEach((player, idx) => {
      if (idx !== winnerIndex.value) {
        player.roleId = availableHiddenRoles[roleIndex % availableHiddenRoles.length];
        roleIndex++;
      }
      
      // Assigner le PV de départ correct selon le bateau (plus bonus Capitaine)
      player.hp = getBaseHp(player.boatIndex) + (idx === winnerIndex.value ? 1 : 0);
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
  padding: 15px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.8);
  z-index: 250;
  width: 220px;
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
.unlock-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--color-burgundy);
  background-image:
    radial-gradient(ellipse at top, rgba(200, 162, 74, 0.1) 0%, transparent 60%),
    url('/paper.png');
  background-size: auto, 600px;
  background-blend-mode: normal, overlay;
  background-repeat: repeat;
}
.unlock-card {
  width: 100%;
  max-width: 440px;
  background: linear-gradient(160deg, rgba(79, 18, 25, 0.98) 0%, rgba(60, 12, 18, 0.98) 100%);
  background-image:
    linear-gradient(160deg, rgba(79, 18, 25, 0.94) 0%, rgba(60, 12, 18, 0.98) 100%),
    url('/paper.png');
  background-blend-mode: multiply;
  border: 3px solid var(--color-gold);
  border-radius: var(--radius-lg);
  padding: 40px 32px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(245, 233, 212, 0.08);
  position: relative;
  text-align: center;
}
.unlock-card::before {
  content: '';
  position: absolute;
  top: 8px; left: 8px; right: 8px; bottom: 8px;
  border: 1px solid rgba(200, 162, 74, 0.3);
  border-radius: calc(var(--radius-lg) - 4px);
  pointer-events: none;
}
.pirate-skull-icon {
  font-size: 54px;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
  animation: float-ship 4s ease-in-out infinite;
}
.unlock-title {
  font-family: var(--font-display);
  font-size: 38px;
  color: var(--color-gold);
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.04em;
}
.unlock-desc {
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text-light);
  margin-bottom: 28px;
}
.unlock-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.input-wrap {
  width: 100%;
}
.unlock-input {
  width: 100%;
  background: var(--color-burgundy-dark);
  border: 2px solid var(--color-gold-dark);
  color: var(--color-text-light);
  padding: 14px 18px;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-family: inherit;
  text-align: center;
  letter-spacing: 0.05em;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.unlock-input:focus {
  outline: none;
  border-color: var(--color-gold);
  box-shadow: 0 0 0 3px rgba(200, 162, 74, 0.25);
  transform: scale(1.02);
}
.unlock-input.input-error {
  border-color: #d9534f;
  box-shadow: 0 0 0 3px rgba(217, 83, 79, 0.25);
}
.unlock-error-msg {
  color: #ff6b6b;
  font-size: 14px;
  margin: -10px 0 0 0;
  line-height: 1.4;
  font-weight: 500;
}
.unlock-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}
.unlock-btn {
  width: 100%;
  padding: 14px 20px;
}
.unlock-cancel-btn {
  width: 100%;
  padding: 12px 20px;
  font-size: 13px;
}
.unlock-cancel-btn.disabled {
  pointer-events: none;
  opacity: 0.5;
}
</style>
