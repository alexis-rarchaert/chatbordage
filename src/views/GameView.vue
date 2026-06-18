<template>
  <div class="game-view">
    <!-- --- ÉCRAN DE LOBBY --- -->
    <template v-if="!isStarted && !isRouletteVisible">
      <div class="lobby-overlay">
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
            <h2 class="player-name">{{ index + 1 }}</h2>
            
            <!-- SÉLECTEUR DE BATEAU -->
            <div class="selector">
              <button @click.stop="prevBoat(index)" :disabled="player.ready">◀</button>
              <div class="preview-box">
                <div class="boat-preview">
                  <img :src="`/bateaux/${allBoats[player.boatIndex].file}`" class="preview-img" />
                  <div class="info-icon">i</div>
                  <div class="ability-tooltip">{{ $t(allBoats[player.boatIndex].ability) }}</div>
                </div>
              </div>
              <button @click.stop="nextBoat(index)" :disabled="player.ready">▶</button>
            </div>
            <p class="item-name">{{ allBoats[player.boatIndex].name }}</p>



            <button 
              class="ready-button" 
              :class="{ 'conflict-error': player.boatConflict }"
              @click="toggleReady(index)"
            >
              {{ player.boatConflict ? 'Déjà pris !' : (player.ready ? $t('game.lobby.ready') : $t('game.lobby.notReady')) }}
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
          <h2 class="roulette-title">Désignation du Capitaine</h2>
          
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
              {{ isSpinning ? 'Tirage en cours...' : 'Lancer le tirage !' }}
            </button>

            <div v-else class="winner-reveal">
              <h3>Le Capitaine est {{ allBoats[players[winnerIndex].boatIndex].name }} !</h3>
              <p class="bonus-text">+1 Point de Vie bonus !</p>
              <button class="confirm-button" @click="confirmCaptain">Commencer l'aventure</button>
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
          { 'selectable-target': isAttacking && currentTurn !== index && player.hp > 0 },
          { 'eliminated': player.hp === 0 }
        ]"
        @click="performAttack(index)"
      >
        <div class="pair-container">
          <div class="avatar-box">
            <div v-if="currentTurn === index && player.hp > 0" class="turn-actions-floating">
              <button class="action-button finish-turn-btn" @click.stop="nextTurn">
                {{ $t('game.turn.finish') }}
              </button>
              <button 
                v-if="allBoats[player.boatIndex].type === 'actif' && !player.abilityUsed"
                class="action-button ability-btn" 
                @click.stop="useBoatAbility(index)"
              >
                Pouvoir Navire
              </button>
            </div>
            
            <!-- AFFICHAGE DES CARTES EN MAIN -->
            <div v-if="currentTurn === index && player.hand.length > 0" class="player-hand-container">
              <div class="player-hand">
                <div 
                  v-for="card in player.hand" 
                  :key="card.uid" 
                  class="playing-card"
                  :class="card.type"
                  @click.stop="playCard(index, card)"
                >
                  <div class="card-icon">{{ card.icon }}</div>
                  <div class="card-name">{{ card.name }}</div>
                  <div v-if="card.type === 'attack'" class="card-value">-{{ card.damage }} PV</div>
                  <div v-else-if="card.type === 'heal'" class="card-value">+{{ card.value }} PV</div>
                </div>
              </div>
            </div>

            <div v-if="isAttacking && currentTurn === index" class="attack-prompt">
              {{ $t('game.turn.selectTarget') }} (-{{ selectedDamage }})
            </div>

            <div v-if="showDamageModal && currentTurn === index" class="damage-modal" @click.stop>
              <div class="damage-modal-content">
                <div class="damage-modal-title">Combien de PV retirer ?</div>
                <div class="damage-input-row">
                  <button class="damage-step minus" @click.stop="decreaseDamage">-</button>
                  <input type="number" min="1" v-model="damageInput" class="damage-input" />
                  <button class="damage-step plus" @click.stop="increaseDamage">+</button>
                </div>
                <div class="damage-modal-actions">
                  <button class="action-button attack-confirm" @click.stop="confirmDamage">{{ $t ? $t('game.turn.attack') : 'Attaquer' }}</button>
                  <button class="action-button cancel-button" @click.stop="cancelDamage">Annuler</button>
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
            <h2 class="role-title">Joueur {{ roleRevealPlayerIndex + 1 }}</h2>
            <p class="role-desc">Passez la tablette au Joueur {{ roleRevealPlayerIndex + 1 }}.<br/>Assurez-vous que personne ne regarde !</p>
            <button class="role-button" @click="nextRoleReveal">Révéler mon rôle</button>
          </template>
          <template v-else>
            <h2 class="role-title">Votre rôle secret</h2>
            <img :src="`/chats/${allCats[players[roleRevealPlayerIndex].catIndex].file}`" class="role-cat-img" />
            <h3 class="role-name">{{ allRoles.find(r => r.id === players[roleRevealPlayerIndex].roleId).name }}</h3>
            <p class="role-desc">{{ allRoles.find(r => r.id === players[roleRevealPlayerIndex].roleId).desc }}</p>
            <p v-if="players[roleRevealPlayerIndex].roleId === 'capitaine'" class="role-public-note">(Ceci est public, tout le monde sait que vous êtes le Capitaine)</p>
            <button class="role-button" @click="nextRoleReveal">Cacher et passer au suivant</button>
          </template>
        </div>
      </div>

      <!-- --- MODALE ÉVÉNEMENT DE MER --- -->
      <div v-if="showEventPhase && currentEvent" class="event-overlay">
        <div class="event-content">
          <h2 class="event-round">Round {{ currentRound }}</h2>
          <div class="event-icon">{{ currentEvent.icon }}</div>
          <h3 class="event-title">{{ currentEvent.name }}</h3>
          <p class="event-desc">{{ currentEvent.desc }}</p>
          <button class="event-button" @click="acknowledgeEvent">Prendre le large</button>
        </div>
      </div>

      <!-- --- MODALE PHASE DE RESSOURCES --- -->
      <div v-if="showResourcePhase" class="resource-overlay">
        <div class="resource-content">
          <h2 class="resource-title">Phase de Ressources</h2>
          <p class="resource-desc">Joueur {{ currentTurn + 1 }}, c'est à vous ! Choisissez votre bonus :</p>
          <div class="resource-actions">
            <button class="resource-button gold-btn" @click="chooseGold">
              <img src="/coin.png" class="btn-icon" /> Prendre 2 Pièces
            </button>
            <button class="resource-button cards-btn" @click="chooseCards">
              <span class="btn-icon">🎴</span> Piocher 2 Cartes
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
                <span class="item-label">{{ item.name }}</span>
                <span class="item-price">{{ item.price }} <img src="/coin.png" class="price-coin" /></span>
              </div>
            </div>
            <div v-if="availableShopItems.length === 0" class="empty-shop">
              La boutique est vide !
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

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
      // Tous les joueurs ont vu leur rôle, on lance la partie
      showRoleReveal.value = false;
      startRound();
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
  showEventPhase.value = true;
  playRevealSound();
};

const isAttacking = ref(false);
const showDamageModal = ref(false);
const cardBeingPlayed = ref(null);

const acknowledgeEvent = () => {
  showEventPhase.value = false;
  showResourcePhase.value = true;
  playUiTap();
};

const isGameOver = ref(false);
const winner = ref(null);

const nextTurn = () => {
  // Reset des états de tour
  isAttacking.value = false;
  showDamageModal.value = false;
  cardBeingPlayed.value = null;
  showShop.value = false;
  showResourcePhase.value = false;
  showEventPhase.value = false;
  currentEvent.value = null;

  // Joueurs vivants
  const alivePlayers = players.value.filter(p => p.hp > 0);

  // Condition de victoire : un seul survivant
  if (alivePlayers.length <= 1) {
    isGameOver.value = true;
    winner.value = alivePlayers[0] ?? null;
    return;
  }

  // Trouver le prochain joueur vivant en sens horaire
  const total = players.value.length;
  let next = (currentTurn.value + 1) % total;
  let guard = total;
  while (players.value[next].hp <= 0 && guard-- > 0) {
    next = (next + 1) % total;
  }
  currentTurn.value = next;

  // Si on revient au premier siège, on incrémente le round
  if (next <= currentTurn.value && next === 0) currentRound.value += 1;

  // Reset des pouvoirs actifs 1x/tour pour le joueur qui va jouer
  const ship = allBoats[players.value[next].boatIndex];
  if (ship && (ship.abilityId === 'sloop' || ship.abilityId === 'jonque' || ship.abilityId === 'clipper')) {
    players.value[next].abilityUsed = false;
  }

  playUiTap();
  startRound();
};

const gameDeck = [
  { id: 'atk1', name: 'Tir au But', type: 'attack', damage: 1, desc: 'Inflige 1 dégât.', icon: '💥' },
  { id: 'atk2', name: 'Boulets chaînés', type: 'attack', damage: 2, desc: 'Inflige 2 dégâts.', icon: '⛓️' },
  { id: 'def1', name: 'Voile renforcée', type: 'defense', value: 1, desc: 'Annule 1 dégât.', icon: '🛡️' },
  { id: 'heal1', name: 'Tonneau de Rhum', type: 'heal', value: 1, desc: 'Soigne 1 PV.', icon: '🍺' }
];

const useBoatAbility = (playerIndex) => {
  const player = players.value[playerIndex];
  const boat = allBoats[player.boatIndex];
  
  if (player.abilityUsed || boat.type !== 'actif') return;

  // Implémentation basique des pouvoirs actifs
  if (boat.abilityId === 'sloop') {
    if (player.hand.length > 0) {
      player.hand.shift(); // Défausse la 1ère carte
      const randomCard = { ...gameDeck[Math.floor(Math.random() * gameDeck.length)], uid: Math.random().toString(36).substr(2, 9) };
      player.hand.push(randomCard);
      playSuccessChime();
    }
  } else if (boat.abilityId === 'jonque') {
    // Affiche juste un message pour l'instant (la pioche n'est pas un vrai deck trié)
    alert("Pouvoir Jonque activé ! (Regarde la prochaine carte)");
    playSuccessChime();
  } else {
    alert(`Pouvoir ${boat.name} activé !`);
    playSuccessChime();
  }

  player.abilityUsed = true;
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
};

const chooseCards = () => {
  const player = players.value[currentTurn.value];
  const boat = allBoats[player.boatIndex];
  const hand = player.hand;
  
  let cardsToDraw = 2;
  // Pouvoir passif: La Caravelle (+1 carte)
  if (boat.abilityId === 'caravelle') {
    cardsToDraw += 1;
  }

  for (let i = 0; i < cardsToDraw; i++) {
    if (hand.length < 5) { // Main max 5
      const randomCard = { ...gameDeck[Math.floor(Math.random() * gameDeck.length)], uid: Math.random().toString(36).substr(2, 9) };
      hand.push(randomCard);
    }
  }
  showResourcePhase.value = false;
  playSuccessChime();
};

const shopItems = ref([
  { id: 'heal', name: 'Réparations d\'urgence', icon: '❤️', price: 8, purchased: false },
  { id: 'dmg', name: 'Poudre noire', icon: '💣', price: 6, purchased: false },
  { id: 'draw', name: 'Coffre de contrebande', icon: '📦', price: 5, purchased: false },
  { id: 'spy', name: 'Longue-vue du traître', icon: '🔭', price: 7, purchased: false },
  { id: 'peace', name: 'Drapeau de trêve', icon: '🏳️', price: 10, purchased: false },
  { id: 'revive', name: 'Revivre une fois', icon: '✝️', price: 15, purchased: false }
]);

const availableShopItems = computed(() => shopItems.value.filter(item => !item.purchased));

const buyItem = (item) => {
  const player = players.value[currentTurn.value];
  if (player.gold >= item.price && !item.purchased) {
    player.gold -= item.price;
    item.purchased = true;
    playSuccessChime();
    
    // Add basic immediate effects for simple items
    if (item.id === 'heal') {
      player.hp = Math.max(player.hp, 6); // roughly max hp
    }
  } else {
    playHitSound(); // use as error sound
  }
};
const selectedDamage = ref(1);
const damageInput = ref(String(selectedDamage.value));

const playCard = (playerIndex, card) => {
  if (playerIndex !== currentTurn.value) return;

  if (card.type === 'attack') {
    cardBeingPlayed.value = card;
    selectedDamage.value = card.damage;
    isAttacking.value = true;
    playAttackSound();
  } else if (card.type === 'heal') {
    // Jouer la carte de soin immédiatement sur soi-même
    players.value[playerIndex].hp += card.value;
    removeCardFromHand(playerIndex, card);
    playSuccessChime();
  } else {
    // Autres types de cartes à implémenter (ex: défense)
    playUiTap();
  }
};

const removeCardFromHand = (playerIndex, cardToRemove) => {
  const hand = players.value[playerIndex].hand;
  const index = hand.findIndex(c => c.uid === cardToRemove.uid);
  if (index > -1) {
    hand.splice(index, 1);
  }
};

const performAttack = (targetIdx) => {
  if (!isAttacking.value || targetIdx === currentTurn.value) return;
  // Ne pas attaquer un joueur déjà éliminé
  if (players.value[targetIdx].hp <= 0) return;

  const attacker = players.value[currentTurn.value];
  const target = players.value[targetIdx];
  const attackerBoat = allBoats[attacker.boatIndex];
  const targetBoat = allBoats[target.boatIndex];

  // Calculer les dégâts (prendre en compte la tempête)
  let actualDamage = selectedDamage.value;
  if (currentEvent.value && currentEvent.value.id === 'tempete') {
    actualDamage += 1;
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
    alert("L'attaque a manqué à cause de la brume !");
    playHitSound(); // Bruit d'échec
  } else {
    // Appliquer le dégât choisi par l'attaquant
    target.hp = Math.max(0, target.hp - actualDamage);
    playShopSound();
    playHitSound();

    // Pouvoir passif: Le Brick (pioche 1 carte quand attaqué)
    if (targetBoat.abilityId === 'brick' && target.hp > 0 && target.hand.length < 5) {
      const randomCard = { ...gameDeck[Math.floor(Math.random() * gameDeck.length)], uid: Math.random().toString(36).substr(2, 9) };
      target.hand.push(randomCard);
    }
  }

  // Pouvoir passif: Le Brigantin (pioche 2 cartes si on élimine un joueur)
  if (target.hp === 0) {
  attacker.eliminations += 1;
  if (attackerBoat.abilityId === 'brigantin') {
    for (let i = 0; i < 2; i++) {
      if (attacker.hand.length < 5) {
        const randomCard = { ...gameDeck[Math.floor(Math.random() * gameDeck.length)], uid: Math.random().toString(36).substr(2, 9) };
        attacker.hand.push(randomCard);
      }
    }
  }
  }

  // Pouvoir passif: La Frégate (+1 PV si on élimine un joueur)
  if (target.hp === 0 && attackerBoat.abilityId === 'fregate') {
    attacker.hp += 1;
  }

  // Retirer la carte jouée de la main
  if (cardBeingPlayed.value) {
    removeCardFromHand(currentTurn.value, cardBeingPlayed.value);
    cardBeingPlayed.value = null;
  }

  // RÈGLE : Jouer une carte attaque met fin au tour immédiatement
  nextTurn();
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
  hand: [],
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

const confirmCaptain = () => {
  if (winnerIndex.value !== null) {
    // Le Capitaine gagne +1 PV et reçoit le rôle 'capitaine'
    players.value[winnerIndex.value].hp += 1;
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

onMounted(async () => {
  try {
    await fetch('/api/games');
  } catch (e) { /* ignore test error */ }
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
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
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

.ability-tooltip {
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  width: 28vmin;
  min-height: 40px;
  background-image: url('/paper.png');
  background-size: cover;
  background-position: center;
  color: #3d1c10;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-style: italic;
  box-shadow: 0 8px 25px rgba(0,0,0,0.6);
  border: 2px solid #3d1c10;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 50;
  text-align: center;
  line-height: 1.3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.boat-preview:hover .ability-tooltip {
  opacity: 1;
  visibility: visible;
  bottom: 130%;
}

/* On inverse la position de la bulle pour les joueurs du haut pour éviter qu'elle sorte de l'écran */
.top-left .ability-tooltip, .top-right .ability-tooltip, .top-center .ability-tooltip {
  bottom: auto;
  top: 130%;
  transform: translateX(-50%);
}

.top-left .boat-preview:hover .ability-tooltip, 
.top-right .boat-preview:hover .ability-tooltip,
.top-center .boat-preview:hover .ability-tooltip {
  top: 140%;
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

.ability-btn {
  background: #f39c12;
  color: #3d1c10;
  border: 2px solid #e67e22;
  font-size: 0.7rem;
  padding: 5px 12px;
  white-space: nowrap;
}

/* --- CARDS IN HAND STYLES --- */
.player-hand-container {
  position: absolute;
  top: 110%; /* Display below the player's boat */
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  z-index: 90;
}

.player-hand {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.playing-card {
  width: 90px;
  height: 130px;
  background-image: url('/paper.png');
  background-size: cover;
  border-radius: 8px;
  border: 3px solid #3d1c10;
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, filter 0.2s;
  padding: 5px;
  text-align: center;
}

.playing-card:hover {
  transform: translateY(-15px) scale(1.1);
  z-index: 10;
  filter: drop-shadow(0 0 10px rgba(241, 211, 161, 0.8));
}

.playing-card.attack { border-color: #c62828; }
.playing-card.defense { border-color: #2b5797; }
.playing-card.heal { border-color: #2e7d32; }

.card-icon {
  font-size: 2rem;
  margin-bottom: 5px;
}

.card-name {
  font-family: 'Georgia', serif;
  font-weight: bold;
  font-size: 0.7rem;
  color: #3d1c10;
  line-height: 1.1;
}

.card-value {
  margin-top: auto;
  font-weight: bold;
  font-size: 0.9rem;
  color: #c62828;
}

.playing-card.heal .card-value { color: #2e7d32; }
.playing-card.defense .card-value { color: #2b5797; }

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
  border: 5px solid #3d1c10;
  box-shadow: 0 0 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.3);
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
  width: 120px;
  height: auto;
  margin: 20px 0;
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
  border: 5px solid #3d1c10;
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
  border: 4px solid #3d1c10;
  box-shadow: 0 20px 50px rgba(0,0,0,0.8);
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
</style>
