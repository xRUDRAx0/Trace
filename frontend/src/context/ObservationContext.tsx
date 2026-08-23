import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface ObservationContextType {
  isActive: boolean;
  toggleObservation: () => Promise<void>;
  isLoading: boolean;
  liveEvents: any[];
  socket: Socket | null;
  currentSessionId: string | null;
}

const ObservationContext = createContext<ObservationContextType | undefined>(undefined);

export function ObservationProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of settings
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/settings/observation')
      .then(res => res.json())
      .then(data => {
        setIsActive(data.active);
        setCurrentSessionId(data.sessionId || null);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load observation settings', err);
        setIsLoading(false);
      });

    // Setup Socket.IO
    const newSocket = io((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '');
    setSocket(newSocket);

    newSocket.on('observation_status', (data) => {
      setIsActive(data.active);
      setCurrentSessionId(data.sessionId || null);
      if (!data.active) {
        setLiveEvents([]); // Clear live events on stop so they don't leak to next session
      }
    });

    newSocket.on('new_event', (event) => {
      setLiveEvents(prev => {
        // Double check session ID if available, though backend should only broadcast active ones
        if (event.sessionId && event.sessionId !== currentSessionId) {
          // If we have a mismatch (rare race condition), we might ignore, but for now we accept all from backend
        }
        return [event, ...prev];
      });
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const toggleObservation = async () => {
    const newState = !isActive;
    setIsActive(newState); // Optimistic UI update
    
    try {
      await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api/settings/observation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState })
      });
    } catch (err) {
      console.error('Failed to save observation setting', err);
      setIsActive(!newState); // Revert on failure
    }
  };

  return (
    <ObservationContext.Provider value={{ isActive, toggleObservation, isLoading, liveEvents, socket, currentSessionId }}>
      {children}
    </ObservationContext.Provider>
  );
}

export function useObservation() {
  const context = useContext(ObservationContext);
  if (context === undefined) {
    throw new Error('useObservation must be used within an ObservationProvider');
  }
  return context;
}
