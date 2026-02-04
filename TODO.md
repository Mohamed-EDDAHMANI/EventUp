# EventUP – TODO Fonctionnel (Admin & Participant)

## Légende
- [ ] À faire
- [x] Déjà en place (référence)

---

## ADMIN

### Backend – Événements (déjà en place)
- [x] `POST /events` – Créer un événement (titre, description, date/heure, lieu, capacité)
- [x] `PATCH /events/:id` – Modifier un événement
- [x] `POST /events/:id/publish` – Publier un événement
- [x] `POST /events/:id/cancel` – Annuler un événement
- [x] `GET /events/admin/all` – Liste complète des événements (tous statuts)
- [x] `DELETE /events/:id` – Supprimer (brouillon uniquement)

### Backend – Réservations (admin)
- [x] `GET /reservations/admin` – Liste de toutes les réservations (avec filtres optionnels)
- [x] `GET /reservations/admin/by-event/:eventId` – Réservations par événement
- [x] `GET /reservations/admin/by-participant/:userId` – Réservations par participant
- [x] `POST /reservations/:id/admin/confirm` – Confirmer une réservation (PENDING → CONFIRMED) en tant qu’admin
- [x] `POST /reservations/:id/admin/refuse` – Refuser une réservation (PENDING → CANCELLED) ou statut REFUSED
- [x] `POST /reservations/:id/admin/cancel` – Annuler une réservation (même confirmée) par l’admin

### Backend – Indicateurs / Stats (admin)
- [x] `GET /admin/stats` – Indicateurs :
  - Nombre d’événements à venir
  - Taux de remplissage global (totalReserved / totalCapacity)
  - Répartition des réservations par statut (PENDING, CONFIRMED, CANCELLED)

### Frontend – Admin
- [x] Route `/admin` – Layout / dashboard réservé aux ADMIN (guard rôle)
- [x] Page **Créer un événement** – Formulaire (titre, description, date/heure, lieu, capacité max)
- [x] Page **Modifier un événement** – Formulaire pré-rempli (depuis liste admin)
- [x] Page **Liste des événements (admin)** – Tous les événements avec actions : modifier, publier, annuler, supprimer (si brouillon)
- [x] Page **Réservations** – Liste de toutes les réservations avec actions Confirmer / Refuser / Annuler
- [ ] (Optionnel) Page **Réservations par événement** – Filtre par événement
- [ ] (Optionnel) Page **Réservations par participant** – Filtre par participant
- [x] Actions sur une réservation : **Confirmer**, **Refuser**, **Annuler** (admin)
- [x] Dashboard admin – Indicateurs : événements à venir, taux de remplissage, répartition des réservations par statut

---

## PARTICIPANT

### Backend (déjà en place ou à compléter)
- [x] `GET /events` – Consulter la liste des événements publiés
- [x] `GET /events/:id` – Consulter le détail d’un événement
- [x] `POST /reservations` – Effectuer une réservation (si règles respectées)
- [x] `GET /reservations/me` – Consulter la liste de ses réservations
- [x] `POST /reservations/:id/cancel` – Annuler sa réservation (selon règles)
- [ ] `GET /reservations/:id/ticket` ou `GET /reservations/:id/confirmation.pdf` – Télécharger un ticket/confirmation PDF **uniquement si statut CONFIRMED**

### Frontend – Participant
- [x] Consulter la liste des événements publiés (accueil)
- [x] Consulter le détail d’un événement
- [x] Effectuer une réservation (si connecté et places dispo)
- [x] Consulter la liste de ses réservations (`/reservations`)
- [x] Annuler sa réservation
- [ ] **Télécharger ticket / confirmation PDF** – Bouton visible uniquement si la réservation est **confirmée** (dans « Mes réservations » ou page détail réservation)

---

## Récapitulatif par priorité

### Priorité 1 – Admin (backend)
1. GET réservations admin (liste, par événement, par participant)
2. Admin : confirmer / refuser / annuler une réservation
3. GET admin stats (événements à venir, taux remplissage, répartition par statut)

### Priorité 2 – Admin (frontend)
4. Layout et route `/admin` avec guard rôle
5. Pages CRUD événements (créer, modifier, liste admin)
6. Pages réservations admin (par événement, par participant) + actions confirmer/refuser/annuler
7. Dashboard admin avec indicateurs

### Priorité 3 – Participant
8. Backend : endpoint PDF ticket/confirmation (réservation confirmée uniquement)
9. Frontend : bouton « Télécharger ticket PDF » (affiché seulement si réservation confirmée)

---

## Notes techniques
- **Refuse** : traiter comme passage en CANCELLED ou ajouter un statut `REFUSED` selon le besoin métier.
- **PDF** : utiliser une librairie backend (ex. `pdfkit`, `puppeteer`, ou génération HTML→PDF) et renvoyer `Content-Disposition: attachment`.
- **Guard admin frontend** : rediriger vers `/login` ou `/` si `user.role !== 'ADMIN'` sur les routes `/admin/*`.
