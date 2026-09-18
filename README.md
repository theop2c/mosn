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

- Inscription / connexion (email + mot de passe, Google)
- Fil public temps réel, création/suppression de posts, profils avec bio
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

   Pour l'index composite (profil : posts d'un auteur triés par date),
   inutile de le créer à l'avance : la première fois que la requête
   tournera, Firestore affichera une erreur dans la console du navigateur
   contenant **un lien direct** — cliquez dessus, la console Firebase crée
   l'index toute seule.

   **Option B — en ligne de commande** (si vous préférez) :
   ```bash
   npx firebase-tools deploy --only firestore
   ```
5. **Paramètres du projet → Vos applications** : créez une app Web et copiez
   la config dans les variables `VITE_FIREBASE_*`.
6. **Paramètres → Comptes de service → Générer une clé privée** : copiez le
   JSON (sur une ligne) dans `FIREBASE_SERVICE_ACCOUNT`.

### 2. En local

```bash
cp .env.example .env   # puis remplissez les valeurs
npm install
npm run dev            # netlify dev : Vite + Functions sur http://localhost:8888
```

### 3. Sur Netlify

1. Importez le repo sur [app.netlify.com](https://app.netlify.com) — le
   `netlify.toml` configure build, publish et functions.
2. Déclarez les variables d'environnement (`VITE_FIREBASE_*`,
   `FIREBASE_SERVICE_ACCOUNT`, `ADMIN_BOOTSTRAP_SECRET`).
3. Ajoutez le domaine Netlify dans **Firebase Auth → Domaines autorisés**.

### 4. Premier admin

Créez votre compte via l'UI, puis :

```bash
curl -X POST https://VOTRE-SITE.netlify.app/api/bootstrap-admin -H "content-type: application/json" -d "{\"secret\":\"VOTRE_ADMIN_BOOTSTRAP_SECRET\",\"email\":\"vous@exemple.com\"}"
```

Déconnectez/reconnectez-vous pour rafraîchir le token, puis **supprimez
`ADMIN_BOOTSTRAP_SECRET`** des variables d'environnement. Les admins
suivants se gèrent depuis `/admin/users`.

## API (Netlify Functions)

| Route | Méthode | Accès | Rôle |
| --- | --- | --- | --- |
| `/api/report` | POST | connecté | Signaler un post/commentaire/utilisateur |
| `/api/admin/users` | GET | admin | Lister les comptes |
| `/api/admin/set-role` | POST | admin | Donner/retirer le rôle admin |
| `/api/admin/ban-user` | POST | admin | Bannir/débannir (désactive le compte) |
| `/api/admin/delete-post` | POST | admin | Supprimer un post + commentaires |
| `/api/bootstrap-admin` | POST | secret env | Promouvoir le premier admin |

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

## Pistes d'extension

- Commentaires sous les posts (règles Firestore déjà prêtes : `posts/*/comments`)
- Likes, follows, DM
- Avatars et images (voir section ci-dessus)
- Pagination infinie du fil

## Licence

[GPL-3.0](LICENSE) — toute redistribution, modifiée ou non, doit rester sous
la même licence.
