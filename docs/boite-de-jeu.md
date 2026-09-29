# La boîte de jeu ChatBordage — décisions et pistes

Document de travail : ce qui a été décidé (✅), ce qui reste ouvert (❓) et ce qu'on a écarté (❌).
Dernière mise à jour : 29 septembre 2026. Source de vérité du contenu du deck : `supabase/functions/_shared/game/cards.ts`.

## 1. Deux façons de jouer

| Mode | Route | Pour qui | Accès |
|---|---|---|---|
| **En ligne** | `/online` | Le jeu complet, sans boîte ni cartes physiques, un téléphone par joueur | ✅ Gratuit, sans code |
| **Compagnon** | `/game` | Complément du jeu de cartes physique (rôles secrets, événements, boutique, PV, pièces, victoire) | ✅ Code unique de la boîte |

Le compagnon ne connaît pas les cartes : les joueurs gardent leurs cartes en main et l'appli demande le résultat
(dégâts de la carte, défense de la cible). Les deux modes partagent le même moteur de règles.

## 2. Contenu de la boîte

✅ **Contenu retenu**

| Élément | Quantité | Remarque |
|---|---|---|
| Cartes à jouer | **96** (24 modèles) | Abordage 29 · Voile 17 · Marée 16 · Rumeur 20 · Trésor 14 |
| Cartes Navire | **15** | Visibles de tous : PV, dégâts, pouvoir. Ce ne sont pas des compteurs. |
| Livret de règles | 1 | Avec le QR code et l'adresse du compagnon |
| Code d'activation | 1 par boîte | Voir § 4 |

❌ **Écarté**

- **Pièces (jetons)** : le compagnon tient déjà le compte (boutique, victoire du Contrebandier à 15 pièces). Des jetons
  feraient un double comptage qui finirait par diverger. Pourra s'ajouter plus tard sans toucher aux règles.
- **Jetons / cadrans de points de vie** : le compagnon les suit automatiquement (Tempête, Reflux, Frégate, Kraken,
  éliminations). La tablette affiche les PV de chacun devant lui.
- **Conséquence** : la tablette reste sur la table pendant toute la partie ; les effets des cartes physiques
  (Rhum, Cale, Coffre au trésor, équipements) se saisissent dans le panneau « Ajuster PV et pièces ».

❓ **Cartes Rôle** : les rôles sont distribués en secret par l'appli (toujours 1 Capitaine + 1 Protecteur). Des cartes
Rôle physiques obligeraient à les distribuer à la main. Recommandation : les inclure seulement comme aide-mémoire
illustré, à ne pas distribuer (5 modèles).

## 3. Taille de la boîte

Format de carte recommandé : **63 × 88 mm** (« poker »), le plus courant et le moins cher chez les imprimeurs.

| Élément | Épaisseur estimée |
|---|---|
| 111 cartes (96 + 15) à environ 0,33 mm (carton 300–350 g) | ≈ 37 mm |
| Livret plié | ≈ 2 mm |
| **Total** | **≈ 40 mm** |

- ✅ Boîte à rabat d'environ **66 × 92 × 45 mm** (intérieur), soit 5 mm de marge pour un changement du nombre de
  cartes ou 5 cartes Rôle aide-mémoire.
- ❓ Boîte rigide à couvercle (~100 × 140 × 45 mm) : plus « jeu de société », plus chère, de la place perdue. À
  réserver au cas où on ajouterait des jetons.
- Ces chiffres sont des **estimations** : l'épaisseur dépend du carton. Demander un échantillon ou un gabarit à
  l'imprimeur avant de valider.

## 4. Code d'activation du compagnon

✅ **Décision** : le mode en ligne reste gratuit et sans code ; le compagnon exige le code de la boîte.

**Fonctionnement** (`supabase/migrations/20260929020000_companion_activation.sql`)

- Un code unique par boîte (16 caractères sans I/O/0/1, ≈ 80 bits), généré par
  `select * from public.generate_activation_codes(500);` dans le SQL Editor (droits administrateur).
- Vérification **côté serveur** : le navigateur n'a plus accès à la table des codes (l'ancienne lecture publique a
  été retirée). Anti-devinette : 8 échecs bloquent l'appareil 15 minutes.
- Un code active **3 appareils** au maximum (une boîte se partage à une table). L'appareil est identifié par son
  compte anonyme Supabase ; retaper le code sur le même appareil ne consomme pas de place.
- QR code : `https://chatbordage.fr/game?code=XXXX-XXXX-XXXX-XXXX` active l'appareil automatiquement.

**Où mettre le code dans la boîte**

- Sous une **pastille à gratter**, ou sur une carte cachée sous le paquet : personne ne lit le code en rayon.
- Imprimé aussi en **QR code** (impression à données variables : pas de surcoût notable).
- Une boîte filmée sous cellophane / avec un sceau : ouvrir la boîte = l'avoir achetée.

**Limites à assumer** (rien de ceci n'est résolu, et il vaut mieux le savoir)

- On ne peut pas prouver l'**achat**, seulement la **possession d'un code non épuisé**. Un code volé en magasin ou
  revendu seul fonctionnera.
- Le compagnon tourne dans le navigateur : le contrôle est un cadenas d'usage, pas une protection inviolable.
  Seul le mode en ligne (logique côté serveur) pourrait être réellement verrouillé.
- **Revente de la boîte** : rien n'empêche un vendeur de garder son code. Mais le code n'active que 3 appareils, donc
  un vendeur ne peut pas en faire profiter des acheteurs sans limite. L'acheteur d'une boîte d'occasion reçoit un code
  qui peut avoir des places prises. Cas simple à prévoir : il contacte le support ; on réinitialise avec
  `delete from code_activations where code = '…';`.
- Le mode en ligne étant gratuit, la revente ne prive personne de l'essentiel du jeu : ce qui est protégé, c'est
  seulement l'accès au compagnon.

**Puce NFC ?** ❌ Écartée pour l'instant. Elle ne prouve pas l'achat et ne garantit pas l'usage unique : elle contient
juste une adresse (comme un QR code, en plus pratique : on pose le téléphone sur la boîte). Coût d'environ 0,2 à 0,5 €
par boîte + une étape de fabrication (programmer et coller chaque puce). Les puces courantes se lisent et se copient
facilement ; celles qui empêchent la copie demandent un calcul cryptographique sur le serveur, disproportionné ici.
Option de luxe pour plus tard.

## 5. Avant d'imprimer

1. ❗ **Ne rien imprimer avant d'avoir joué.** Le jeu n'a jamais été joué à plusieurs. Une carte imprimée ne se corrige
   pas, alors que le code se corrige en une minute. Ordre conseillé : parties en ligne entre amis → une partie avec des
   cartes imprimées à la maison (ou en papier) et le compagnon → seulement ensuite le tirage.
2. **24 illustrations de cartes à jouer** à produire, plus 15 navires (5 rôles si aide-mémoire). Les visuels
   existants (`public/cartes/`) couvrent des rôles, des navires et quelques cartes d'action, pas tout le deck.
   Ces PNG pèsent 52 Mo au total : à convertir en WebP pour le site.
3. **Textes à mettre à jour** avant impression et sur le site :
   - Page Règlement, « Contenu de la boîte » : annonce encore « 100 cartes » et « des pièces (jetons) » → 96 cartes,
     15 cartes Navire, application compagnon, sans pièces.
   - « 4–6 joueurs » (livret) ; le mode en ligne accepte 4 à 8, le compagnon 4 à 6.
4. Équilibrage encore inconnu (durée des parties, force de chaque rôle, prix de la boutique) : à mesurer en jouant.

## 6. Questions ouvertes

- Nombre définitif de cartes (96 aujourd'hui, la conception visait environ 100).
- Cartes Rôle physiques en aide-mémoire : oui / non.
- Boîte à rabat ou rigide.
- Limite d'appareils par code (3 par défaut, modifiable par code : `update activation_codes set max_devices = …`).
- Vente en ligne uniquement ou aussi en magasin (en ligne, le code pourrait aussi être envoyé par email à l'achat).
