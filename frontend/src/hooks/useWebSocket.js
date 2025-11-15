import { useEffect, useRef } from 'react';

/**
 * Custom hook for WebSocket connection
 * @param {Function} onMessage - Callback function to handle incoming messages
 * @param {Array} dependencies - Dependencies array for the effect
 * @returns {Object} - WebSocket reference and connection status
 */
export const useWebSocket = (onMessage, dependencies = []) => {
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const isConnecting = useRef(false);

  const connect = () => {
    if (isConnecting.current || (ws.current && ws.current.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      isConnecting.current = true;
      
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const backendHost = import.meta.env.VITE_API_BASE 
        ? import.meta.env.VITE_API_BASE.replace(/^https?:\/\//, '').replace(/\/api\/v1$/, '')
        : 'localhost:3000';
      const wsUrl = `${wsProtocol}//${backendHost}`;

      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected');
        isConnecting.current = false;
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message.type);
          
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('⚠️  WebSocket disconnected');
        isConnecting.current = false;
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 5000);
      };

      ws.current.onerror = (error) => {
        console.warn('⚠️  WebSocket error:', error.message || 'Connection failed');
        isConnecting.current = false;
      };
    } catch (error) {
      console.warn('⚠️  WebSocket initialization failed:', error.message);
      isConnecting.current = false;
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      
      if (ws.current) {
        try {
          ws.current.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { ws: ws.current };
};
