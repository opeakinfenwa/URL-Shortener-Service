![MIT License](https://img.shields.io/badge/license-MIT-green)

# URL Shortener Service

This project is a scalable and modular backend URL shortening system. It supports user authentication, short URL creation, and real time notifications via Socket.IO. The application is structured around clean architecture and modular domain separation.

## Architecture Overview

The system is composed of independently scoped modules:

* **User Module** – Manages user profiles, timestamps, and related metadata.
* **Auth Module** – Handles registration, login, secure password management, and JWT based authentication.
* **URL Module** – Allows authenticated and unauthenticated users to create, manage, and retrieve short URLs with usage analytics.

## Technology Stack

* **Node.js (v18+)**
* **NestJS Framework**
* **TypeORM** (with PostgreSQL)
* **Socket.IO** (for real time events)
* **Custom migration and seed CLI tools**

## Features by Module

### User Module

* User account creation and data persistence
* Tracks `created_at` and `updated_at`
* Supports association with shortened URLs

### Auth Module

* JWT based auth system with secure cookies
* Role based access control
* Registration, login, and token validation

### URL Module

* Authenticated and unauthenticated users can generate custom short URLs
* Tracks `clickCount` and metadata for analytics
* Emits real time event via Socket.IO upon URL creation (visible in console)
* Each authenticated user sees only their URLs
* Users can **claim previously created short URLs** (as unauthenticated users) upon signing up
* Rate limiting per IP to mitigate spamming and abuse

## Migration & Seed System

### Migrations

Custom CLI based migration system:

* `up/` and `down/` folders for applying and rolling back SQL files
* Supports both local file tracking and persistent DB history

```bash
npm run migrate     # Apply all up migrations
npm run rollback    # Revert the last migration
```

### Seeders

Handcrafted seeder with the ability to seed and undo test data:

```bash
npm run seed        # Populate test data
npm run seed:undo   # Undo last seeding
```

## Real Time Event Notification

When a new short URL is created, the server emits a `short_url_created` event via Socket.IO. This allows for optional frontend or service integration that can respond to URL creation instantly. For now, this is logged in the console.

## Engineering Highlights

* Modular domain separation (`user`, `auth`, `url`)
* TypeORM for ORM abstraction with PostgreSQL
* Raw SQL migration and seed control
* Reusable CLI tools for DB lifecycle management
* Socket.IO events for extensible UX or notification systems
* Rate limiting based on user IPs to control abuse

## Getting Started

### Environment Setup

Create a `.env` file with:

```env
PORT=...
DATABASE_URL=...
JWT_SECRET=your_jwt_secret
```

### Install & Run

```bash
npm install
npm run migrate
npm run seed
npm run start:dev
```

## Project Structure

```plaintext
src/
├── modules/
│   ├── user/
│   ├── auth/
│   └── url/
├── migrations/
│   ├── up/
│   ├── down/
│   └── migration-runner.ts
├── seeders/
│   ├── sql/
│   ├── undo/
│   └── seed-runner.ts
```

## Future Enhancements

* Add Swagger documentation
* Redis caching for high frequency routes
* Add unit/integration testing with Jest

## Acknowledgements

Built with NestJS and designed to demonstrate clear understanding of domain based modular design, event driven architecture, raw SQL based database operations, and robust migration/seeding strategies using handcrafted CLI tools.

## License

This project is licensed under the MIT License
