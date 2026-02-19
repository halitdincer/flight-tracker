# Flight Tracker

Full-stack flight tracking application with Rails API, React frontend, and GraphQL.

## Tech Stack

- **Backend:** Rails 7.2, Ruby 3.2
- **Frontend:** React 18, TypeScript, Vite
- **API:** GraphQL (graphql-ruby)
- **Database:** MySQL 8.0
- **Cache/Queue:** Redis 7
- **Background Jobs:** Sidekiq
- **Maps:** OpenLayers

## Features

- Live flight map with real-time data from OpenSky Network API
- Flight search by callsign and country
- Flight history tracking with position playback
- Analytics dashboard with charts
- Automatic data collection every 5 minutes

## Directory Structure

```
flight-tracker/
├── api/                    # Rails API application
├── web/                    # React frontend application
├── k8s/                    # Kubernetes manifests
│   ├── base/               # Base Kustomize resources
│   └── overlays/           # Environment-specific overlays
│       └── production/
└── .github/
    └── workflows/          # GitHub Actions CI/CD
```

## Development Setup

### Prerequisites

- Ruby 3.2+ (via rbenv)
- Node.js 20+
- MySQL 8.0
- Redis 7

### Quick Start (Docker)

```bash
# Start infrastructure (MySQL + Redis)
docker compose -f docker-compose.dev.yml up -d

# Install and run API
cd api
bundle install
rails db:create db:migrate
rails server

# In another terminal, install and run web
cd web
npm install
npm run dev
```

### Manual Setup

#### API (Rails)

```bash
cd api
bundle install
rails db:create db:migrate
rails server -p 3000
```

#### Worker (Sidekiq)

```bash
cd api
bundle exec sidekiq -C config/sidekiq.yml
```

#### Web (React)

```bash
cd web
npm install
npm run dev
```

### Access Points

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000/graphql
- **Sidekiq UI:** http://localhost:3000/sidekiq (development only)

## GraphQL API

### Example Queries

```graphql
# Get live flights
query {
  liveFlights {
    icao24
    callsign
    latitude
    longitude
    altitude
    heading
  }
}

# Search flights
query {
  flights(callsign: "UAL", limit: 10) {
    nodes {
      icao24
      callsign
      originCountry
      lastSeenAt
    }
    totalCount
  }
}

# Get flight history
query {
  flightHistory(icao24: "abc123") {
    latitude
    longitude
    altitude
    recordedAt
  }
}

# Get statistics
query {
  statistics(startDate: "2024-01-01", endDate: "2024-01-31") {
    date
    totalFlights
    uniqueAircraft
    flightsByCountry
  }
}
```

## Deployment

### Full Stack (Docker Compose)

```bash
docker compose up -d
```

### Kubernetes (K3s)

1. Create sealed secrets:
```bash
kubectl create secret generic mysql-secret \
  --dry-run=client -o yaml \
  --from-literal=root-password=<password> \
  | kubeseal --format yaml > k8s/overlays/production/mysql-sealed-secret.yaml

kubectl create secret generic api-secret \
  --dry-run=client -o yaml \
  --from-literal=SECRET_KEY_BASE=$(rails secret) \
  --from-literal=DATABASE_URL=mysql2://root:<password>@mysql:3306/flight_tracker_production \
  | kubeseal --format yaml > k8s/overlays/production/api-sealed-secret.yaml
```

2. Apply ArgoCD application:
```bash
kubectl apply -f k8s/argocd-app.yaml
```

### URLs

- **Production:** https://flights.halitdincer.com
- **API:** https://api.flights.halitdincer.com

## License

MIT
