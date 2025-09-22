import { chromium, Browser, Page } from 'playwright';
import { EventEmitter } from 'events';

export interface PriceData {
  ticker: string;
  price: number;
  timestamp: number;
  exchange: string;
}

export class TradingViewScraper extends EventEmitter {
  private browser: Browser | null = null;
  private pages: Map<string, Page> = new Map();
  private activeTickers: Set<string> = new Set();

  async initialize() {
    console.log('🚀 Initializing TradingView scraper...');
    try {
      this.browser = await chromium.launch({ 
        headless: false, // Run in headed mode as required
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      console.log('✅ Browser launched successfully');
    } catch (error) {
      console.error('❌ Failed to launch browser:', error);
      console.log('💡 Trying with different browser configuration...');
      
      try {
        // Fallback configuration
        this.browser = await chromium.launch({ 
          headless: true, // Fallback to headless if headed fails
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        console.log('✅ Browser launched successfully with fallback configuration');
      } catch (fallbackError) {
        console.error('❌ Failed to launch browser with fallback:', fallbackError);
        throw new Error('Could not launch browser. Please ensure Playwright is properly installed.');
      }
    }
  }

  async addTicker(ticker: string): Promise<boolean> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    if (this.activeTickers.has(ticker)) {
      console.log(`⚠️  Ticker ${ticker} already being tracked`);
      return false;
    }

    try {
      console.log(`📈 Adding ticker: ${ticker}`);
      const page = await this.browser.newPage();
      
      // Navigate to TradingView page for the ticker
      const url = `https://www.tradingview.com/symbols/${ticker}/?exchange=BINANCE`;
      console.log(`🌐 Navigating to: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for the price element to be visible
      await page.waitForSelector('[data-symbol-last]', { timeout: 10000 });
      
      // Set up price monitoring
      await this.setupPriceMonitoring(page, ticker);
      
      this.pages.set(ticker, page);
      this.activeTickers.add(ticker);
      
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
      const page = this.pages.get(ticker);
      if (page) {
        await page.close();
        this.pages.delete(ticker);
      }
      
      this.activeTickers.delete(ticker);
      console.log(`✅ Successfully removed ticker: ${ticker}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove ticker ${ticker}:`, error);
      return false;
    }
  }

  private async setupPriceMonitoring(page: Page, ticker: string) {
    // Monitor for price changes using page evaluation
    const monitorPrice = async () => {
      try {
        const priceData = await page.evaluate(() => {
          // Try multiple selectors for price data
          const selectors = [
            '[data-symbol-last]',
            '.tv-symbol-price-quote__value',
            '.js-symbol-last',
            '[class*="price"]'
          ];
          
          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
              const priceText = element.textContent.trim().replace(/[,$]/g, '');
              const price = parseFloat(priceText);
              if (!isNaN(price)) {
                return price;
              }
            }
          }
          
          return null;
        });

        if (priceData !== null) {
          const data: PriceData = {
            ticker,
            price: priceData,
            timestamp: Date.now(),
            exchange: 'BINANCE'
          };
          
          console.log(`💰 Price update for ${ticker}: $${priceData}`);
          this.emit('priceUpdate', data);
        }
      } catch (error) {
        console.error(`❌ Error monitoring price for ${ticker}:`, error);
      }
    };

    // Initial price fetch
    await monitorPrice();

    // Set up periodic monitoring
    const interval = setInterval(monitorPrice, 1000); // Check every second
    
    // Clean up interval when page is closed
    page.on('close', () => {
      clearInterval(interval);
    });
  }

  getActiveTickers(): string[] {
    return Array.from(this.activeTickers).sort();
  }

  async close() {
    console.log('🔄 Closing TradingView scraper...');
    
    for (const [ticker, page] of this.pages) {
      try {
        await page.close();
      } catch (error) {
        console.error(`❌ Error closing page for ${ticker}:`, error);
      }
    }
    
    if (this.browser) {
      await this.browser.close();
    }
    
    this.pages.clear();
    this.activeTickers.clear();
    
    console.log('✅ TradingView scraper closed');
  }
}