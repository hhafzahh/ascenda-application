# Ascenda Hotel Booking Platform

A microservices-based hotel booking application. A React (Vite) frontend talks to three independent Node.js/Express services — user, hotel, and booking — backed by MongoDB, with Stripe handling payments.

## Architecture

| Service | Path | Port | Responsibilities |
|---|---|---|---|
| User service | `backend/userservice` | `3004` | Auth, JWT, user profiles |
| Hotel service | `backend/hotelservice` | `3001` | Hotel search/proxy data |
| Booking service | `backend/bookingservice` | `3002` | Bookings, Stripe payments |
| Frontend | `frontend` | `5173` | React + Vite UI |

Each backend service is independent, with its own `package.json`, `Dockerfile`, and `.env` file.

## Prerequisites

- Node.js (v18+) and npm
- A MongoDB connection string (e.g. MongoDB Atlas)
- A Stripe secret key (for the booking service's payment flow)
- Docker & Docker Compose (optional, for containerized setup)

## Environment Setup

### Backend

Each service needs its own `.env` file.

**User service** — `backend/userservice/.env`
```
MONGODB_CONNECTIONSTR=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hotelbookingdb?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRY=1d
```

**Booking service** — `backend/bookingservice/.env`
```
MONGODB_CONNECTIONSTR=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hotelbookingdb?retryWrites=true&w=majority&appName=Cluster0
STRIPE_SECRET_KEY=<your-stripe-secret-key>
```

**Hotel service** — `backend/hotelservice/.env`
No required environment variables by default; add one if you need to override the default port (`3001`).

Install dependencies for each service:
```
cd backend/userservice && npm install
cd backend/bookingservice && npm install
cd backend/hotelservice && npm install
```

### Frontend

```
cd frontend
npm install
```

## Running the App

### Option A — run services individually

Start each backend service in its own terminal:
```
cd backend/userservice && npm start
cd backend/bookingservice && npm start
cd backend/hotelservice && npm start
```

Then start the frontend:
```
cd frontend
npm start
```

The app will be available at http://localhost:5173.

### Option B — run with Docker Compose

Create a `.env` file in the project root with the variables referenced in `docker-compose.yaml`:
```
MONGODB_CONNECTIONSTR=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hotelbookingdb?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRY=1d
STRIPE_SECRET_KEY=<your-stripe-secret-key>
```

Then from the project root:
```
docker compose up --build
```

This builds and starts all four services (user, booking, hotel, frontend) together.

## Testing

Each backend service and the frontend use Jest:
```
npm test
```
(run inside `backend/userservice`, `backend/bookingservice`, `backend/hotelservice`, or `frontend`)

Additional test types:
- **E2E (booking service):** `npm run test:e2e` — in `backend/bookingservice`
- **Fuzz testing (user/hotel services):** `npm run test:fuzz`, or `npm run test:fuzz:24h` for a long-running 24-hour run — in `backend/userservice` or `backend/hotelservice`
- **End-to-end UI (Cypress):** from `frontend`, run `npx cypress open` (or `npx cypress run` headless)
