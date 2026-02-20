# 🛠️ Development Guide

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git
- Code editor (VS Code recommended)

### Initial Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd motorcycle-tracker
```

2. **Quick start with Docker**
```bash
./setup.sh
```

3. **Manual setup (for development)**
```bash
# Start infrastructure
docker-compose up -d postgres kafka zookeeper

# Backend
cd backend
npm install
cp .env.example .env
npm run start:dev

# Frontend (in new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Development Workflow

### Backend Development

#### Running the Server
```bash
cd backend

# Development mode with hot reload
npm run start:dev

# Debug mode
npm run start:debug

# Production mode
npm run start:prod
```

#### Running Tests
```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

#### Adding a New Feature

1. **Create Entity** (if needed)
```typescript
// src/entities/new-feature.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('new_features')
export class NewFeature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
```

2. **Create DTO**
```typescript
// src/dto/new-feature.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateNewFeatureDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

3. **Create Service**
```typescript
// src/services/new-feature.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewFeature } from '../entities/new-feature.entity';

@Injectable()
export class NewFeatureService {
  constructor(
    @InjectRepository(NewFeature)
    private repository: Repository<NewFeature>,
  ) {}

  async create(dto: CreateNewFeatureDto): Promise<NewFeature> {
    const entity = this.repository.create(dto);
    return this.repository.save(entity);
  }
}
```

4. **Create Controller**
```typescript
// src/controllers/new-feature.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { NewFeatureService } from '../services/new-feature.service';
import { CreateNewFeatureDto } from '../dto/new-feature.dto';

@Controller('api/new-features')
export class NewFeatureController {
  constructor(private service: NewFeatureService) {}

  @Post()
  create(@Body() dto: CreateNewFeatureDto) {
    return this.service.create(dto);
  }
}
```

5. **Create Module**
```typescript
// src/modules/new-feature.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewFeatureController } from '../controllers/new-feature.controller';
import { NewFeatureService } from '../services/new-feature.service';
import { NewFeature } from '../entities/new-feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NewFeature])],
  controllers: [NewFeatureController],
  providers: [NewFeatureService],
})
export class NewFeatureModule {}
```

6. **Add to App Module**
```typescript
// src/app.module.ts
import { NewFeatureModule } from './modules/new-feature.module';

@Module({
  imports: [
    // ... other imports
    NewFeatureModule,
  ],
})
export class AppModule {}
```

7. **Write Tests**
```typescript
// src/services/new-feature.service.spec.ts
describe('NewFeatureService', () => {
  // Add tests here
});
```

### Frontend Development

#### Running the App
```bash
cd frontend

# Development mode
npm run dev

# Production build
npm run build
npm start
```

#### Creating a New Component

1. **Create Component File**
```typescript
// components/NewComponent.tsx
'use client';

import { useState } from 'react';

interface NewComponentProps {
  title: string;
}

export default function NewComponent({ title }: NewComponentProps) {
  const [state, setState] = useState('');

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {/* Component content */}
    </div>
  );
}
```

2. **Use Component**
```typescript
// app/page.tsx
import NewComponent from '../components/NewComponent';

export default function Home() {
  return (
    <div>
      <NewComponent title="My Component" />
    </div>
  );
}
```

#### Adding API Calls

```typescript
// lib/api.ts
export const myApi = {
  getData: async (): Promise<MyData> => {
    const response = await apiClient.get('/api/my-endpoint');
    return response.data;
  },

  postData: async (data: MyData): Promise<void> => {
    await apiClient.post('/api/my-endpoint', data);
  },
};
```

## Database Management

### Migrations (TypeORM)

```bash
# Generate migration
npm run typeorm migration:generate -- -n MigrationName

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d motorcycle_tracker

# Common queries
\dt                          # List tables
\d trips                     # Describe trips table
SELECT * FROM trips;         # Query trips
```

## Kafka Management

### View Messages

```bash
# Access Kafka container
docker-compose exec kafka bash

# List topics
kafka-topics --list --bootstrap-server localhost:9092

# Consume messages
kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic motorcycle-pings \
  --from-beginning
```

### Produce Test Messages

```bash
# Produce messages
kafka-console-producer \
  --bootstrap-server localhost:9092 \
  --topic motorcycle-pings
```

## Debugging

### Backend Debugging

1. **VS Code Launch Configuration**
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeArgs": [
    "-r",
    "ts-node/register",
    "-r",
    "tsconfig-paths/register"
  ],
  "args": ["${workspaceFolder}/backend/src/main.ts"],
  "cwd": "${workspaceFolder}/backend",
  "protocol": "inspector",
  "console": "integratedTerminal"
}
```

2. **Enable Logging**
```typescript
// main.ts
app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

### Frontend Debugging

1. **Browser DevTools**: Use React DevTools
2. **Console Logging**: Add strategic `console.log()`
3. **Network Tab**: Monitor API calls

## Code Quality

### Linting

```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

### Formatting

```bash
# Backend
cd backend
npm run format

# Frontend (using Prettier)
cd frontend
npx prettier --write "**/*.{ts,tsx}"
```

## Performance Optimization

### Backend
- Use database indexes
- Implement caching (Redis)
- Batch database operations
- Optimize queries with proper joins

### Frontend
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Lazy load components
- Optimize images

## Common Issues

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Kafka Issues
```bash
# Restart Kafka
docker-compose restart kafka zookeeper

# Check logs
docker-compose logs kafka

# Verify topic exists
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

### Port Conflicts
```bash
# Check what's using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

## Best Practices

### Backend
1. Always validate input with DTOs
2. Use dependency injection
3. Write unit tests for services
4. Add E2E tests for critical flows
5. Use TypeORM migrations for schema changes
6. Log errors properly
7. Use environment variables for configuration

### Frontend
1. Use TypeScript for type safety
2. Keep components small and focused
3. Use custom hooks for reusable logic
4. Implement error boundaries
5. Add loading states
6. Optimize bundle size
7. Use semantic HTML

### Git Workflow
1. Create feature branches: `feature/my-feature`
2. Write descriptive commit messages
3. Keep commits atomic
4. Run tests before committing
5. Use pull requests for code review
6. Squash commits before merging

## Useful Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Restart all services
docker-compose restart

# Rebuild services
docker-compose up -d --build

# Stop all services
docker-compose down

# Remove volumes (clean slate)
docker-compose down -v

# Execute command in container
docker-compose exec backend npm test
docker-compose exec postgres psql -U postgres
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [React Leaflet](https://react-leaflet.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
