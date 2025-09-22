'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@connectrpc/connect';
import { CryptoPriceService, TickerPrice } from '@crypto/shared';
import { transport } from '../lib/transport';

interface PriceDisplayProps {
  ticker: string;
  price: number;
  timestamp: number;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ ticker, price, timestamp }) => {
  const timeStr = new Date(timestamp).toLocaleTimeString();
  
  return (
    <div style={{
      border: '1px solid #ccc',
      padding: '16px',
      margin: '8px 0',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{ticker}</div>
      <div style={{ fontSize: '24px', color: '#2196F3' }}>${price.toFixed(4)}</div>
      <div style={{ fontSize: '12px', color: '#666' }}>Updated: {timeStr}</div>
    </div>
  );
};

export default function HomePage() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [prices, setPrices] = useState<Map<string, PriceDisplayProps>>(new Map());
  const [newTicker, setNewTicker] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const client = createClient(CryptoPriceService, transport);

  // Load initial tickers
  useEffect(() => {
    loadTickers();
  }, []);

  // Set up price streaming
  useEffect(() => {
    let abortController: AbortController | null = null;
    
    const startPriceStream = async () => {
      try {
        console.log('🌊 Starting price stream...');
        abortController = new AbortController();
        
        const stream = client.streamPrices({}, { signal: abortController.signal });
        
        for await (const price of stream) {
          console.log('💰 Received price update:', price);
          
          setPrices(prev => new Map(prev.set(price.ticker, {
            ticker: price.ticker,
            price: price.price,
            timestamp: Number(price.timestamp)
          })));
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('❌ Price stream error:', error);
          setMessage('Error connecting to price stream');
          
          // Retry connection after 5 seconds
          setTimeout(startPriceStream, 5000);
        }
      }
    };

    startPriceStream();

    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [client]);

  const loadTickers = async () => {
    try {
      console.log('📋 Loading active tickers...');
      const response = await client.getTickers({});
      const sortedTickers = response.tickers.sort();
      setTickers(sortedTickers);
      console.log('✅ Loaded tickers:', sortedTickers);
    } catch (error) {
      console.error('❌ Failed to load tickers:', error);
      setMessage('Failed to load tickers');
    }
  };

  const addTicker = async () => {
    if (!newTicker.trim()) return;
    
    setIsLoading(true);
    try {
      console.log(`📝 Adding ticker: ${newTicker}`);
      const response = await client.addTicker({ ticker: newTicker.toUpperCase() });
      
      if (response.success) {
        const sortedTickers = response.activeTickers.sort();
        setTickers(sortedTickers);
        setNewTicker('');
        setMessage(`Successfully added ${newTicker.toUpperCase()}`);
        console.log('✅ Successfully added ticker');
      } else {
        setMessage(response.message);
        console.log('❌ Failed to add ticker:', response.message);
      }
    } catch (error) {
      console.error('❌ Add ticker error:', error);
      setMessage('Failed to add ticker');
    } finally {
      setIsLoading(false);
    }
  };

  const removeTicker = async (ticker: string) => {
    setIsLoading(true);
    try {
      console.log(`🗑️ Removing ticker: ${ticker}`);
      const response = await client.removeTicker({ ticker });
      
      if (response.success) {
        const sortedTickers = response.activeTickers.sort();
        setTickers(sortedTickers);
        setPrices(prev => {
          const newPrices = new Map(prev);
          newPrices.delete(ticker);
          return newPrices;
        });
        setMessage(`Successfully removed ${ticker}`);
        console.log('✅ Successfully removed ticker');
      } else {
        setMessage(response.message);
        console.log('❌ Failed to remove ticker:', response.message);
      }
    } catch (error) {
      console.error('❌ Remove ticker error:', error);
      setMessage('Failed to remove ticker');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🚀 Crypto Price Streaming
      </h1>
      
      {/* Add Ticker Form */}
      <div style={{ 
        border: '1px solid #ddd', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px',
        backgroundColor: '#fff'
      }}>
        <h2>Add Cryptocurrency Ticker</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            placeholder="Enter ticker (e.g., BTCUSD, ETHUSD)"
            style={{ 
              flex: 1, 
              padding: '10px', 
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addTicker();
              }
            }}
          />
          <button
            onClick={addTicker}
            disabled={isLoading || !newTicker.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {isLoading ? 'Adding...' : 'Add Ticker'}
          </button>
        </div>
        {message && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: message.includes('Success') ? '#d4edda' : '#f8d7da',
            border: `1px solid ${message.includes('Success') ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
            color: message.includes('Success') ? '#155724' : '#721c24'
          }}>
            {message}
          </div>
        )}
      </div>

      {/* Active Tickers */}
      <div>
        <h2>Active Tickers ({tickers.length})</h2>
        {tickers.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            border: '1px dashed #ccc',
            borderRadius: '8px'
          }}>
            No tickers added yet. Add some tickers to start streaming prices!
          </div>
        ) : (
          <div>
            {tickers.map(ticker => {
              const priceData = prices.get(ticker);
              return (
                <div key={ticker} style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  margin: '8px 0',
                  overflow: 'hidden'
                }}>
                  <div style={{ flex: 1 }}>
                    {priceData ? (
                      <PriceDisplay {...priceData} />
                    ) : (
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{ticker}</div>
                        <div style={{ color: '#666' }}>Loading price...</div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeTicker(ticker)}
                    disabled={isLoading}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}