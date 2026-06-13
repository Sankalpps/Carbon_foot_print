'use client';

/**
 * @fileoverview useRealTimeCarbon hook - Subscribes to live SSE stream for carbon intensity data.
 */

import { useEffect, useState } from 'react';
import type { GridData } from '@/lib/carbon/grid-service';

/**
 * Custom hook to listen to real-time grid carbon intensity.
 */
export interface UseRealTimeCarbonResult {
  intensity: number;
  status: 'low' | 'moderate' | 'high';
  fuelMix: { source: string; percentage: number; color: string }[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_FUEL_MIX = [
  { source: 'Solar', percentage: 10, color: 'hsl(48, 90%, 50%)' },
  { source: 'Wind', percentage: 30, color: 'hsl(152, 68%, 55%)' },
  { source: 'Nuclear', percentage: 20, color: 'hsl(200, 85%, 55%)' },
  { source: 'Gas', percentage: 40, color: 'hsl(30, 10%, 55%)' },
];

export function useRealTimeCarbon(): UseRealTimeCarbonResult {
  const [data, setData] = useState<GridData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    function connect() {
      setIsLoading(true);
      setError(null);

      // Create browser EventSource
      eventSource = new EventSource('/api/realtime/stream');

      eventSource.onopen = () => {
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data) as GridData;
          setData(parsedData);
          setIsConnected(true);
          setIsLoading(false);
        } catch (err) {
          console.error('Failed to parse SSE grid data:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        setIsLoading(false);
        setError('Real-time connection lost. Attempting reconnect...');
        
        // Close current connection
        if (eventSource) {
          eventSource.close();
        }

        // Start polling fallback if SSE is failing
        if (!fallbackInterval) {
          startFallbackPolling();
        }
      };
    }

    // Fallback poll function
    async function pollData() {
      try {
        const res = await fetch('/api/realtime/intensity');
        if (res.ok) {
          const parsedData = await res.json() as GridData;
          setData(parsedData);
          setError(null);
          // If we successfully polled, show connected (polling mode)
          setIsConnected(true);
        }
      } catch {
        setError('Unable to fetch intensity data. Offline.');
        setIsConnected(false);
      }
    }

    function startFallbackPolling() {
      pollData(); // run immediately
      fallbackInterval = setInterval(pollData, 15000);
    }

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, []);

  return {
    intensity: data?.intensity ?? 180,
    status: data?.status ?? 'moderate',
    fuelMix: data?.fuelMix ?? DEFAULT_FUEL_MIX,
    isConnected,
    isLoading,
    error,
  };
}
