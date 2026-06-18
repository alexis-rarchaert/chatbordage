import { Router } from 'express';
import * as gameController from '../controllers/gameController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Card:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         type:
 *           type: string
 *           enum: [ATTAQUE, SOIN, PROTECTION, VOL, OBJET]
 *     Player:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         hp:
 *           type: integer
 *         coins:
 *           type: integer
 *         isAlive:
 *           type: boolean
 *     Game:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         status:
 *           type: string
 *           enum: [LOBBY, IN_PROGRESS, FINISHED]
 *         players:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Player'
 */

/**
 * @swagger
 * /api/games:
 *   post:
 *     summary: Créer une nouvelle partie
 *     tags: [Games]
 *     responses:
 *       201:
 *         description: Partie créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Game'
 */
router.post('/', gameController.createGame);

/**
 * @swagger
 * /api/games/{id}:
 *   get:
 *     summary: Récupérer l'état d'une partie
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: État de la partie
 *       404:
 *         description: Partie non trouvée
 */
router.get('/:id', gameController.getGame);

/**
 * @swagger
 * /api/games/{id}/players:
 *   post:
 *     summary: Ajouter un joueur à une partie
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Joueur ajouté
 */
router.post('/:id/players', gameController.addPlayer);

/**
 * @swagger
 * /api/games/{id}/start:
 *   post:
 *     summary: Lancer la partie
 *     tags: [Games]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Partie lancée
 */
router.post('/:id/start', gameController.startGame);

/**
 * @swagger
 * /api/games/{id}/draw:
 *   post:
 *     summary: Piocher des cartes
 *     tags: [Gameplay]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cartes piochées
 */
router.post('/:id/draw', gameController.drawCards);

/**
 * @swagger
 * /api/games/{id}/coins:
 *   post:
 *     summary: Gagner des pièces
 *     tags: [Gameplay]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pièces gagnées
 */
router.post('/:id/coins', gameController.gainCoins);

/**
 * @swagger
 * /api/games/{id}/play:
 *   post:
 *     summary: Jouer une carte
 *     tags: [Gameplay]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: string
 *               cardId:
 *                 type: string
 *               targetId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Carte jouée
 */
router.post('/:id/play', gameController.playCard);

/**
 * @swagger
 * /api/games/{id}/end-turn:
 *   post:
 *     summary: Finir le tour
 *     tags: [Gameplay]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tour terminé
 */
router.post('/:id/end-turn', gameController.endTurn);

/**
 * @swagger
 * /api/games/{id}/shop:
 *   post:
 *     summary: Acheter un objet dans la boutique
 *     tags: [Gameplay]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerId:
 *                 type: string
 *               itemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Achat réussi
 */
router.post('/:id/shop', gameController.buyFromShop);

export default router;
