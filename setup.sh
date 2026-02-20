#!/bin/bash

# Motorcycle Trip Tracker - Setup Script
# This script sets up the entire application with one command

set -e

echo "🏍️  Motorcycle Trip Tracker - Setup"
echo "====================================="
echo ""

# Create environment files
echo "📝 Creating environment files..."

if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
fi

echo ""

# Start services
echo "🚀 Starting services with Docker Compose..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "⚠️  PostgreSQL is starting up..."
fi

# Check Backend
if curl -s http://localhost:3001/api/trips > /dev/null 2>&1; then
    echo "✅ Backend is ready"
else
    echo "⚠️  Backend is starting up..."
fi

# Check Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
else
    echo "⚠️  Frontend is starting up..."
fi

echo ""
echo "================================================"
echo "🎉 Setup Complete!"
echo "================================================"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:        http://localhost:3000"
echo "   Backend API:     http://localhost:3001"
echo "   API Docs:        http://localhost:3001/api/docs"
echo ""
echo "📚 Quick Start:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Use the Ping Simulator to generate test data"
echo "   3. View trips in the trip list"
echo "   4. Click on a trip to see route visualization"
echo ""
echo "🛠️  Useful Commands:"
echo "   View logs:       docker-compose logs -f"
echo "   Stop services:   docker-compose down"
echo "   Restart:         docker-compose restart"
echo ""
echo "📖 For more information, see README.md"
echo ""
