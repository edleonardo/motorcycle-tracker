# 📁 Project Structure

```
motorcycle-tracker/
├── backend/                      # NestJS Backend
│   ├── src/
│   │   ├── common
│   │   │   └──interceptors       # Global Interceptors
│   │   │       ├── error-handling.interceptor.ts
│   │   │       ├── logging.interceptor.ts
│   │   │       └── trace-id.interceptor.ts
│   │   ├── controllers/          # REST API Controllers
│   │   │   ├── trip.controller.ts
│   │   │   └── trip.controller.spec.ts
│   │   ├── services/             # Business Logic
│   │   │   ├── trip.service.ts
│   │   │   ├── trip.service.spec.ts
│   │   │   ├── kafka-consumer.service.ts
│   │   │   └── kafka-producer.service.ts
│   │   ├── entities/             # TypeORM Entities
│   │   │   ├── trip.entity.ts
│   │   │   ├── ping.entity.ts
│   │   │   └── active-trip.entity.ts
│   │   ├── dto/                  # Data Transfer Objects
│   │   │   └── trip.dto.ts
│   │   ├── modules/              # Feature Modules
│   │   │   └── trip.module.ts
│   │   ├── app.module.ts         # Root Module
│   │   └── main.ts               # Application Entry Point
│   ├── test/                     # E2E Tests
│   │   ├── app.e2e-spec.ts
│   │   └── jest-e2e.json
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── .env.example
│
├── frontend/                     # Next.js Frontend
│   ├── app/                      # Next.js App Directory
│   │   ├── page.tsx              # Main Page
│   │   ├── layout.tsx            # Root Layout
│   │   └── globals.css           # Global Styles
│   ├── components/               # React Components
│   │   ├── TripList.tsx          # Trip List Component
│   │   ├── TripMap.tsx           # Map Visualization
│   │   ├── TripDetailModal.tsx   # Trip Details Visualization
│   │   └── PingSimulator.tsx     # Ping Simulator
│   ├── hooks/                    # React Hooks
│   │   ├── usePingSimulator.ts   # Ping Simulator Hook
│   │   ├── useTripMap.ts         # Trip Map Visualization Hook
│   │   └── useTrip.ts            # Trip List Hook
│   ├── lib/                      # Utilities
│   │   ├── api.ts                # API Client
│   │   ├── mapUtils.ts           # Utils for map feature
│   │   └── utils.ts              # Helper Functions
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
│
├── docker-compose.yml            # Docker Compose Configuration
├── postman_collection.json       # Postman API Collection
├── setup.sh                      # Setup Script
├── README.md                     # Main Documentation
└── PROJECT_STRUCTURE.md          # This File

```

## 🔑 Key Components

### Backend Architecture

#### Controllers

- **trip.controller.ts**: REST API endpoints for trip management
  - Ping ingestion (HTTP & Kafka)
  - Trip listing with pagination
  - Trip details retrieval
  - Motorcycle statistics

#### Global Interceptor

- **error-handling.interceptor.ts**: Global interceptor for send friendly errors.

- **logging.interceptor.ts**: Global logger to define a pattern for logs.
  - All requests/responses logged with:
    - Trace ID
    - HTTP method and path
    - Response time
    - File context (controller.method)

- **trace-id.interceptor.ts**: Global intecerpetor for generate a trace id, for all requests.
  - Unique identifier (`X-Trace-Id` header) for request tracking.

#### Services

- **trip.service.ts**: Core business logic
  - Ping processing
  - Trip detection and closure
  - Distance calculation
  - Statistical analysis

- **kafka-consumer.service.ts**: Event-driven ping consumption
  - Subscribes to Kafka topic
  - Processes pings asynchronously
  - Error handling and logging

- **kafka-producer.service.ts**: Event publication
  - Sends pings to Kafka
  - Message formatting
  - Connection management

#### Entities (Database Models)

- **trip.entity.ts**: Completed trips
- **ping.entity.ts**: Raw ping data
- **active-trip.entity.ts**: Ongoing trips

#### DTOs (Validation & Serialization)

- **PingDto**: Incoming ping validation
- **TripSummaryDto**: Trip list response
- **TripDetailDto**: Detailed trip response
- **PaginatedTripsDto**: Paginated response wrapper

### Frontend Architecture

#### Pages

- **page.tsx**: Main dashboard
  - Trip list view
  - Ping simulator
  - Filters
  - Trip details modal

#### Components

- **TripList**: Paginated trip listing with filters
- **TripMap**: Interactive Leaflet map with route visualization
- **PingSimulator**: Test data generator with HTTP/Kafka options

#### Libraries

- **api.ts**: Centralized API client using Axios
- **utils.ts**: Formatting utilities (date, distance, speed)

### Infrastructure

#### Docker Services

1. **PostgreSQL**: Primary database
2. **Kafka + Zookeeper**: Event streaming
3. **Backend**: NestJS application
4. **Frontend**: Next.js application

#### Configuration Files

- **docker-compose.yml**: Multi-container orchestration
- **Dockerfile** (backend): Multi-stage build for production
- **Dockerfile** (frontend): Optimized Next.js build
- **.env.example**: Environment template

## 🔄 Data Flow

### Ping Ingestion Flow

```
HTTP Request → Controller → Service → Database
                              ↓
                        Event Emitter

Kafka Message → Consumer → Service → Database
```

### Trip Detection Flow

```
Incoming Ping → Check Active Trip
                                    ↓
                            [Has Active Trip?]
                                    ↓
                    ┌──────────────┴──────────────┐
                    ↓                             ↓
                Update                        Create New
                Active Trip                   Active Trip
                    ↓
  [Idle Timeout? OR Is Already Stopped?]
                    ↓
                Close Trip
                    ↓
                Save to DB
```

### Frontend Data Flow

```
User Action → API Call → Backend
                          ↓
                      Response
                          ↓
                    State Update
                          ↓
                   UI Re-render
```

## 🧪 Testing Structure

### Backend Tests

- **Unit Tests**: `*.spec.ts` files next to source files
- **E2E Tests**: `/test/app.e2e-spec.ts`
- **Coverage**: Full service layer coverage

### Frontend Tests

- **Component Tests**: (Can be added in `__tests__` directories)
- **Integration Tests**: API integration tests

## 📊 Database Schema

### Tables

1. **trips**: Completed trip records
2. **pings**: Raw ping data
3. **active_trips**: Ongoing trip tracking

### Indexes

- `trips(licence_plate)`: Fast license plate lookup
- `trips(start_timestamp)`: Date-based queries
- `pings(trip_id)`: Trip-ping relationship
- `pings(licence_plate)`: Motorcycle-specific queries

## 🔌 API Endpoints

### Ping Ingestion

- `POST /api/trips/pings`: HTTP ping ingestion
- `POST /api/trips/pings/kafka`: Kafka ping ingestion

### Trip Management

- `GET /api/trips`: List trips (paginated)
- `GET /api/trips/:id`: Get trip details
- `GET /api/trips/stats/:licencePlate`: Get statistics

## 🎨 UI Components

### Main Dashboard

- Header with branding
- Ping simulator panel
- Filters panel
- Trip list with pagination
- Trip details modal with map

### Interactive Features

- Real-time ping simulation
- License plate filtering
- Date range filtering
- Click-to-view trip details
- Interactive map with route visualization

## 🚀 Deployment

### Development

```bash
./setup.sh
```

### Production

1. Update environment variables
2. Build Docker images
3. Deploy with Docker Compose or Kubernetes
4. Configure reverse proxy (nginx/traefik)
5. Set up SSL certificates
6. Configure monitoring and logging
