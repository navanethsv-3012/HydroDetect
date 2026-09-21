import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5005';

let socket = null;

/**
 * Get or create the singleton Socket.IO connection.
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
};

/**
 * Hook: Subscribe to a Socket.IO event.
 * Automatically cleans up on unmount.
 */
export const useSocketEvent = (event, handler) => {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const s = getSocket();
    const wrappedHandler = (...args) => handlerRef.current(...args);
    s.on(event, wrappedHandler);
    return () => s.off(event, wrappedHandler);
  }, [event]);
};

/**
 * Hook: Subscribe to a specific device's events.
 */
export const useDeviceSubscription = (deviceId) => {
  useEffect(() => {
    if (!deviceId) return;
    const s = getSocket();
    s.emit('subscribe:device', deviceId);
    return () => s.emit('unsubscribe:device', deviceId);
  }, [deviceId]);
};

/**
 * Hook: Get socket connection status.
 */
export const useSocketStatus = () => {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    setConnected(s.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  return connected;
};
