📂 STRUCTURE JIRA : EVENT RESERVATION SYSTEM
EPIC 1 : Fondations Techniques & Industrialisation (INFRA)
Description : Mise en place de l'environnement de développement, de la CI/CD et de la conteneurisation.

Story 1 : Setup de l'architecture Docker et Environnement

Task : Initialisation du repo GitHub et liaison avec JIRA.

Task : Création du docker-compose.yml (PostgreSQL/MongoDB, NestJS, Next.js).

Sub-task : Configuration des fichiers .env.example.

Story 2 : Pipeline CI/CD (GitHub Actions)

Task : Configuration du workflow YAML pour le Back-end (Lint, Test, Build).

Task : Configuration du workflow YAML pour le Front-end (Lint, Test, Build).

Task : Automatisation du push d'images sur Docker Hub après succès du build.

EPIC 2 : Authentification & Sécurité (AUTH)
Description : Gestion des comptes utilisateurs et protection des accès selon les rôles.

Story 3 : Système d'Authentification JWT (Back-end)

Task : Développement du module Auth avec Passport.js et JWT.

Task : Mise en place du Hashage de mot de passe (Bcrypt).

Sub-task : Création des DTO de Login/Register.

Story 4 : Autorisations par Rôles (RBAC)

Task : Création d'un Decorator @Roles('ADMIN', 'PARTICIPANT').

Task : Implémentation d'un Guard global pour protéger les routes NestJS.

EPIC 3 : Gestion des Événements (EVENT)
Description : Cycle de vie des événements (Admin) et consultation (Public).

Story 5 : CRUD Événements (Back-end)

Task : Création du module Event (Entity/Schema, Controller, Service).

Task : Logique de statut (DRAFT, PUBLISHED, CANCELED).

Sub-task : Validation des données avec class-validator (date, capacité).

Story 6 : Catalogue des Événements (Front-end - SSR)

Task : Page d'accueil avec liste des événements PUBLISHED (Next.js SSR).

Task : Page détail de l'événement (/events/[id]) via Dynamic Routes.

EPIC 4 : Système de Réservation (RES)
Description : Processus d'inscription et gestion des places.

Story 7 : Logique Métier de Réservation (Back-end)

Task : Création du module Reservation (Statuts: PENDING, CONFIRMED, etc.).

Task : Implémentation des règles de gestion (Vérification capacité, doublons).

Sub-task : Route pour l'Admin pour Confirmer/Refuser.

Story 8 : Espace Participant (Front-end - CSR)

Task : Dashboard "Mes Réservations" (Redux ou Context API).

Task : Formulaire de demande de réservation avec retour d'erreur visuel.

EPIC 5 : Génération de Documents (DOC)
Description : Production des confirmations en format PDF.

Story 9 : Service de génération PDF

Task : Intégration d'une librairie PDF (ex: PDFKit ou Puppeteer) sur le Back-end.

Task : Route sécurisée de téléchargement (vérification du statut CONFIRMED).

EPIC 6 : Qualité & Tests (QA)
Description : Validation du bon fonctionnement de l'application.

Story 10 : Tests Automatisés

Task : Tests unitaires Jest sur les services critiques (Booking Logic).

Task : Tests E2E pour le flux "Connexion -> Réservation -> Confirmation".

Task : Tests de composants React (React Testing Library).

🛠 Automatisation JIRA conseillée
Pour respecter votre consigne d'automatisation :

Trigger : "When a Pull Request is merged"

Condition : "If status is In Progress"

Action : "Transition issue to Done"
