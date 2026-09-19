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
  suppression de posts, profils avec bio et compteurs d'abonnés, avatars
  générés (initiale + couleur stable, aucun upload nécessaire)
- **Commentaires** sous les posts (repliables, temps réel, suppression par
  l'auteur ou un admin) et **réactions emoji** (👍 ❤️ 😂 🎉 😮 😢 — une
  réaction par utilisateur, compteurs temps réel)
- **Réglages d'affichage admin** : fil visible ou non sans connexion
  (appliqué aussi par les règles Firestore), pagination 10/20/50/100 —
  choisis à l'installation, modifiables dans `/admin/settings`
- **Recherche d'utilisateurs** par nom (préfixe, insensible à la casse) avec
  boutons **Suivre / Ne plus suivre** et accès direct aux messages
- **Groupes publics ou privés** : création, adhésion libre (public) ou sur
  demande approuvée par le propriétaire (privé), fil de posts par groupe —
  le contenu d'un groupe privé n'est lisible que par ses membres (règles
  Firestore). Onglet **Infos** (date de création, nombre de membres, accès
  non modifiable) et **invitation de membres** par le propriétaire via
  recherche par nom
- **Messages privés** (DM) : conversations temps réel entre deux
  utilisateurs, liste des conversations triée par activité
- Signalement de contenus (`/api/report`)
- **Smileys dans les posts** : sélecteur d'emojis intégré au composer
  (insertion au curseur, aucune dépendance externe)
- **Hébergement d'images optionnel** (Firebase Storage, plan Blaze) :
  activable par un admin pendant l'installation ou depuis
  `/admin/settings`, sans redéploiement — jusqu'à **3 images par post**
  (PNG/JPEG, 5 Mo max chacune, validées côté client et par les règles
  Storage)
- **Invitations par email** : l'admin saisit une adresse, Firebase envoie
  lui-même le lien (gratuit, aucun service d'emailing tiers) ; l'invité
  clique, est connecté automatiquement, choisit son nom et crée son mot de
  passe — suivi des invitations (envoyée/acceptée) dans l'admin
- **10 designs au choix** : une panoplie de 10 feuilles de style
  (`src/styles/themes/`) — Indigo, Océan, Forêt, Coucher de soleil, Rose,
  Minuit, Papier, Mono, Violet, Agrumes. L'admin choisit le design dans
  `/admin/settings` ; il s'applique **immédiatement à tous les visiteurs**,
  sans redéploiement (stocké dans Firestore, `settings/app.theme`)
- **7 langues au choix** : un fichier de labels par langue (`src/i18n/`) —
  français, anglais, espagnol, chinois mandarin, portugais, japonais,
  coréen. Même mécanique que les designs : l'admin choisit la langue dans
  `/admin/settings`, appliquée **immédiatement à tous les visiteurs**
  (`settings/app.language`)
- **Panneau d'admin** (`/admin`) : liste des comptes, invitations,
  promotion/rétrogradation d'admins (custom claims), bannissement (compte
  désactivé + sessions révoquées), modération des signalements, suppression
  de posts, paramètres du site (design + hébergement d'images)
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

### 1. Prérequis — préparer le projet Firebase (plan Spark, gratuit)

Tout se fait dans la console Firebase, **sans aucune ligne de commande**.
Dans l'ordre :

1. **Créer le projet Firebase** :
   [console.firebase.google.com](https://console.firebase.google.com) →
   **Ajouter un projet**.
2. **Créer une app Web** : ⚙️ **Paramètres du projet → Vos applications →
   bouton `</>` (Web)**. C'est cette app qui fournit le bloc
   `const firebaseConfig = { … }` que l'assistant d'installation vous
   demandera de coller tel quel.
3. **Créer la base de données Firestore** : **Build → Firestore Database →
   Créer une base de données** (mode production). ⚠️ Étape obligatoire :
   sans base, les fonctions `/api/*` renvoient l'erreur `5 NOT_FOUND`.

   > **Prérequis Google Cloud associé** : les Netlify Functions passent par
   > la **Cloud Firestore API** de Google Cloud. Créer la base depuis la
   > console Firebase l'active normalement tout seul ; si vos fonctions
   > renvoient `PERMISSION_DENIED`, activez-la manuellement sur
   > [console.cloud.google.com](https://console.cloud.google.com/apis/library/firestore.googleapis.com)
   > (même projet que Firebase — un projet Firebase *est* un projet Google
   > Cloud) : **API et services → Bibliothèque → « Cloud Firestore API » →
   > Activer**.
4. **Activer les fournisseurs d'authentification** : **Build →
   Authentication → Méthodes de connexion** :
   - **E-mail/Mot de passe** — obligatoire (inscriptions + compte admin).
     Dans le même panneau, activez aussi **« Lien e-mail (connexion sans
     mot de passe) »** si vous voulez utiliser les **invitations par
     email** depuis l'admin ;
   - **Google** — connexion en un clic ;
   - **Anonyme** — recommandé pour les environnements `dev`/`test` : la
     page de connexion y affiche un bouton de connexion anonyme.
5. **Firebase Storage : ne l'activez PAS maintenant.** L'hébergement
   d'images est optionnel et nécessite le forfait payant **Blaze**. Vous
   pourrez l'activer **pendant l'installation** (case à cocher de
   l'assistant) ou **à tout moment après**, depuis le panneau
   d'administration (`/admin/settings`) — voir
   [Et les images ?](#et-les-images--firebase-storage).
6. Mettez en place les règles de sécurité — deux options :

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
7. **Récupérez la clé du compte de service** — indispensable pour les
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
   - le **design du site** (parmi les 10) et sa **langue** (parmi les 7) —
     l'assistant lui-même a un sélecteur de langue dans son en-tête, et la
     langue choisie devient celle du site ;
   - l'**affichage des posts sans connexion** (oui/non) et la
     **pagination** (10/20/50/100 posts par page) ;
   - l'activation ou non de l'**hébergement d'images** (Firebase Storage,
     plan Blaze requis — laissez décoché si vous n'êtes pas prêt, un admin
     pourra l'activer plus tard depuis `/admin/settings`) ;
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
4. **Autorisez le domaine Netlify dans Firebase Auth** — indispensable,
   sinon la connexion Google (et les autres méthodes par popup/redirect)
   échoue avec l'erreur `auth/unauthorized-domain` :
   console Firebase → **Authentication → onglet Settings (Paramètres) →
   Domaines autorisés → Ajouter un domaine**, puis saisissez le domaine de
   votre site Netlify (ex. `mosn-dev.netlify.app`, sans `https://`).
   Si vous ajoutez plus tard un domaine personnalisé sur Netlify,
   ajoutez-le ici aussi.

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

## Invitations par email

Depuis **Admin → Invitations** (`/admin/invites`), un admin saisit une
adresse email et clique sur **Inviter** :

1. **Firebase envoie lui-même l'email** (lien de connexion) — gratuit,
   inclus dans le plan Spark, aucun service d'emailing tiers à configurer.
2. L'invité clique sur le lien et atterrit sur `/invite` : il est
   **connecté automatiquement** (le lien fait office d'authentification).
3. Il choisit son **nom affiché** et **crée son mot de passe**, puis est
   redirigé vers le fil — il pourra ensuite se reconnecter classiquement
   par email + mot de passe.

Le suivi (envoyée / acceptée ✓) s'affiche dans l'onglet Invitations.

**Prérequis (une fois)** : console Firebase → **Authentication → Sign-in
method → E-mail/Mot de passe** → activer aussi **« Lien e-mail (connexion
sans mot de passe) »**. Le domaine Netlify doit être dans les domaines
autorisés (déjà fait à l'installation).

## Dépannage des fonctions (`/api/*`)

Les fonctions renvoient leurs erreurs en JSON lisible. Les plus courantes :

| Erreur | Cause | Solution |
| --- | --- | --- |
| `FIREBASE_SERVICE_ACCOUNT est absente` / `n'est pas un JSON valide` | La variable ne contient pas le JSON du compte de service | Collez le **contenu complet** du fichier `.json` téléchargé (il commence par `{`), ou sa version base64 |
| `5 NOT_FOUND` | La base Firestore n'existe pas dans le projet | Console Firebase → **Firestore Database → Créer une base de données**. Si la base a un ID personnalisé (créée hors console Firebase), définissez `FIRESTORE_DATABASE_ID` |
| `7 PERMISSION_DENIED` (« API has not been used / disabled ») | Cloud Firestore API désactivée | Activez-la sur console.cloud.google.com (sélecteur de projet = votre projet Firebase) |
| `7 PERMISSION_DENIED` (« Missing or insufficient permissions ») | Le compte de service n'a pas les droits Firestore : clé d'un **autre projet**, ou compte `firebase-adminsdk` **sans rôle Datastore** (provisioning incomplet — il n'a alors que les rôles Authentication/Storage) | Vérifiez `project_id` dans le JSON. Puis [IAM](https://console.cloud.google.com/iam-admin/iam) → ✏️ sur `firebase-adminsdk-…` → **+ Ajouter un rôle** → **« Utilisateur Cloud Datastore »** → Enregistrer, attendez 1-2 min et réessayez (pas de redéploiement nécessaire) |
| `Bootstrap désactivé` | `ADMIN_EMAIL` / `ADMIN_PASSWORD` absents | Renseignez-les dans les variables Netlify puis redéployez |
| `auth/unauthorized-domain` (côté site, à la connexion Google) | Domaine Netlify non autorisé dans Firebase Auth | **Authentication → Settings → Domaines autorisés → Ajouter un domaine** (ex. `mosn-dev.netlify.app`) |
| `auth/operation-not-allowed` (côté site, à la connexion) | Le fournisseur utilisé n'est pas activé (le compte admin, lui, a pu être créé par le SDK admin) | **Authentication → Sign-in method** → activez **E-mail/Mot de passe** (et Google, Anonyme si besoin) |
| `auth/invalid-credential` avec les identifiants admin | Le compte existait déjà avec un autre mot de passe (`bootstrap-admin` répond `"created":false` et ne modifie pas le mot de passe) | Ouvrez `/api/bootstrap-admin?reset=1` pour forcer le mot de passe à la valeur de `ADMIN_PASSWORD`, ou utilisez « Mot de passe oublié ? » sur la page de connexion |
| `auth/operation-not-allowed` à l'envoi d'une invitation | « Lien e-mail (connexion sans mot de passe) » désactivé | **Authentication → Sign-in method → E-mail/Mot de passe** → activez le lien e-mail |

Après tout changement de variable d'environnement : **Deploys → Trigger
deploy** (les variables sont figées au moment du build/déploiement).

## Et les images ? (Firebase Storage)

Par défaut le squelette est **100 % texte** pour rester entièrement
gratuit. L'**hébergement d'images est intégré mais désactivé** : quand un
admin l'active, les utilisateurs peuvent joindre une image à leurs posts
(upload vers Firebase Storage, affichage dans le fil et les groupes).

**Pourquoi désactivé par défaut ?** Google exige désormais le **forfait
payant Blaze** (facturation à l'usage) pour activer Storage — il n'est plus
inclus dans le plan gratuit Spark. Avec Blaze vous ne payez que la
consommation réelle (très faible pour un petit site), mais il faut
enregistrer une carte bancaire.

**Pour l'activer** (pendant l'installation via la case à cocher de
l'assistant, ou après coup — le réglage vit dans Firestore,
`settings/app`, et s'applique immédiatement, sans redéploiement) :

1. Console Firebase → passez le projet au **forfait Blaze** (⚙️ en bas à
   gauche de la console).
2. **Build → Storage → Commencer** pour créer le bucket.
3. Onglet **Règles** de Storage : copiez-collez le contenu du fichier
   [`storage.rules`](storage.rules) du repo → **Publier**.
4. Dans MOSN : **Admin → Paramètres** (`/admin/settings`) → cochez
   **Hébergement d'images**. (Si vous l'aviez coché dans l'assistant
   d'installation, `/api/bootstrap-admin` l'a déjà activé pour vous.)

Vous pouvez le désactiver à tout moment au même endroit. Si vous tenez au
**zéro paiement**, des alternatives avec un tier gratuit existent
(Cloudinary, Supabase Storage, ImgBB…) : l'upload se fait alors côté
client ou via une Netlify Function, et vous ne stockez dans Firestore que
l'URL de l'image.

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
