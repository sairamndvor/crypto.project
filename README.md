# 🚀 Crypto Price Streaming Application

A full-stack real-time cryptocurrency price streaming application built with TypeScript, Next.js, Node.js, and ConnectRPC.

![Application Demo](https://github.com/user-attachments/assets/4ce57eee-1aa6-4a7a-95c9-ab5469ffa148)

## ✨ Features

- **Real-time price streaming** from TradingView (with mock fallback)
- **Add/Remove cryptocurrency tickers** dynamically
- **Alphabetical ticker sorting** in the UI
- **Push-based architecture** for low-latency updates
- **Scalable server design** supporting multiple clients
- **ConnectRPC communication** between frontend and backend
- **Comprehensive logging** for debugging and monitoring
- **Graceful error handling** and reconnection logic

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + React
- **Backend**: Node.js + TypeScript + tsx
- **Communication**: ConnectRPC (gRPC-Web)
- **Data Source**: Playwright (TradingView scraping)
- **Package Manager**: pnpm
- **Schema**: Protocol Buffers

## 🚀 Quick Start

### Prerequisites

- Node.js (>=18.0.0)
- pnpm (automatically installed if missing)

### Installation & Running

```bash
# Clone the repository
git clone <repository-url>
cd crypto.project

# Start the application (installs dependencies, builds, and runs everything)
./run.sh
```

The script will:
1. Install pnpm if not available
2. Install all dependencies recursively
3. Generate protobuf code
4. Install Playwright browsers (with fallback to mock mode)
5. Start backend server on http://localhost:8080
6. Start frontend server on http://localhost:3000

### Manual Development Setup

```bash
# Install dependencies
pnpm install --recursive

# Generate protobuf code
cd shared && pnpm run generate && pnpm run build && cd ..

# Start backend (in one terminal)
cd backend && pnpm run dev

# Start frontend (in another terminal) 
cd frontend && pnpm run dev
```

## 📁 Project Structure

```
crypto.project/
├── shared/                 # Shared protobuf schemas and generated code
│   ├── proto/             # Protocol buffer definitions
│   ├── src/gen/           # Generated TypeScript code
│   └── package.json
├── backend/               # Node.js backend server
│   ├── src/
│   │   ├── server.ts           # Main server entry point
│   │   ├── crypto-service.ts   # ConnectRPC service implementation
│   │   ├── trading-view-scraper.ts  # Real Playwright scraper
│   │   └── mock-trading-view-scraper.ts  # Mock data generator
│   └── package.json
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   └── lib/           # Shared utilities
│   └── package.json
├── run.sh                 # Application launcher script
└── pnpm-workspace.yaml   # Workspace configuration
```

## 🔧 Usage

### Adding Tickers

1. Open http://localhost:3000
2. Enter a cryptocurrency ticker (e.g., BTCUSD, ETHUSD, SOLUSD)
3. Click "Add Ticker"
4. Watch real-time price updates appear

### Removing Tickers

1. Click the "Remove" button next to any active ticker
2. The ticker will be removed and price updates will stop

### Available Tickers

The application supports any cryptocurrency ticker that would be available on TradingView with the BINANCE exchange. Common examples:
- BTCUSD (Bitcoin)
- ETHUSD (Ethereum)  
- SOLUSD (Solana)
- ADAUSD (Cardano)
- DOTUSD (Polkadot)

## 🏗️ Architecture

### Backend Services

- **ConnectRPC Server**: Handles gRPC communication on port 8080
- **TradingView Scraper**: Uses Playwright to scrape live prices in headed mode
- **Mock Scraper**: Generates realistic price data when Playwright is unavailable
- **Price Streaming**: Real-time price broadcasting to connected clients

### Frontend Components

- **Next.js App**: React-based user interface
- **ConnectRPC Client**: Communicates with backend via gRPC-Web
- **Real-time Updates**: Streaming price display with live timestamps
- **Ticker Management**: Add/remove functionality with validation

### Communication Protocol

```protobuf
service CryptoPriceService {
  rpc AddTicker(AddTickerRequest) returns (TickerResponse);
  rpc RemoveTicker(RemoveTickerRequest) returns (TickerResponse);
  rpc GetTickers(GetTickersRequest) returns (GetTickersResponse);
  rpc StreamPrices(GetTickersRequest) returns (stream TickerPrice);
}
```

## 🔧 Development

### Building Components

```bash
# Build shared schemas
cd shared && pnpm run build

# Build backend
cd backend && pnpm run build

# Build frontend
cd frontend && pnpm run build
```

### Environment Variables

- `USE_MOCK=true` - Forces backend to use mock scraper
- `NODE_ENV=development` - Enables development mode features
- `PORT=8080` - Backend server port (default: 8080)

## 🐛 Troubleshooting

### Playwright Browser Issues

If Playwright browsers fail to install, the application automatically falls back to mock mode. To manually install:

```bash
cd backend && npx playwright install chromium
```

### Connection Issues

- Ensure both frontend (3000) and backend (8080) ports are available
- Check CORS configuration if seeing cross-origin errors
- Verify ConnectRPC endpoints are accessible

### Common Problems

1. **"Command not found: pnpm"** - The run.sh script will install it automatically
2. **Port already in use** - Change ports in environment variables
3. **Price updates not showing** - Check browser console for connection errors

## 📝 Logging

The application provides comprehensive logging:

**Backend logs include:**
- Server startup and configuration
- Client connections and disconnections  
- Ticker add/remove operations
- Real-time price updates
- Error handling and debugging info

**Frontend logs include:**
- ConnectRPC communication status
- Price update events
- User interactions
- Stream connection status

## 🚧 Production Considerations

For production deployment:

1. **Replace mock scraper** with real TradingView integration
2. **Add authentication** and rate limiting
3. **Implement persistent storage** for user preferences
4. **Add monitoring** and alerting
5. **Configure proper CORS** for production domains
6. **Add input validation** and sanitization
7. **Implement caching** for frequently requested data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is provided as-is for demonstration purposes.
