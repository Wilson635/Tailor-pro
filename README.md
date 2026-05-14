# TailorPro - Application de Gestion pour Couturiers

Application mobile React Native / Expo pour la gestion de clients, commandes, mesures et catalogue pour les couturiers et tailleurs.

## Fonctionnalites

- **Tableau de bord**: Vue d'ensemble des revenus, clients, commandes et activites recentes
- **Gestion des clients**: Liste, ajout, modification et suppression de clients
- **Mesures**: Enregistrement des mesures corporelles des clients
- **Commandes**: Creation et suivi des commandes
- **Paiements**: Gestion des paiements et historique
- **Catalogue**: Galerie de modeles avec categories
- **Statistiques**: Graphiques de revenus et analyses

## Structure du projet

```
├── App.tsx                 # Point d'entree de l'application
├── src/
│   ├── components/         # Composants UI reutilisables
│   │   └── ui/            # Button, Card, Input, Avatar, etc.
│   ├── constants/          # Theme, couleurs, typographie
│   ├── navigation/         # Configuration de la navigation
│   ├── screens/            # Ecrans de l'application
│   │   ├── Dashboard/
│   │   ├── Clients/
│   │   ├── Measurements/
│   │   ├── Orders/
│   │   ├── Payments/
│   │   ├── Catalog/
│   │   └── Statistics/
│   ├── services/           # Services Firebase (non implementes)
│   │   └── firebase/
│   ├── store/              # Store Zustand
│   ├── types/              # Types TypeScript
│   └── utils/              # Fonctions utilitaires
├── .env.example            # Variables d'environnement exemple
└── app.json                # Configuration Expo
```

## Prerequisites

- Node.js >= 18
- npm ou yarn ou pnpm
- Expo CLI (`npm install -g expo-cli`)
- Expo Go sur votre telephone (iOS/Android) OU un emulateur

## Installation

### 1. Cloner le projet

```bash
git clone <votre-repo>
cd tailorpro
```

### 2. Installer les dependances

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configurer les variables d'environnement

Copiez le fichier `.env.example` vers `.env`:

```bash
cp .env.example .env
```

### 4. Configurer Firebase (optionnel)

Pour activer Firebase, vous devez:

1. Creer un projet Firebase sur https://console.firebase.google.com

2. Activer les services necessaires:
   - **Authentication**: Email/Password
   - **Firestore Database**: En mode production ou test
   - **Storage**: Pour les images

3. Recuperer les credentials Firebase:
   - Allez dans Project Settings > General
   - Scrollez jusqu'a "Your apps"
   - Cliquez sur l'icone Web (</>) pour ajouter une app web
   - Copiez les valeurs de configuration

4. Remplissez le fichier `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=votre_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=votre_projet
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

5. Decommentez les imports Firebase dans `App.tsx`:

```typescript
// Decommentez cette ligne:
import { initializeFirebase } from './src/services/firebase/config';

// Et dans useEffect:
await initializeFirebase();
```

### 5. Lancer l'application

```bash
# Demarrer le serveur de developpement
npx expo start

# Ou avec un tunnel (utile si vous etes sur un reseau different)
npx expo start --tunnel
```

### 6. Tester sur votre appareil

- **Expo Go (recommande)**: Scannez le QR code avec l'app Expo Go
- **Emulateur Android**: Appuyez sur `a` dans le terminal
- **Simulateur iOS**: Appuyez sur `i` dans le terminal

## Structure de la base de donnees Firebase

### Collections Firestore

```
users/
  └── {userId}/
      ├── name: string
      ├── email: string
      └── createdAt: timestamp

clients/
  └── {clientId}/
      ├── userId: string
      ├── name: string
      ├── phone: string
      ├── address: string
      ├── photo: string (URL)
      ├── isLoyal: boolean
      ├── totalOrders: number
      ├── totalSpent: number
      └── createdAt: timestamp

measurements/
  └── {measurementId}/
      ├── clientId: string
      ├── date: string
      ├── measurements: {
      │     tourPoitrine: number,
      │     tourTaille: number,
      │     tourHanches: number,
      │     ...
      │   }
      └── createdAt: timestamp

orders/
  └── {orderId}/
      ├── clientId: string
      ├── garmentType: string
      ├── fabric: string
      ├── deliveryDate: string
      ├── description: string
      ├── totalAmount: number
      ├── paidAmount: number
      ├── status: 'pending' | 'in_progress' | 'completed' | 'delivered'
      ├── paymentStatus: 'pending' | 'partial' | 'paid'
      ├── photos: string[]
      └── createdAt: timestamp

payments/
  └── {paymentId}/
      ├── orderId: string
      ├── clientId: string
      ├── amount: number
      ├── date: string
      ├── method: 'cash' | 'mobile_money' | 'bank_transfer' | 'card'
      └── notes: string

catalogModels/
  └── {modelId}/
      ├── name: string
      ├── category: string
      ├── price: number
      ├── description: string
      ├── images: string[]
      └── createdAt: timestamp
```

### Regles de securite Firestore (exemple)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Seuls les utilisateurs authentifies peuvent lire/ecrire
    match /clients/{clientId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }
    
    match /measurements/{measurementId} {
      allow read, write: if request.auth != null;
    }
    
    match /payments/{paymentId} {
      allow read, write: if request.auth != null;
    }
    
    match /catalogModels/{modelId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Scripts disponibles

```bash
# Demarrer le serveur de developpement
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios

# Lancer sur le web
npm run web

# Linter
npm run lint
```

## Technologies utilisees

- **React Native** - Framework mobile
- **Expo** - Plateforme de developpement
- **TypeScript** - Typage statique
- **React Navigation** - Navigation
- **Zustand** - Gestion d'etat
- **Firebase** (optionnel) - Backend as a Service
  - Authentication
  - Firestore
  - Storage
- **Expo Vector Icons** - Icones

## Mode Demo

L'application fonctionne en mode demo avec des donnees mockees. Pour activer le mode Firebase:

1. Configurez Firebase comme indique ci-dessus
2. Modifiez les services dans `src/services/firebase/` pour utiliser les vraies methodes Firebase au lieu de `TODO_IMPLEMENT`
3. Decommentez l'initialisation Firebase dans `App.tsx`

## Personnalisation

### Changer les couleurs

Editez `src/constants/theme.ts`:

```typescript
export const Colors = {
  primary: '#votre_couleur',
  // ...
};
```

### Ajouter de nouvelles mesures

Editez `src/types/index.ts` pour ajouter de nouveaux champs de mesures, puis mettez a jour `AddMeasurementsScreen.tsx`.

## Support

Pour toute question ou probleme, ouvrez une issue sur le repository.

## License

MIT
