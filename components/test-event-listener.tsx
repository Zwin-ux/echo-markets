"use client"

import React, { useState, useEffect } from 'react';
import { useGameEngine, GameEvent } from '@/contexts/game-engine-context';

interface TestEventListenerProps {
  eventTypesToLog?: string[]; // Optional: specific event types to log, logs all if undefined
}

export default function TestEventListener({ eventTypesToLog }: TestEventListenerProps) {
  const { subscribe } = useGameEngine();
  const [loggedEvents, setLoggedEvents] = useState<GameEvent[]>([]);

  useEffect(() => {
    const listener = (event: GameEvent) => {
      if (!eventTypesToLog || eventTypesToLog.includes(event.type)) {
        setLoggedEvents(prevEvents => [event, ...prevEvents].slice(0, 20)); // Keep last 20 events
      }
    };

    const unsubscribe = subscribe(listener);
    return () => unsubscribe();
  }, [subscribe, eventTypesToLog]);

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md m-2 border border-green-500/30">
      <h3 className="text-lg font-semibold mb-2 border-b border-green-500/50 pb-1">Event Log</h3>
      {loggedEvents.length === 0 ? (
        <p className="text-sm text-gray-400">No relevant events logged yet.</p>
      ) : (
        <ul className="space-y-2 text-xs max-h-60 overflow-y-auto">
          {loggedEvents.map(event => (
            <li key={event.id} className="p-2 bg-gray-700 rounded">
              <p><strong>ID:</strong> {event.id}</p>
              <p><strong>Type:</strong> <span className="font-semibold text-yellow-400">{event.type}</span></p>
              <p><strong>Timestamp:</strong> {new Date(event.timestamp).toLocaleTimeString()}</p>
              {event.payload && (
                <p><strong>Payload:</strong> <pre className="text-xs bg-gray-600 p-1 rounded overflow-x-auto">{JSON.stringify(event.payload, null, 2)}</pre></p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
