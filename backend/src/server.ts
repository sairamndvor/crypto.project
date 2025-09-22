import { connectNodeAdapter } from '@connectrpc/connect-node';
import http from 'http';
import { TradingViewScraper } from './trading-view-scraper.js';
import { MockTradingViewScraper } from './mock-trading-view-scraper.js';
import { createCryptoPriceRouter } from './crypto-service.js';

const PORT = process.env.PORT || 8080;
const USE_MOCK = process.env.USE_MOCK === 'true' || process.env.NODE_ENV === 'development';

async function main() {
  console.log('🚀 Starting Crypto Price Streaming Server...');
  
  // Initialize the scraper (mock or real)
  let scraper: TradingViewScraper | MockTradingViewScraper;
  
  if (USE_MOCK) {
    console.log('🎭 Using mock scraper for demonstration');
    scraper = new MockTradingViewScraper();
  } else {
    console.log('🌐 Using real TradingView scraper');
    scraper = new TradingViewScraper();
  }
  
  try {
    await scraper.initialize();
  } catch (error) {
    console.error('❌ Failed to initialize scraper:', error);
    console.log('🎭 Falling back to mock scraper...');
    scraper = new MockTradingViewScraper();
    await scraper.initialize();
  }
  
  // Create the ConnectRPC routes
  const routes = createCryptoPriceRouter(scraper as TradingViewScraper);
  
  // Create HTTP server with ConnectRPC handler
  const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Connect-Protocol-Version, Connect-Timeout-Ms');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Use ConnectRPC adapter
    const adapter = connectNodeAdapter({ routes });
    adapter(req, res);
  });
  
  // Graceful shutdown
  const shutdown = async () => {
    console.log('🛑 Shutting down server...');
    
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    await scraper.close();
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  // Start server
  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log('📡 ConnectRPC endpoints available at:');
    console.log(`   - http://localhost:${PORT}/crypto.v1.CryptoPriceService/AddTicker`);
    console.log(`   - http://localhost:${PORT}/crypto.v1.CryptoPriceService/RemoveTicker`);
    console.log(`   - http://localhost:${PORT}/crypto.v1.CryptoPriceService/GetTickers`);
    console.log(`   - http://localhost:${PORT}/crypto.v1.CryptoPriceService/StreamPrices`);
    console.log('');
    console.log('🎯 Ready to accept ticker subscriptions!');
  });
}

main().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});