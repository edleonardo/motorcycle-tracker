# 🏍️ Motorcycle Trip Tracker

A full-stack application for tracking motorcycle trips based on GPS pings with real-time visualization and event-driven architecture.

## 🌟 Features

### Core Features

- ✅ **Ping Ingestion**: HTTP API and Kafka-based event ingestion
- ✅ **Trip Detection**: Automatic trip start/end based on movement and idle time
- ✅ **Paginated Trip Listing**: Browse trips with filters (license plate, date range)
- ✅ **Trip Details**: View complete trip information including all pings
- ✅ **Real-time Visualization**: Interactive map with route visualization

### Bonus Features

- ✅ **Interactive Web UI**: React/Next.js dashboard with real-time updates
- ✅ **Event-Driven Architecture**: Kafka integration for scalable ping ingestion
- ✅ **Trip Visualization**: Leaflet maps with route polylines and markers
- ✅ **Ping Simulator**: Built-in tool to generate test data
- ✅ **Docker Support**: Complete containerized setup
- ✅ **Automated Tests**: Unit and E2E test coverage

## 🏗️ Architecture

### Backend (NestJS)

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Event Streaming**: Kafka for async ping processing
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest (unit) + Supertest (E2E)

### Frontend (Next.js)

- **Framework**: Next.js 14 with React 18
- **Styling**: Tailwind CSS
- **Maps**: Leaflet with React-Leaflet
- **State Management**: React Hooks
- **API Client**: Axios

### Infrastructure

- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 16
- **Message Broker**: Apache Kafka
- **Orchestration**: Docker Compose for local development

## 📊 Trip Logic

### When a Trip Starts

- Motorcycle starts moving (speed > 5 km/h)
- First ping with significant movement

### When a Trip Ends

- Motorcycle idle for > 5 minutes (300 seconds)
- Speed < 5 km/h for extended period

### Distance Calculation

- **Primary**: Odometer readings (most accurate)
- **Fallback**: Haversine formula for GPS coordinates

### Minimum Trip Duration

- 60 seconds minimum to count as valid trip
- Filters out brief stops/movements

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Git

### Using Docker (Recommended)

1. **Clone the repository**

```bash
git clone <repository-url>
cd motorcycle-tracker
```

2. **Start all services**

```bash
docker-compose up -d
```

3. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs

4. **Stop services**

```bash
docker-compose down
```

### Local Development

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL and Kafka
docker-compose up -d postgres kafka zookeeper

# Run migrations (auto-sync enabled in dev)
npm run start:dev

# Run tests
npm test
npm run test:e2e
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test
```

## 📡 API Endpoints

### Ping Ingestion

**HTTP Ingestion**

```bash
POST /api/trips/pings
Content-Type: application/json

{
  "licencePlate": "ABC-1234",
  "timestamp": 1706400000,
  "latitude": -23.5505,
  "longitude": -46.6333,
  "speed": 45.5,
  "odometer": 12345.67
}
```

**Kafka Ingestion**

```bash
POST /api/trips/pings/kafka
# Same payload as HTTP, sends to Kafka topic
```

### Trip Management

**List Trips**

```bash
GET /api/trips?page=1&pageSize=10&licencePlate=ABC-1234&startFrom=1706400000&startTo=1706500000
```

**Get Trip Details**

```bash
GET /api/trips/:id
```

**Get Motorcycle Statistics**

```bash
GET /api/trips/stats/:licencePlate
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Unit tests
npm test

# Unit tests with coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Watch mode
npm run test:watch
```

## 📦 Database Schema

### Trips Table

- **id**: Primary key
- **licence_plate**: Motorcycle identifier
- **start_timestamp**: Trip start (UNIX)
- **end_timestamp**: Trip end (UNIX)
- **start_latitude/longitude**: Starting coordinates
- **end_latitude/longitude**: Ending coordinates
- **total_distance**: Distance in km (from odometer)
- **duration_seconds**: Trip duration
- **avg_speed**: Average speed in km/h
- **max_speed**: Maximum speed in km/h

### Pings Table

- **id**: Primary key
- **trip_id**: Foreign key to trips
- **licence_plate**: Motorcycle identifier
- **timestamp**: UNIX timestamp
- **latitude/longitude**: GPS coordinates
- **speed**: Speed in km/h
- **odometer**: Odometer reading in km

### Active Trips Table

- **licence_plate**: Primary key
- **start_timestamp**: When trip started
- **start/last coordinates**: GPS data
- **start/last_odometer**: Odometer readings
- **max_speed**: Maximum speed observed

## 🎯 Configuration

### Trip Detection Parameters

Edit `backend/src/services/trip.service.ts`:

```typescript
const IDLE_TIMEOUT_SECONDS = 300; // 5 minutes
const MIN_SPEED_MOVING = 5; // km/h
const MIN_TRIP_DURATION = 60; // seconds
```

### Kafka Topics

- **motorcycle-pings**: Ping ingestion topic
- Auto-created on first message
- Configurable in service files

## 🔧 Troubleshooting

### Common Issues

**Kafka connection errors**

```bash
# Restart Kafka services
docker-compose restart kafka zookeeper

# Check Kafka logs
docker-compose logs kafka
```

**Database connection issues**

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres
```

**Frontend can't connect to backend**

- Verify NEXT_PUBLIC_API_URL in .env
- Check backend is running on port 3001
- Ensure CORS is configured correctly

## 🚦 Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Use Ping Simulator** in the web UI to generate test data
3. **Monitor trips** in the trip list
4. **Click on trips** to see detailed route visualization
5. **Test different scenarios**:
   - Continuous movement (long trip)
   - Stop-and-go (multiple trips)
   - Idle timeouts

## 📝 Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Maintenance reminders

## 📄 License

MIT License - see LICENSE file for details

## 👥 Author

Eduardo Alves
