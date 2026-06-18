import { Request, Response } from 'express';
import { gameService } from '../services/gameService';

export const createGame = (req: Request, res: Response) => {
  const game = gameService.createGame();
  res.status(201).json(game);
};

export const getGame = (req: Request, res: Response) => {
  const game = gameService.getGame(req.params.id as string);
  if (!game) return res.status(404).json({ message: 'Partie non trouvée' });
  res.json(game);
};

export const addPlayer = (req: Request, res: Response) => {
  const { name } = req.body;
  const player = gameService.addPlayer(req.params.id as string, name);
  if (!player) return res.status(400).json({ message: 'Impossible d\'ajouter le joueur' });
  res.status(201).json(player);
};

export const startGame = (req: Request, res: Response) => {
  const game = gameService.startGame(req.params.id as string);
  if (!game) return res.status(400).json({ message: 'Impossible de lancer la partie' });
  res.json(game);
};

export const drawCards = (req: Request, res: Response) => {
  const { playerId } = req.body;
  const game = gameService.drawCards(req.params.id as string, playerId);
  if (!game) return res.status(400).json({ message: 'Action impossible' });
  res.json(game);
};

export const gainCoins = (req: Request, res: Response) => {
  const { playerId } = req.body;
  const game = gameService.gainCoins(req.params.id as string, playerId);
  if (!game) return res.status(400).json({ message: 'Action impossible' });
  res.json(game);
};

export const playCard = (req: Request, res: Response) => {
  const { playerId, cardId, targetId } = req.body;
  const game = gameService.playCard(req.params.id as string, playerId, cardId, targetId);
  if (!game) return res.status(400).json({ message: 'Action impossible' });
  res.json(game);
};

export const endTurn = (req: Request, res: Response) => {
  const { playerId } = req.body;
  const game = gameService.endTurn(req.params.id as string, playerId);
  if (!game) return res.status(400).json({ message: 'Action impossible' });
  res.json(game);
};

export const buyFromShop = (req: Request, res: Response) => {
  const { playerId, itemId } = req.body;
  const game = gameService.buyFromShop(req.params.id as string, playerId, itemId);
  if (!game) return res.status(400).json({ message: 'Achat impossible' });
  res.json(game);
};
