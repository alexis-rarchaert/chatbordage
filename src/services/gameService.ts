import { GameState, Player, Card, Role, Character, GameStatus, ShopItem } from '../models/types';
import { INITIAL_CARDS, INITIAL_ROLES, INITIAL_CHARACTERS, SHOP_ITEMS } from '../data/initialData';
import { v4 as uuidv4 } from 'uuid';

class GameService {
  private games: Map<string, GameState> = new Map();

  createGame(): GameState {
    const game: GameState = {
      id: uuidv4(),
      players: [],
      deck: this.shuffle([...INITIAL_CARDS, ...INITIAL_CARDS, ...INITIAL_CARDS]), // Deck de base triplé
      discardPile: [],
      shop: [...SHOP_ITEMS],
      currentPlayerIndex: 0,
      status: 'LOBBY',
      turnPhase: 'DRAW',
      hasPlayedAttack: false
    };
    this.games.set(game.id, game);
    return game;
  }

  getGame(id: string): GameState | undefined {
    return this.games.get(id);
  }

  addPlayer(gameId: string, name: string): Player | null {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'LOBBY' || game.players.length >= 6) return null;

    const player: Player = {
      id: uuidv4(),
      name,
      character: INITIAL_CHARACTERS[game.players.length % INITIAL_CHARACTERS.length], // Attribuer un perso par défaut pour l'instant
      secretRole: INITIAL_ROLES[game.players.length % INITIAL_ROLES.length], // Attribuer un rôle par défaut
      hp: 5,
      maxHp: 5,
      cards: [],
      coins: 0,
      isAlive: true
    };

    game.players.push(player);
    return player;
  }

  startGame(gameId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'LOBBY' || game.players.length < 2) return null;

    // Mélanger les rôles et personnages
    const roles = this.shuffle([...INITIAL_ROLES]);
    const characters = this.shuffle([...INITIAL_CHARACTERS]);

    game.players.forEach((player, index) => {
      player.secretRole = roles[index % roles.length];
      player.character = characters[index % characters.length];
      // Distribuer 3 cartes
      player.cards = game.deck.splice(0, 3);
    });

    game.status = 'IN_PROGRESS';
    return game;
  }

  drawCards(gameId: string, playerId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'IN_PROGRESS') return null;
    
    const player = game.players[game.currentPlayerIndex];
    if (player.id !== playerId || game.turnPhase !== 'DRAW') return null;

    // Piocher 2 cartes (main max 5)
    const cardsToDraw = Math.min(2, 5 - player.cards.length);
    if (cardsToDraw > 0) {
      const drawn = game.deck.splice(0, cardsToDraw);
      player.cards.push(...drawn);
    }

    game.turnPhase = 'ACTION';
    return game;
  }

  gainCoins(gameId: string, playerId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'IN_PROGRESS') return null;
    
    const player = game.players[game.currentPlayerIndex];
    if (player.id !== playerId || game.turnPhase !== 'DRAW') return null;

    player.coins += 2;
    game.turnPhase = 'ACTION';
    return game;
  }

  playCard(gameId: string, playerId: string, cardId: string, targetId?: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'IN_PROGRESS') return null;

    const player = game.players[game.currentPlayerIndex];
    if (player.id !== playerId || game.turnPhase !== 'ACTION') return null;

    const cardIndex = player.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return null;

    const card = player.cards[cardIndex];
    
    // Logique de la carte
    if (card.type === 'ATTAQUE') {
      if (!targetId) return null;
      const target = game.players.find(p => p.id === targetId);
      if (target && target.isAlive) {
        target.hp -= (card.value || 1);
        if (target.hp <= 0) {
          this.eliminatePlayer(game, target, player);
        }
      }
      game.hasPlayedAttack = true;
      // Fin immédiate du tour après une attaque
      this.endTurn(gameId, playerId);
      return game;
    }

    // Retirer la carte et la mettre dans la défausse
    player.cards.splice(cardIndex, 1);
    game.discardPile.push(card);

    return game;
  }

  buyFromShop(gameId: string, playerId: string, itemId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'IN_PROGRESS') return null;

    const player = game.players[game.currentPlayerIndex];
    if (player.id !== playerId || game.turnPhase !== 'ACTION') return null;

    const item = game.shop.find(i => i.id === itemId);
    if (!item || player.coins < item.price) return null;

    player.coins -= item.price;
    
    // Appliquer l'effet du bonus
    switch (item.id) {
      case 's1': // Full Vie
        player.hp = player.maxHp;
        break;
      case 's2': // Plus de dégâts (bonus permanent simulé ici par un flag ou autre, mais restons simple)
        // Effet géré lors de l'attaque idéalement
        break;
      case 's3': // Plus de cartes
        const drawn = game.deck.splice(0, 3);
        player.cards.push(...drawn);
        break;
      // Les autres effets nécessitent une logique plus complexe (voir rôle, revivre)
      // Pour ce prototype, on s'arrête là sur les effets immédiats
    }

    return game;
  }

  private eliminatePlayer(game: GameState, target: Player, killer: Player) {
    target.isAlive = false;
    target.hp = 0;
    // Transférer cartes et pièces
    killer.cards.push(...target.cards);
    killer.coins += target.coins;
    target.cards = [];
    target.coins = 0;

    // Vérifier conditions de victoire
    this.checkWinConditions(game);
  }

  private checkWinConditions(game: GameState) {
    const alivePlayers = game.players.filter(p => p.isAlive);
    if (alivePlayers.length === 1) {
      game.status = 'FINISHED';
      game.winner = alivePlayers[0].name;
    }
  }

  endTurn(gameId: string, playerId: string): GameState | null {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'IN_PROGRESS') return null;

    const player = game.players[game.currentPlayerIndex];
    if (player.id !== playerId) return null;

    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    // Sauter les joueurs morts
    while (!game.players[game.currentPlayerIndex].isAlive) {
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    }

    game.turnPhase = 'DRAW';
    game.hasPlayedAttack = false;
    return game;
  }

  private shuffle<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
  }
}

export const gameService = new GameService();
