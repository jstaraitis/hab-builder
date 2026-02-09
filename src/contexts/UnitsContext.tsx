import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UnitSystem = 'imperial' | 'metric';

interface UnitsContextType {
  units: UnitSystem;
  isMetric: boolean;
  isImperial: boolean;
  toggleUnits: () => void;
  setImperial: () => void;
  setMetric: () => void;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

interface UnitsProviderProps {
  children: ReactNode;
}

export function UnitsProvider({ children }: UnitsProviderProps) {
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

  return (
    <UnitsContext.Provider
      value={{
        units,
        isMetric: units === 'metric',
        isImperial: units === 'imperial',
        toggleUnits,
        setImperial,
        setMetric,
      }}
    >
      {children}
    </UnitsContext.Provider>
  );
}

export function useUnits() {
  const context = useContext(UnitsContext);
  if (context === undefined) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
}
