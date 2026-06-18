<template>
  <div class="game-view">
    <!-- --- ÉCRAN DE LOBBY --- -->
    <template v-if="!isStarted && !isRouletteVisible">
      <div class="lobby-overlay">
        <!-- Titres dupliqués pour les deux côtés de la table -->
        <div class="lobby-titles">
          <h1 class="lobby-title title-top">{{ $t('game.lobby.title') }}</h1>
          
          <!-- SÉLECTEUR DE NOMBRE DE JOUEURS -->
          <div class="player-count-selector">
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

            <!-- SÉLECTEUR DE CHAT -->
            <div class="selector">
              <button @click.stop="prevCat(index)" :disabled="player.ready">◀</button>
              <div class="preview-box">
                <img :src="`/chats/${allCats[player.catIndex].file}`" class="preview-img cat-preview" />
              </div>
              <button @click.stop="nextCat(index)" :disabled="player.ready">▶</button>
            </div>
            <p class="item-name">{{ allCats[player.catIndex].name }}</p>

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

    <!-- --- ANIMATION INTRO BATEAU --- -->
    <template v-else-if="isBoatAnimVisible">
      <div class="boat-intro-overlay" @click.self>
        <img :src="`/bateaux/${animBoatFile}`" class="boat-intro-img" alt="bateau" :style="{ animationDuration: boatAnimDuration + 'ms' }" />
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
                class="action-button attack-btn" 
                :class="{ 'active': isAttacking }"
                @click.stop="triggerAttackMode"
              >
                {{ $t('game.turn.attack') }}
              </button>
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
            <img :src="`/chats/${allCats[player.catIndex].file}`" class="cat-img" />
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
  { file: 'brick.webp', name: 'Le Brick', ability: 'catSlides.frigate' },
  { file: 'brigantin.webp', name: 'Le Brigantin', ability: 'catSlides.junk' },
  { file: 'Caravelle.webp', name: 'La Caravelle', ability: 'catSlides.frigate' },
  { file: 'clipper.webp', name: 'Le Clipper', ability: 'catSlides.junk' },
  { file: 'Corvette.webp', name: 'La Corvette', ability: 'catSlides.frigate' },
  { file: 'cotre.webp', name: 'Le Cotre', ability: 'catSlides.junk' },
  { file: 'cuirasse.webp', name: 'Le Cuirassé', ability: 'catSlides.frigate' },
  { file: 'felouque.webp', name: 'La Felouque', ability: 'catSlides.junk' },
  { file: 'Fregate.webp', name: 'La Frégate', ability: 'catSlides.frigate' },
  { file: 'gabare.webp', name: 'La Gabare', ability: 'catSlides.junk' },
  { file: 'Galion.webp', name: 'Le Galion', ability: 'catSlides.frigate' },
  { file: 'jonque.webp', name: 'La Jonque', ability: 'catSlides.junk' },
  { file: 'sloop.webp', name: 'Le Sloop', ability: 'catSlides.junk' },
  { file: 'trois-mats.webp', name: 'Trois-Mâts', ability: 'catSlides.frigate' },
  { file: 'Vaisseau_Fantôme.webp', name: 'Vaisseau Fantôme', ability: 'catSlides.ghostShip' }
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
const isAttacking = ref(false);
const selectedDamage = ref(1);
const showDamageModal = ref(false);
const damageInput = ref(String(selectedDamage.value));

const createAudioContext = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
};

const playTone = (frequency, duration = 0.12, type = 'sine', volume = 0.05, decayTo = 0.0001) => {
  const context = createAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(decayTo, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration + 0.02);
  window.setTimeout(() => context.close(), Math.ceil((duration + 0.2) * 1000));
};

const playUiTap = () => playTone(540, 0.08, 'square', 0.03);
const playSuccessChime = () => {
  playTone(523.25, 0.1, 'triangle', 0.04);
  window.setTimeout(() => playTone(659.25, 0.1, 'triangle', 0.04), 90);
};
const playAttackSound = () => playTone(190, 0.16, 'sawtooth', 0.045);
const playHitSound = () => {
  playTone(120, 0.1, 'sine', 0.05);
  window.setTimeout(() => playTone(75, 0.14, 'sine', 0.04), 70);
};
const playShopSound = () => {
  playTone(330, 0.08, 'triangle', 0.03);
  window.setTimeout(() => playTone(392, 0.08, 'triangle', 0.03), 70);
};

const nextTurn = () => {
  // Donner la récompense uniquement si le joueur courant est encore en vie
  if (players.value[currentTurn.value].hp > 0) {
    players.value[currentTurn.value].gold += 2;
  }

  // Chercher le prochain joueur vivant
  const n = players.value.length;
  let i = (currentTurn.value + 1) % n;
  let found = false;
  for (let k = 0; k < n; k++) {
    const idx = (i + k) % n;
    if (players.value[idx].hp > 0) {
      currentTurn.value = idx;
      found = true;
      break;
    }
  }
  // Si aucun joueur vivant trouvé (cas extrême), garder la valeur incrémentée
  if (!found) {
    currentTurn.value = (currentTurn.value + 1) % n;
  }

  isAttacking.value = false;
  playUiTap();
};

const triggerAttackMode = () => {
  // Si on est déjà en mode attaque, on quitte le mode
  if (isAttacking.value) {
    isAttacking.value = false;
    showDamageModal.value = false;
    return;
  }
  // Ouvrir la modale de saisie au-dessus du bateau
  playAttackSound();
  damageInput.value = String(selectedDamage.value);
  showDamageModal.value = true;
};

const confirmDamage = () => {
  const val = parseInt(damageInput.value, 10);
  if (isNaN(val) || val <= 0) {
    alert('Veuillez entrer un entier positif.');
    return;
  }
  selectedDamage.value = val;
  showDamageModal.value = false;
  isAttacking.value = true;
  playUiTap();
};

const cancelDamage = () => {
  showDamageModal.value = false;
  playUiTap();
};

const increaseDamage = () => {
  const cur = parseInt(damageInput.value, 10) || 0;
  damageInput.value = String(Math.max(1, cur + 1));
};

const decreaseDamage = () => {
  const cur = parseInt(damageInput.value, 10) || 1;
  playHitSound();
};

const performAttack = (targetIdx) => {
  if (!isAttacking.value || targetIdx === currentTurn.value) return;
  // Ne pas attaquer un joueur déjà éliminé
  if (players.value[targetIdx].hp <= 0) return;

  // Appliquer le dégât choisi par l'attaquant
  players.value[targetIdx].hp = Math.max(0, players.value[targetIdx].hp - selectedDamage.value);
  playShopSound();
  playHitSound();

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

const players = ref(Array.from({ length: 4 }, () => ({ 
  boatIndex: getRandomIndex(allBoats.length), 
  catIndex: getRandomIndex(allCats.length), 
  ready: false, 
  hp: 5, 
  gold: 0,
  boatConflict: false
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
        boatConflict: false
      });
    }
  } else if (newCount < currentCount) {
    players.value.splice(newCount);
  }
});

const allReady = computed(() => players.value.every(p => p.ready));

const nextBoat = (idx) => { players.value[idx].boatIndex = (players.value[idx].boatIndex + 1) % allBoats.length; };
const prevBoat = (idx) => { players.value[idx].boatIndex = (players.value[idx].boatIndex - 1 + allBoats.length) % allBoats.length; };
const nextCat = (idx) => { players.value[idx].catIndex = (players.value[idx].catIndex + 1) % allCats.length; };
const prevCat = (idx) => { players.value[idx].catIndex = (players.value[idx].catIndex - 1 + allCats.length) % allCats.length; };
const toggleReady = (idx) => { 
  const player = players.value[idx];
  if (!player.ready) {
    const isBoatTaken = players.value.some((p, i) => i !== idx && p.ready && p.boatIndex === player.boatIndex);
    if (isBoatTaken) {
      playHitSound();
      player.boatConflict = true;
      setTimeout(() => { player.boatConflict = false; }, 2000);
      return;
    }
  }
  player.ready = !player.ready; 
  playUiTap();
};

const isBoatAnimVisible = ref(false);
const animBoatFile = ref(allBoats[0].file);
const boatAnimDuration = 1800; // ms

const startGame = () => {
  // Marquer la partie comme démarrée pour quitter l'écran de lobby
  isStarted.value = true;

  // Choisir un bateau aléatoire depuis le dossier /bateaux pour l'animation
  const idx = Math.floor(Math.random() * allBoats.length);
  animBoatFile.value = allBoats[idx].file;
  isBoatAnimVisible.value = true;

  // Après l'animation, afficher la roulette
  setTimeout(() => {
    isBoatAnimVisible.value = false;
    isRouletteVisible.value = true;
  }, boatAnimDuration);
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
    players.value[winnerIndex.value].hp += 1;
    isRouletteVisible.value = false;
    isStarted.value = true;
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
  gap: 1vmin;
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
  background: #c62828;
  color: white;
  border-color: #8e0000;
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
  background: #c62828;
  color: white;
  border: 2px solid #8e0000;
  font-size: 0.7rem;
  padding: 5px 12px;
  white-space: nowrap;
}

.attack-btn.active {
  background: #ff5252;
  box-shadow: 0 0 15px #ff5252;
  animation: pulse-red 1s infinite;
}

.attack-prompt {
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  background: #c62828;
  color: white;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  white-space: nowrap;
  z-index: 101;
}

.damage-modal {
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 102;
}

.damage-modal-content {
  background-image: url('/paper.png');
  background-size: cover;
  padding: 24px 12px;
  border-radius: 8px;
  min-width: 140px;
  text-align: center;
}

.damage-modal-title {
  color: #3d1c10;
  font-weight: bold;
  margin-bottom: 6px;
}

.damage-input {
  width: 60px;
  padding: 4px 6px;
  font-size: 1rem;
  text-align: center;
  border-radius: 6px;
  border: 1px solid #3d1c10;
  margin-bottom: 8px;
}

.damage-modal-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.damage-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin-bottom: 8px;
}

.damage-step {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.damage-step.plus {
  background: #388e3c;
  color: white;
  border: 2px solid #2e7d32;
}

.damage-step.minus {
  background: #c62828;
  color: white;
  border: 2px solid #8e0000;
}

.damage-modal-actions .attack-confirm {
  background: #c62828;
  color: white;
  border: 2px solid #8e0000;
}

.damage-modal-actions .cancel-button {
  background: #3d1c10;
  color: #f1d3a1;
  border: 2px solid #f1d3a1;
}

.damage-modal-actions .action-button:hover { transform: translateY(-2px); }

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

/* --- SHOP OVERLAY STYLES --- */
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

/* --- BOAT INTRO ANIMATION --- */
.boat-intro-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.85));
  z-index: 2500;
}

.boat-intro-img {
  width: 40vmin;
  max-width: 420px;
  transform-origin: 50% 60%;
  /* animation name is set in CSS; duration provided inline */
  animation: boatAcross ease-in-out forwards;
}

@keyframes boatAcross {
  0% {
    transform: translateX(120vw) translateY(6vh) scale(0.9) scaleX(-1) rotate(-6deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    transform: translateX(10vw) translateY(6vh) scale(1) scaleX(-1) rotate(0deg);
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateX(-120vw) translateY(6vh) scale(0.9) scaleX(-1) rotate(6deg);
    opacity: 0;
  }
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
