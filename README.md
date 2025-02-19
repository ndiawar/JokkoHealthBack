# JokkoHealthBackEnd

JokkoHealthBackEnd est une application backend conçue pour gérer les opérations liées à la santé. Ce projet utilise une architecture modulaire pour faciliter la maintenance et l'évolutivité, en intégrant une solution IoT pour surveiller les patients à distance via des capteurs biométriques.

### 1. Description du projet

JokkoHealthBackEnd répond à un besoin urgent au Sénégal, où l'accès aux soins médicaux est limité, en particulier dans les zones rurales. Le manque de médecins spécialistes, combiné à une distance importante entre les patients et les hôpitaux, conduit à des délais critiques dans les situations d'urgence. En réponse à cela, ce projet utilise un bracelet connecté médical permettant de surveiller en temps réel des paramètres vitaux tels que le rythme cardiaque, la température corporelle, et la détection des chutes.

Le projet s'inscrit dans le cadre du **Plan Stratégique de la Santé Digitale 2018-2023** du Sénégal, visant à intégrer les technologies de l'information et de la communication dans le secteur de la santé.

### 2. Contexte et Problématique

Les populations vulnérables (personnes âgées, personnes à mobilité réduite) risquent des complications graves en raison de la lenteur de l'accès aux soins. Une solution IoT connectée permettrait de surveiller à distance la santé des patients et d'envoyer des alertes automatiques en cas d'anomalie.

### 3. Objectifs

- Développer un système de surveillance médicale à distance fiable et sécurisé.
- Offrir un suivi en temps réel des constantes vitales des patients.
- Mettre en place une plateforme de communication entre patients et médecins.
- Automatiser l'envoi d'alertes en cas d'anomalie.
- Assurer la centralisation et la protection des données médicales.

### 4. Fonctionnalités

#### 4.0 Super Administrateur
- Surveillance de l'activité de la plateforme.
- Analyse des données, rapports et statistiques d'utilisation.

#### 4.1 Fonctionnalités côté Patients
- Surveillance continue des constantes vitales (rythme cardiaque, température, SpO2, pression artérielle).
- Envoi automatique d'alertes aux services hospitaliers, médecins ou proches.
- Tableau de bord personnel avec visualisation des données et historiques.
- Communication en temps réel avec les médecins via chat.
- Gestion des rendez-vous et accès au dossier médical.
- Géolocalisation en cas d'urgence.

#### 4.2 Fonctionnalités côté Médecins
- Accès à la liste des patients sous surveillance et gestion des urgences.
- Visualisation des données vitales en temps réel.
- Communication avec les patients (chat, fichiers, etc.).
- Prescription électronique et gestion des consultations.
- Partage d'informations avec d'autres médecins pour une meilleure coordination.

#### 4.3 Fonctionnalités de la plateforme de chat
- Chat en temps réel entre médecins et patients.
- Historique des conversations pour un suivi précis.
- Notifications personnalisées pour chaque message.
- Priorisation des conversations en fonction de l'urgence.

### 5. Compétences visées

- Conception d'un système IoT pour la collecte et la transmission des données médicales.
- Développement d'une application web et mobile pour l'interface utilisateur.
- Intégration des capteurs biométriques avec un système embarqué.
- Implémentation de WebSockets pour la communication en temps réel.
- Gestion de bases de données relationnelles et non relationnelles.
- Sécurisation des données médicales.

### 6. Outils et technologies

#### Matériel :
- ESP 32
- Capteur de pouls (MAX30102)
- Capteur de température
- Accéléromètre et gyroscope
- Module WiFi

#### Software :
- Node.js pour le backend
- React.js pour le frontend
- MongoDB et MySQL pour la base de données
- WebSockets pour la communication en temps réel

### 7. Résultats attendus

- Un système IoT fonctionnel avec la collecte et transmission des données vitales.
- Une interface utilisateur intuitive et réactive.
- Communication fluide entre patients et médecins.
- Base de données sécurisée et centralisée.
- Déploiement sur un serveur ou cloud pour une accessibilité continue.

### 8. Perspectives Futures

Une évolution future du projet pourrait intégrer un robot de téléprésence permettant aux médecins d'interagir avec leurs patients à distance. Ce robot serait équipé de capteurs avancés pour une consultation immersive.

## Installation

1. Clonez le dépôt :


## Structure du projet

Le projet est organisé comme suit :


```
JokkoHealthBackEnd
├── src
│   ├── config               # Configuration de l'application
│   ├── controllers          # Logique de contrôle pour les routes
│   ├── middlewares          # Middleware pour la gestion des requêtes
│   ├── models               # Modèles de données
│   ├── routes               # Définition des routes de l'application
│   ├── services             # Logique métier et services
│   ├── utils                # Utilitaires et helpers
│   ├── templates            # Modèles d'e-mails et PDF
│   ├── locales              # Fichiers de localisation
│   ├── jobs                 # Tâches planifiées
│   └── docs                 # Documentation de l'API
├── tests                    # Tests unitaires, d'intégration et E2E
├── scripts                  # Scripts pour le déploiement et la gestion
├── logs                     # Logs de l'application
├── public                   # Ressources publiques
├── .github                  # Workflows GitHub Actions
├── .vscode                  # Configuration de l'environnement de développement
├── .env                     # Variables d'environnement
├── .env.example             # Exemple de variables d'environnement
├── .eslintrc.js             # Configuration ESLint
├── .prettierrc              # Configuration Prettier
├── .gitignore               # Fichiers à ignorer par Git
├── jest.config.js           # Configuration Jest
├── nodemon.json             # Configuration Nodemon
├── package.json             # Dépendances et scripts du projet
├── README.md                # Documentation du projet
└── docker-compose.yml       # Configuration Docker Compose
```

## Installation

1. Clonez le dépôt :
   ```
   git clone https://github.com/votre-utilisateur/JokkoHealthBackEnd.git
   ```

2. Accédez au répertoire du projet :
   ```
   cd JokkoHealthBackEnd
   ```

3. Installez les dépendances :
   ```
   npm install
   ```

4. Configurez les variables d'environnement dans le fichier `.env`.

## Utilisation

Pour démarrer l'application, utilisez la commande suivante :
```
npm start
```

## Tests

Pour exécuter les tests, utilisez la commande suivante :
```
npm test
```

## Contribuer

Les contributions sont les bienvenues ! Veuillez soumettre une demande de tirage (pull request) pour toute amélioration ou correction.

## License

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.