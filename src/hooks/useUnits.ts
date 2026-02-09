import { useState, useEffect } from 'react';

export type UnitSystem = 'imperial' | 'metric';

export function useUnits() {
  const [units, setUnits] = useState<UnitSystem>(() => {
    const stored = localStorage.getItem('units');
    if (stored === 'metric' || stored === 'imperial') {
      return stored;
    }
    
    // Auto-detect based on user's locale
    // US uses imperial, most other countries use metric
    if (typeof navigator !== 'undefined') {
      const locale = navigator.language || 'en-US';
      return locale.startsWith('en-US') ? 'imperial' : 'metric';
    }
    
    return 'imperial'; // Default fallback
  });

  useEffect(() => {
    localStorage.setItem('units', units);
  }, [units]);

  const toggleUnits = () => {
    setUnits(prev => prev === 'imperial' ? 'metric' : 'imperial');
  };

  const setImperial = () => setUnits('imperial');
  const setMetric = () => setUnits('metric');

  return {
    units,
    isMetric: units === 'metric',
    isImperial: units === 'imperial',
    toggleUnits,
    setImperial,
    setMetric,
  };
}
