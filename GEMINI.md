Construire une API rest pour le jeu ChatBordage

ChatBordage — Document de conception
Page 1
CHATBORDAGE
Document de conception — Document de travail
Jeu de cartes & rôles cachés — Thème chats pirates
4–8 joueurs
Version : 16 juin 2026
⚠ Ce document reflète les décisions validées à date. Les sections marquées "À FAIRE" ou "EN
ATTENTE" restent à construire.
ChatBordage — Document de conception
Page 2
Sommaire
• 1. Concept & intention du projet
• 2. Mise en place
• 3. Déroulement d'un tour
• 4. Points de vie & élimination
• 5. Rôles secrets
• 6. Navires (personnages jouables)
• 7. Équipement & cartes permanentes
• 8. La boutique
• 9. La tablette compagnon
• 10. Cartes à jouer — état d'avancement
• 11. Prochaines étapes
ChatBordage — Document de conception
Page 3
1. Concept & intention du projet
ChatBordage est un jeu de cartes à rôles cachés mêlant réflexion, hasard et interactions
sociales, dans un univers de chats pirates. Chaque joueur incarne un navire visible doté de
capacités propres, tout en poursuivant une mission secrète connue de lui seul (à l'exception du
Capitaine, dont le rôle est public).
Objectifs de design : un jeu facile à prendre en main, riche en interactions (bluff, accusation,
trahison), rejouable grâce à des situations différentes à chaque partie, et capable de créer des
moments de tension et de surprise.
Format
• 4 à 8 joueurs
• Durée estimée : ~30 minutes
• Thème : piraterie féline
• Support : cartes physiques + tablette compagnon (gestion des rôles, événements et
boutique)
2. Mise en place
• Chaque joueur reçoit 5 points de vie de départ (6 pour le joueur incarnant le Capitaine).
• Chaque joueur choisit ou reçoit 1 navire, visible de tous, avec ses statistiques (PV,
dégâts) et son pouvoir propre.
• Chaque joueur consulte sur la tablette son rôle secret — sauf le Capitaine, révélé
publiquement dès le début de la partie.
• Chaque joueur reçoit une main de départ de 3 cartes.
3. Déroulement d'un tour
1. Événement de mer : la tablette tire un événement aléatoire qui s'applique à tous les
joueurs ce tour (ex. tempête, brume, île au trésor).
2. Phase de ressources : le joueur choisit, de façon exclusive, soit de piocher 2 cartes, soit
de gagner 2 pièces. La main est limitée à 5 cartes.
3. Phase d'action : le joueur peut jouer autant de cartes qu'il le souhaite, en ciblant
librement n'importe quel autre joueur. Dès qu'une carte Attaque est jouée, le tour
s'arrête immédiatement, même s'il reste des cartes en main.
4. Pouvoir de navire : le joueur peut activer le pouvoir de son navire, une fois par tour
(selon le navire : passif automatique ou actif déclenché).
Règle clé conservée du brief d'origine : jouer une carte Attaque met fin au tour sur-le-champ — à
anticiper dans l'ordre de jeu des cartes.
ChatBordage — Document de conception
Page 4
4. Points de vie & élimination
• Chaque joueur dispose de 5 PV de départ (6 pour le Capitaine).
• Lorsqu'un joueur atteint 0 PV, il est éliminé définitivement.
• À l'élimination : ses cartes en main et ses pièces sont transférées au joueur qui l'a
éliminé.
5. Rôles secrets
Les rôles sont consultés individuellement sur la tablette en tout début de partie (sauf le
Capitaine, révélé à voix haute / visible de tous). Décision clé : les rôles ne portent aucune
capacité mécanique — ils définissent uniquement une mission. Tous les pouvoirs du jeu sont
concentrés sur les navires (voir section 6). Le Capitaine fait exception avec son bonus de +1
PV, lié à son exposition publique.
Rôle Statut Mission (condition de victoire) Pouvoir
Capitaine Public
Survivre jusqu'au duel final (jusqu'à ce
qu'il ne reste qu'un seul autre joueur en
vie).
+1 PV max de
départ (6 PV au
total). Seul rôle
à bénéficier d'un
effet.
Protecteur Caché Garder le Capitaine en vie jusqu'à la fin
de la partie. Aucun.
Chasseur de
Primes Caché Couler (éliminer) 2 navires ennemis
avant tout le monde. Aucun.
Renégat Caché Être le dernier survivant ; doit voir
l'élimination de tous les autres joueurs. Aucun.
Contrebandier Caché Accumuler 15 pièces, à n'importe quel
moment de la partie. Aucun.
À FAIRE : condition de litige si plusieurs missions sont accomplies au même moment (ordre de priorité,
ou règle de départage, à définir).
ChatBordage — Document de conception
Page 5
6. Navires (personnages jouables)
Les navires remplacent la notion de "personnage" du brief d'origine : visibles de tous, ils
possèdent des statistiques de base (PV, dégâts) et un pouvoir unique, passif ou actif. Ce sont
les seuls éléments du jeu à porter des pouvoirs (les rôles secrets n'en ont aucun, voir section
5).
Navire PV Dég
âts Type Pouvoir
La Frégate 6 1 Passif +1 PV à chaque élimination ennemie.
Le Galion 5 2 Passif Main maximale portée à 6 cartes.
La Corvette 4 1 Actif
(1x/partie) Esquive une attaque complètement.
Le Vaisseau
Fantôme 5 1 Passif Ton rôle ne peut jamais être révélé par l'ennemi.
La Caravelle 5 1
Actif
(passif en
pratique)
Pioche 1 carte supplémentaire gratuite chaque
tour.
Le Sloop 4 1 Actif
(1x/tour)
Échange une carte de ta main contre une carte
au hasard de la pioche.
Le Brick 5 1 Passif Quand tu es attaqué, pioche 1 carte
(compensation).
La Jonque 4 1 Actif
(1x/tour)
Regarde la carte du dessus de la pioche ; gardela ou remets-la dessous.
Le Trois-Mâts 6 1 Passif Tes cartes Équipement ne peuvent pas être
détruites.
La Felouque 4 2 Passif Si tu attaques un joueur qui a plus de PV que
toi, +1 dégât bonus.
Le Cotre 5 1 Actif
(1x/partie)
Vole 1 carte au hasard dans la main d'un
adversaire.
Le Brigantin 4 1 Passif
Quand tu élimines un joueur, pioche 2 cartes en
bonus, en plus de récupérer ses cartes et
pièces.
Le Clipper 4 1 Actif
(1x/tour)
Si tu n'as joué aucune carte Attaque ce tour,
gagne 1 pièce bonus.
La Gabare 5 1 Passif Gagne 1 pièce supplémentaire chaque fois que
tu choisis l'option pièces (au lieu de piocher).
Le Cuirassé 7 1 Passif -1 dégât sur toutes les attaques reçues
(minimum 1).
ChatBordage — Document de conception
Page 6
Répartition des types de pouvoirs sur les 15 navires : tanky/résistance (Frégate, Cuirassé), dégâts élevés
(Galion, Felouque), manipulation de pioche (Sloop, Jonque, Caravelle, Brick), vol de carte (Cotre), antidestruction (Trois-Mâts), anti-révélation (Vaisseau Fantôme), esquive (Corvette), génération de pièces
(Clipper, Gabare), bonus à l'élimination (Brigantin).
ChatBordage — Document de conception
Page 7
7. Équipement & cartes permanentes
Les cartes Équipement, une fois jouées, restent en jeu comme bonus permanents
(contrairement aux cartes à usage unique). Elles peuvent être volées ou détruites par d'autres
cartes — ce qui crée une cible prioritaire et une vraie course à l'objet, plutôt qu'une simple
accumulation passive.
• Décision validée : pas de système de slots limités sur un tapis de jeu (contrairement à
une version antérieure du concept).
• Décision validée : pas de restriction de ciblage liée à l'équipement (un joueur peut cibler
n'importe quel adversaire librement, peu importe son équipement).
À FAIRE : liste détaillée des cartes Équipement (effets, valeurs, quantités dans le deck) — dépend de la
table de cartes à jouer, non encore construite.
8. La boutique
La boutique permet de dépenser ses pièces contre des bonus puissants, gérée via la tablette
compagnon.
• Chaque bonus est unique par partie : une fois acheté par un joueur, il disparaît du
marché pour tout le monde.
• Achats visibles de tous, à l'exception de certains effets dont le résultat reste privé (ex.
révéler un rôle secret).
Pistes de bonus (issues du brief et du document de référence)
• Réparations d'urgence — restaure tous les PV au maximum.
• Poudre noire — +2 dégâts sur la prochaine attaque.
• Coffre de contrebande — pioche 3 cartes immédiatement.
• Longue-vue du traître — révèle le rôle secret d'un joueur (visible uniquement par
l'acheteur).
• Drapeau de trêve — personne ne peut attaquer ce joueur pendant 2 tours complets.
• Revivre une fois (du brief d'origine, à raccorder avec la liste ci-dessus).
À FAIRE : verrouiller le coût exact de chaque bonus en pièces, et la liste finale retenue (actuellement un
mélange brief + document de référence, pas encore unifié).
Sources de pièces (pistes validées pour enrichir le Contrebandier)
• Choix exclusif pioche 2 cartes / 2 pièces en début de tour (règle de base).
• Récupération des pièces d'un joueur éliminé.
• Carte Trésor à usage unique donnant un lot de pièces d'un coup (ex. 3 à 5 pièces),
façon "île au trésor".
• Mécanique de pari : certaines actions risquées (attaquer, accuser) peuvent rapporter un
bonus en pièces si elles réussissent.
• Carte permanente type "Cale" générant 1 pièce passive par tour tant qu'elle reste en jeu
(mais volable/destructible, donc cible prioritaire).
ChatBordage — Document de conception
Page 8
• Pouvoir de navire dédié : La Gabare (+1 pièce sur le choix "pièces") et Le Clipper (+1
pièce si aucune attaque jouée ce tour).
9. La tablette compagnon
La tablette centrale fait office de maître du jeu numérique. Elle gère les éléments qui doivent
rester aléatoires, cachés ou centralisés.
• Distribution des rôles : chaque joueur consulte son rôle secret individuellement sur la
tablette en début de partie.
• Événements de mer : tirage d'un événement aléatoire en début de chaque tour, visible
de tous, qui s'applique à l'ensemble des joueurs.
• Boutique : gestion des achats, affichage du stock de bonus disponibles.
À FAIRE : lister précisément les événements de mer possibles (le document de référence mentionne
tempête, brume épaisse, île au trésor — à étoffer et équilibrer).
ChatBordage — Document de conception
Page 9
10. Cartes à jouer — état d'avancement
Cette section n'est pas encore construite. Elle constitue la prochaine étape du projet.
Décisions déjà actées
• Volume cible : une centaine de cartes au total (deck "à jouer", hors cartes Rôle et
Navire).
• Direction artistique : univers de chats pirates.
• Le jeu doit se différencier de références comme Bang! ou Munchkin : pas de simple
copie des mécaniques d'attaque/défense classiques.
• Répartition voulue déséquilibrée : familles dominantes plus fournies (attaque,
protection), familles plus rares pour les effets tactiques pointus (bluff, vol d'information,
pacte).
• Système de rareté à prévoir (paliers à définir) influençant le nombre d'exemplaires par
carte.
Pistes de familles évoquées (non figées)
• Abordages — cartes d'attaque, dégâts directs.
• Voiles — cartes de protection / défense.
• Marées — cartes de soin.
• Rumeurs — bluff, manipulation d'information, échange forcé.
• Trésors — bonus permanents (équipement).
EN ATTENTE : ces noms de familles ont été proposés mais pas encore validés un par un avec le porteur
de projet. La table finale (famille × rareté × quantité × effet) reste à construire.
11. Prochaines étapes
5. Construire la table complète des cartes à jouer : familles, paliers de rareté, quantités,
effets précis (~100 cartes).
6. Détailler les cartes Équipement (liste, valeurs, interactions avec le vol/la destruction).
7. Lister et équilibrer les événements de mer gérés par la tablette.
8. Unifier et chiffrer la liste finale des bonus de la boutique.
9. Définir la règle de départage en cas de missions accomplies simultanément.
10. Définir l'identité visuelle détaillée (chats, navires, factions visuelles) pour accompagner
la DA pirate.