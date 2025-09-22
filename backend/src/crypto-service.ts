import { ConnectRouter } from '@connectrpc/connect';
import { 
  CryptoPriceService 
} from '@crypto/shared';
import {
  AddTickerRequest,
  RemoveTickerRequest,
  TickerResponse,
  GetTickersRequest,
  GetTickersResponse,
  TickerPrice
} from '@crypto/shared';
import { TradingViewScraper, PriceData } from './trading-view-scraper.js';

export class CryptoPriceServiceImpl {
  private scraper: TradingViewScraper;
  private subscribers: Set<(price: TickerPrice) => void> = new Set();

  constructor(scraper: TradingViewScraper) {
    this.scraper = scraper;
    
    // Listen for price updates from the scraper
    this.scraper.on('priceUpdate', (data: PriceData) => {
      const tickerPrice = new TickerPrice({
        ticker: data.ticker,
        price: data.price,
        timestamp: BigInt(data.timestamp),
        exchange: data.exchange
      });
      
      // Broadcast to all subscribers
      this.subscribers.forEach(callback => {
        try {
          callback(tickerPrice);
        } catch (error) {
          console.error('Error sending price update to subscriber:', error);
        }
      });
    });
  }

  async addTicker(request: AddTickerRequest): Promise<TickerResponse> {
    console.log(`📝 Request to add ticker: ${request.ticker}`);
    
    const success = await this.scraper.addTicker(request.ticker.toUpperCase());
    const activeTickers = this.scraper.getActiveTickers();
    
    return new TickerResponse({
      success,
      message: success 
        ? `Successfully added ticker ${request.ticker}` 
        : `Failed to add ticker ${request.ticker}`,
      activeTickers
    });
  }

  async removeTicker(request: RemoveTickerRequest): Promise<TickerResponse> {
    console.log(`🗑️  Request to remove ticker: ${request.ticker}`);
    
    const success = await this.scraper.removeTicker(request.ticker.toUpperCase());
    const activeTickers = this.scraper.getActiveTickers();
    
    return new TickerResponse({
      success,
      message: success 
        ? `Successfully removed ticker ${request.ticker}` 
        : `Failed to remove ticker ${request.ticker}`,
      activeTickers
    });
  }

  async getTickers(request: GetTickersRequest): Promise<GetTickersResponse> {
    console.log('📋 Request to get active tickers');
    
    const tickers = this.scraper.getActiveTickers();
    
    return new GetTickersResponse({
      tickers
    });
  }

  async *streamPrices(request: GetTickersRequest): AsyncGenerator<TickerPrice> {
    console.log('🌊 Client connected to price stream');
    
    // Create a queue for this subscriber
    const priceQueue: TickerPrice[] = [];
    let isActive = true;
    
    // Subscribe to price updates
    const callback = (price: TickerPrice) => {
      if (isActive) {
        priceQueue.push(price);
      }
    };
    
    this.subscribers.add(callback);
    
    try {
      while (isActive) {
        if (priceQueue.length > 0) {
          const price = priceQueue.shift()!;
          yield price;
        } else {
          // Wait a bit before checking again
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.log('🔌 Client disconnected from price stream (error):', error);
      isActive = false;
    } finally {
      console.log('🔌 Client disconnected from price stream');
      this.subscribers.delete(callback);
    }
  }
}

export function createCryptoPriceRouter(scraper: TradingViewScraper) {
  const service = new CryptoPriceServiceImpl(scraper);
  
  return (router: ConnectRouter) => {
    router.service(CryptoPriceService, {
      addTicker: service.addTicker.bind(service),
      removeTicker: service.removeTicker.bind(service),
      getTickers: service.getTickers.bind(service),
      streamPrices: service.streamPrices.bind(service)
    });
  };
}