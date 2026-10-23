import React, { createContext, useContext, useEffect, useState } from 'react';
import { NewsRegion } from '../types/news';

export interface RegionOption {
  code: NewsRegion;
  label: string;
  flag: string;
}

export const AVAILABLE_REGIONS: RegionOption[] = [
  { code: 'global', label: 'Global Edition', flag: '🌐' },
  { code: 'in', label: 'India', flag: '🇮🇳' },
  { code: 'us', label: 'United States', flag: '🇺🇸' },
  { code: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'eu', label: 'Europe', flag: '🇪🇺' },
  { code: 'me', label: 'Middle East', flag: '🌍' },
  { code: 'asia', label: 'Asia-Pacific', flag: '🌏' },
  { code: 'africa', label: 'Africa', flag: '🌍' },
  { code: 'au', label: 'Australia', flag: '🇦🇺' },
];

interface RegionContextType {
  region: NewsRegion;
  setRegion: (region: NewsRegion) => void;
  currentRegionInfo: RegionOption;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const [region, setRegionState] = useState<NewsRegion>(() => {
    const saved = localStorage.getItem('chronicle_region') as NewsRegion;
    const exists = AVAILABLE_REGIONS.some(r => r.code === saved);
    return exists ? saved : 'global';
  });

  useEffect(() => {
    localStorage.setItem('chronicle_region', region);
  }, [region]);

  const currentRegionInfo = AVAILABLE_REGIONS.find(r => r.code === region) || AVAILABLE_REGIONS[0];

  return (
    <RegionContext.Provider
      value={{
        region,
        setRegion: setRegionState,
        currentRegionInfo,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
}
