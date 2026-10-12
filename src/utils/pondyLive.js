import { useEffect, useState } from 'react';

/** Puducherry-only view — same bounds as the synthetic data generator. */
export const PONDY_CENTER = [11.9416, 79.8083];
export const PONDY_BOUNDS = [[11.8, 79.7], [12.05, 79.84]];

function drift(v, amt) {
  return v + (Math.random() - 0.5) * amt;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/**
 * Simulated live patrol units — small GPS drift every `intervalMs`.
 * Clearly simulated: no backend, no real people. Toggleable.
 */
export function useSimulatedLiveUnits(units, enabled = true, intervalMs = 4000) {
  const [tick, setTick] = useState(0);
  const [live, setLive] = useState(null);

  useEffect(() => {
    if (!enabled || !units?.length) {
      setLive(null);
      return undefined;
    }
    setLive(units);
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [enabled, units, intervalMs]);

  useEffect(() => {
    if (!enabled || tick === 0) return;
    setLive((prev) => {
      if (!prev) return prev;
      return prev.map((u) => {
        if (u.availability_status === 'Offline') return u;
        return {
          ...u,
          current_latitude: Number(clamp(drift(u.current_latitude, 0.004), 11.8, 12.05).toFixed(6)),
          current_longitude: Number(clamp(drift(u.current_longitude, 0.004), 79.7, 79.84).toFixed(6))
        };
      });
    });
  }, [tick, enabled]);

  return live || units;
}
