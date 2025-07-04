#!/bin/bash

# Setup script for ContextBoard

echo "🚀 Setting up ContextBoard..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Please create it from .env.example"
    echo "   cp .env.example .env.local"
    echo "   Then edit .env.local with your actual values"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set in .env.local"
    exit 1
fi

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✅ Setup complete!"
echo ""
echo "🔧 To finish setup:"
echo "   1. Set up your OAuth providers (GitHub/Google)"
echo "   2. Add their client IDs and secrets to .env.local"
echo "   3. Run: npm run dev"
echo ""
echo "🌐 Your app will be available at: http://localhost:3000"
