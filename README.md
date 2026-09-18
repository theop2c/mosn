# MOSN — Minimal Open Social Network

Squelette open source de réseau social, prêt à forker. **Licence GPL-3.0.**

## L'idée du projet

Pouvoir héberger un réseau social **sans aucun serveur à acquérir ni à
administrer** :

- **Netlify** déploie et héberge le frontend (et les Netlify Functions)
  **gratuitement** ;
- **Google Firebase** fournit l'authentification et la base de données
  temps réel (Firestore) **gratuitement** sur le plan Spark ;
- la seule exception est l'**hébergement des images** (Firebase Storage),
  qui nécessite le forfait payant de Google — voir
  [Et les images ?](#et-les-images--firebase-storage) plus bas.

Résultat : vous forkez, vous cliquez, c'est en ligne. Zéro machine, zéro
facture tant que vous restez dans les quotas gratuits (largement suffisants
pour une petite communauté).

| Couche | Techno |
| --- | --- |
| Frontend | Vite + React 19 + TypeScript |
| Auth & données | Firebase Auth + Cloud Firestore (SDK client, temps réel) |
| Backend privilégié | **Netlify Functions** (TypeScript + `firebase-admin`) |
| Hébergement | Netlify (build + CDN + functions) |

> ⚠️ **Aucune Cloud Function Firebase** : tout le code serveur tourne sur
> Netlify Functions. Le projet fonctionne donc entièrement sur le plan
> **Firebase Spark (gratuit)** + le tier gratuit Netlify — pas besoin de
> passer en Blaze.

## Fonctionnalités du squelette

- **Assistant d'installation intégré** : au premier déploiement, le site
  affiche un formulaire (nom du site, environnement, compte admin, collage
  de la config Firebase) et génère le `.env` — voir
  [Installation](#installation)
- Inscription / connexion (email + mot de passe, Google) ; en environnement
  `dev`/`test`, bouton de connexion anonyme (Firebase Anonymous Auth)
- Fil public temps réel (onglets **Tout** / **Abonnements**), création et
  suppression de posts, profils avec bio et compteurs d'abonnés
- **Recherche d'utilisateurs** par nom (préfixe, insensible à la casse) avec
  boutons **Suivre / Ne plus suivre** et accès direct aux messages
- **Groupes publics ou privés** : création, adhésion libre (public) ou sur
  demande approuvée par le propriétaire (privé), fil de posts par groupe —
  le contenu d'un groupe privé n'est lisible que par ses membres (règles
  Firestore)
- **Messages privés** (DM) : conversations temps réel entre deux
  utilisateurs, liste des conversations triée par activité
- Signalement de contenus (`/api/report`)
- **Panneau d'admin** (`/admin`) : liste des comptes, promotion/rétrogradation
  d'admins (custom claims), bannissement (compte désactivé + sessions
  révoquées), modération des signalements, suppression de posts
- Règles Firestore verrouillées : les champs sensibles (`role`, `banned`) et
  les signalements ne sont modifiables que côté serveur

## Architecture

```
┌────────────┐   SDK Firebase (Auth + Firestore temps réel)
│  React SPA │ ─────────────────────────────► Firebase (Spark)
│  (Vite)    │                                      ▲
└─────┬──────┘                                      │ firebase-admin
      │ fetch /api/* + ID token                     │ (service account)
      ▼                                             │
┌─────────────────────┐                             │
│  Netlify Functions  │ ────────────────────────────┘
│  (rôles, ban, modo) │
└─────────────────────┘
```

- Le client parle **directement** à Firestore pour la lecture/écriture
  courante (posts, profils) — c'est ce qui donne le temps réel gratuit.
- Tout ce qui demande un privilège (custom claims, désactivation de compte,
  suppression forcée, lecture de la liste des comptes) passe par une Netlify
  Function qui vérifie l'ID token (`Authorization: Bearer …`) et le claim
  `admin`.

## Installation

### 0. Prérequis Google Cloud : activer l'API Firestore

Les Netlify Functions parlent à Firestore via `firebase-admin`, qui passe
par l'API Google Cloud. Il faut donc que la **Google Cloud Firestore API**
soit activée pour votre projet, sinon les fonctions échoueront avec une
erreur `PERMISSION_DENIED` :

1. Ouvrez [console.cloud.google.com](https://console.cloud.google.com) et
   sélectionnez le **même projet** que votre projet Firebase (ils sont
   liés : un projet Firebase *est* un projet Google Cloud).
2. **API et services → Bibliothèque**, recherchez
   **« Cloud Firestore API »** et cliquez sur **Activer**.
   (Lien direct : `https://console.cloud.google.com/apis/library/firestore.googleapis.com`.)

En général, créer la base Firestore depuis la console Firebase l'active
automatiquement — mais si vos fonctions renvoient une erreur d'API
désactivée, c'est ici que ça se règle.

### 1. Firebase (plan Spark)

1. Créez un projet sur [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication** → activez *Email/Mot de passe* et *Google*.
3. **Firestore Database** → créez la base (mode production).
4. Mettez en place les règles de sécurité — deux options :

   **Option A — sans aucune ligne de commande (recommandé)** : dans la
   console Firebase, ouvrez **Firestore Database → onglet Règles**, puis
   copiez-collez le contenu du fichier [`firestore.rules`](firestore.rules)
   de ce repo et cliquez sur **Publier**. C'est tout : pas besoin
   d'installer `firebase-tools` ni de taper la moindre commande.

   Pour les index composites (fil, groupes, abonnements, conversations),
   inutile de les créer à l'avance : la première fois qu'une requête
   tournera, Firestore affichera une erreur dans la console du navigateur
   contenant **un lien direct** — cliquez dessus, la console Firebase crée
   l'index toute seule. (La liste complète est dans
   [`firestore.indexes.json`](firestore.indexes.json) si vous préférez
   l'Option B.)

   **Option B — en ligne de commande** (si vous préférez) :
   ```bash
   npx firebase-tools deploy --only firestore
   ```
5. **Paramètres du projet → Vos applications** : créez une app Web et copiez
   la config dans les variables `VITE_FIREBASE_*` (l'assistant
   d'installation le fait pour vous, voir plus bas).
6. **Récupérez la clé du compte de service** — indispensable pour les
   Netlify Functions (admin, bannissement, modération) :
   1. Console Firebase → ⚙️ **Paramètres du projet** → onglet
      **Comptes de service** ;
   2. cliquez sur **Générer une nouvelle clé privée** → un fichier
      `.json` se télécharge ;
   3. ouvrez ce fichier et copiez son **contenu complet** (il commence
      par `{` et contient `"private_key"`) ;
   4. dans **Netlify → Site configuration → Environment variables**,
      créez la variable `FIREBASE_SERVICE_ACCOUNT` et collez ce JSON
      comme valeur (la version encodée en base64 est aussi acceptée).

   ⚠️ Ce JSON donne un accès administrateur complet à votre projet
   Firebase : ne le committez jamais dans le repo, il ne doit vivre que
   dans les variables d'environnement de Netlify (ou votre `.env` local,
   qui est ignoré par git).

### 2. Sur Netlify — avec l'assistant d'installation intégré

1. Importez le repo sur [app.netlify.com](https://app.netlify.com) — le
   `netlify.toml` configure build, publish et functions. Déployez tel quel,
   **sans déclarer aucune variable**.
2. Ouvrez le site : comme il n'est pas encore configuré, **l'assistant
   d'installation s'affiche automatiquement**. Il vous demande :
   - le **nom du site** ;
   - l'**environnement** (`test` / `dev` / `preprod` / `production`) —
     en dev/test, la page de connexion affichera en plus un bouton de
     **connexion anonyme** (pensez à activer le fournisseur « Anonyme »
     dans Firebase Authentication) ;
   - l'**email et le mot de passe de l'administrateur** ;
   - le bloc `const firebaseConfig = { … }` **copié-collé tel quel**
     depuis la console Firebase — l'assistant le parse pour vous.
3. L'assistant génère le fichier `.env` (téléchargement ou copie). Collez
   son contenu dans **Site configuration → Environment variables → Add a
   variable → Import from a .env file**, puis complétez
   `FIREBASE_SERVICE_ACCOUNT` **directement dans l'interface Netlify** :
   console Firebase → Paramètres → **Comptes de service** → **Générer une
   nouvelle clé privée**, ouvrez le fichier `.json` téléchargé et collez
   son **contenu complet** (il commence par `{`) comme valeur — pas
   l'email du compte de service ni le nom du fichier. La version base64
   du JSON est aussi acceptée. Terminez par **Deploys → Trigger deploy**.
4. Ajoutez le domaine Netlify dans **Firebase Auth → Domaines autorisés**.

### 3. Compte administrateur — sans commande console

Ouvrez simplement dans votre navigateur :

```text
https://VOTRE-SITE.netlify.app/api/bootstrap-admin
```

Le compte admin est créé à partir de `ADMIN_EMAIL` / `ADMIN_PASSWORD`
(l'appel est idempotent : si le compte existe déjà, il est promu admin sans
toucher au mot de passe). **Supprimez ensuite `ADMIN_PASSWORD`** des
variables d'environnement. Les admins suivants se gèrent depuis
`/admin/users`.

### 4. En local

```bash
npm install
npm run setup   # assistant en ligne de commande : écrit le fichier .env
npm run dev     # netlify dev : Vite + Functions sur http://localhost:8888
```

Puis ouvrez `http://localhost:8888/api/bootstrap-admin` pour créer l'admin.

## API (Netlify Functions)

| Route | Méthode | Accès | Rôle |
| --- | --- | --- | --- |
| `/api/report` | POST | connecté | Signaler un post/commentaire/utilisateur |
| `/api/admin/users` | GET | admin | Lister les comptes |
| `/api/admin/set-role` | POST | admin | Donner/retirer le rôle admin |
| `/api/admin/ban-user` | POST | admin | Bannir/débannir (désactive le compte) |
| `/api/admin/delete-post` | POST | admin | Supprimer un post + commentaires |
| `/api/bootstrap-admin` | GET/POST | env | Créer/promouvoir l'admin depuis `ADMIN_EMAIL`/`ADMIN_PASSWORD` |

## Dépannage des fonctions (`/api/*`)

Les fonctions renvoient leurs erreurs en JSON lisible. Les plus courantes :

| Erreur | Cause | Solution |
| --- | --- | --- |
| `FIREBASE_SERVICE_ACCOUNT est absente` / `n'est pas un JSON valide` | La variable ne contient pas le JSON du compte de service | Collez le **contenu complet** du fichier `.json` téléchargé (il commence par `{`), ou sa version base64 |
| `5 NOT_FOUND` | La base Firestore n'existe pas dans le projet | Console Firebase → **Firestore Database → Créer une base de données**. Si la base a un ID personnalisé (créée hors console Firebase), définissez `FIRESTORE_DATABASE_ID` |
| `7 PERMISSION_DENIED` | Cloud Firestore API désactivée | Activez-la (voir [Prérequis](#0-prérequis-google-cloud--activer-lapi-firestore)) |
| `Bootstrap désactivé` | `ADMIN_EMAIL` / `ADMIN_PASSWORD` absents | Renseignez-les dans les variables Netlify puis redéployez |

Après tout changement de variable d'environnement : **Deploys → Trigger
deploy** (les variables sont figées au moment du build/déploiement).

## Et les images ? (Firebase Storage)

Le squelette est volontairement **100 % texte** pour rester entièrement
gratuit. Si vous voulez des avatars et des images dans les posts :

- **Firebase Storage** est la solution naturelle (même SDK, mêmes règles de
  sécurité que Firestore), **mais** Google exige désormais le **forfait
  payant Blaze** (facturation à l'usage) pour activer Storage — il n'est
  plus inclus dans le plan gratuit Spark. Avec Blaze vous ne payez que la
  consommation réelle, ce qui reste très faible pour un petit site, mais il
  faut enregistrer une carte bancaire.
- Si vous tenez au **zéro paiement**, des alternatives avec un tier gratuit
  existent : Cloudinary, Supabase Storage, ImgBB… L'upload se fait alors
  depuis le client ou via une Netlify Function, et vous ne stockez dans
  Firestore que l'URL de l'image.

## Modèle de données (Firestore)

```
users/{uid}                    profil (displayName, displayNameLower, bio, role, banned)
users/{uid}/following/{uid2}   j'ai suivi uid2
users/{uid}/followers/{uid2}   uid2 me suit (miroir écrit par uid2)
posts/{postId}                 { authorId, authorName, text, groupId|null, createdAt }
posts/{postId}/comments/…      (règles prêtes, UI à faire)
groups/{gid}                   { name, description, visibility, ownerId }
groups/{gid}/members/{uid}     { uid, role: owner|member }
groups/{gid}/requests/{uid}    demandes d'adhésion (groupes privés)
dms/{uidA_uidB}                { participants, participantNames, lastMessage, updatedAt }
dms/{uidA_uidB}/messages/…     { senderId, text, createdAt }
reports/{id}                   signalements (écriture serveur uniquement)
```

## Pistes d'extension

- Commentaires sous les posts (règles Firestore déjà prêtes : `posts/*/comments`)
- Likes, notifications
- Avatars et images (voir section ci-dessus)
- Pagination infinie du fil, onglet Abonnements au-delà de 30 suivis

## Licence

[GPL-3.0](LICENSE) — toute redistribution, modifiée ou non, doit rester sous
la même licence.
