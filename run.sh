#!/bin/bash

# Crypto Price Streaming Application Launcher
echo "🚀 Starting Crypto Price Streaming Application..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --recursive

# Generate protobuf code
echo "🛠️  Generating protobuf code..."
cd shared && pnpm run generate && pnpm run build
cd ..

# Install Playwright browsers if needed (with fallback)
echo "🌐 Installing Playwright browsers..."
cd backend 
if ! npx playwright install chromium; then
    echo "⚠️  Playwright browser installation failed, but continuing..."
    echo "   The application will attempt to use system browsers"
fi
cd ..

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo "🔧 Starting backend server..."
cd backend
pnpm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 5

# Start frontend server
echo "🎨 Starting frontend server..."
cd frontend
pnpm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Both servers started successfully!"
echo "📡 Backend: http://localhost:8080"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "📋 Application Features:"
echo "   • Add cryptocurrency tickers (e.g., BTCUSD, ETHUSD)"
echo "   • Real-time price streaming from TradingView"
echo "   • Alphabetically sorted ticker list"
echo "   • Remove tickers dynamically"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for either process to exit
wait