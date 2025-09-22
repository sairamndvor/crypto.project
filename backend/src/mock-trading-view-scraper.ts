import { EventEmitter } from 'events';

export interface PriceData {
  ticker: string;
  price: number;
  timestamp: number;
  exchange: string;
}

export class MockTradingViewScraper extends EventEmitter {
  private activeTickers: Set<string> = new Set();
  private priceIntervals: Map<string, NodeJS.Timeout> = new Map();
  private basePrices: Map<string, number> = new Map([
    ['BTCUSD', 45000],
    ['ETHUSD', 2800],
    ['SOLUSD', 105],
    ['ADAUSD', 0.45],
    ['DOTUSD', 6.5],
    ['XRPUSD', 0.62],
    ['LINKUSD', 15.2],
    ['AVAXUSD', 38.5],
    ['MATICUSD', 0.85],
    ['UNIUSD', 7.2]
  ]);

  async initialize() {
    console.log('🚀 Initializing Mock TradingView scraper...');
    console.log('📝 Note: Using mock data for demonstration purposes');
    console.log('✅ Mock scraper initialized successfully');
  }

  async addTicker(ticker: string): Promise<boolean> {
    if (this.activeTickers.has(ticker)) {
      console.log(`⚠️  Ticker ${ticker} already being tracked`);
      return false;
    }

    try {
      console.log(`📈 Adding ticker: ${ticker}`);
      
      this.activeTickers.add(ticker);
      
      // Start generating mock price data
      this.startPriceGeneration(ticker);
      
      console.log(`✅ Successfully added ticker: ${ticker}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to add ticker ${ticker}:`, error);
      return false;
    }
  }

  async removeTicker(ticker: string): Promise<boolean> {
    if (!this.activeTickers.has(ticker)) {
      console.log(`⚠️  Ticker ${ticker} not being tracked`);
      return false;
    }

    try {
      console.log(`🗑️  Removing ticker: ${ticker}`);
      
      // Stop price generation
      const interval = this.priceIntervals.get(ticker);
      if (interval) {
        clearInterval(interval);
        this.priceIntervals.delete(ticker);
      }
      
      this.activeTickers.delete(ticker);
      console.log(`✅ Successfully removed ticker: ${ticker}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove ticker ${ticker}:`, error);
      return false;
    }
  }

  private startPriceGeneration(ticker: string) {
    // Get base price or generate a random one
    let currentPrice = this.basePrices.get(ticker) || Math.random() * 1000 + 10;
    
    // Generate an initial price update
    this.emitPriceUpdate(ticker, currentPrice);
    
    // Set up interval to generate price updates every 2-5 seconds
    const interval = setInterval(() => {
      // Generate realistic price movement (±2% change)
      const changePercent = (Math.random() - 0.5) * 0.04; // -2% to +2%
      currentPrice = currentPrice * (1 + changePercent);
      
      // Keep price positive and reasonable
      currentPrice = Math.max(currentPrice, 0.001);
      
      this.emitPriceUpdate(ticker, currentPrice);
    }, Math.random() * 3000 + 2000); // 2-5 seconds
    
    this.priceIntervals.set(ticker, interval);
  }

  private emitPriceUpdate(ticker: string, price: number) {
    const data: PriceData = {
      ticker,
      price,
      timestamp: Date.now(),
      exchange: 'BINANCE'
    };
    
    console.log(`💰 Mock price update for ${ticker}: $${price.toFixed(4)}`);
    this.emit('priceUpdate', data);
  }

  getActiveTickers(): string[] {
    return Array.from(this.activeTickers).sort();
  }

  async close() {
    console.log('🔄 Closing Mock TradingView scraper...');
    
    // Clear all intervals
    for (const [ticker, interval] of this.priceIntervals) {
      clearInterval(interval);
    }
    
    this.priceIntervals.clear();
    this.activeTickers.clear();
    
    console.log('✅ Mock TradingView scraper closed');
  }
}