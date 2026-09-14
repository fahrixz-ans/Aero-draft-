/**
 * Centralized Ad Placement Configuration for Mod Station
 * Follows Policy & Core Web Vitals guidelines.
 */

export interface AdPlacementSetting {
  enabled: boolean;
  maxSlots?: number;
}

export interface AdConfig {
  globalEnabled: boolean;
  label: string; // Standard label: 'Iklan' or 'Advertisement'
  pages: {
    home: AdPlacementSetting;
    today: AdPlacementSetting;
    blog: AdPlacementSetting;
    blogDetail: AdPlacementSetting;
    appDetail: AdPlacementSetting;
    categories: AdPlacementSetting;
    popular: AdPlacementSetting;
    newApps: AdPlacementSetting;
    helpCenter: AdPlacementSetting;
    search: AdPlacementSetting;
    [key: string]: AdPlacementSetting;
  };
}

export const AD_CONFIG: AdConfig = {
  globalEnabled: true,
  label: 'Iklan',
  pages: {
    home: { enabled: true, maxSlots: 3 },
    today: { enabled: true, maxSlots: 2 },
    blog: { enabled: true, maxSlots: 5 }, // High priority monetization
    blogDetail: { enabled: true, maxSlots: 4 }, // High priority monetization
    appDetail: { enabled: true, maxSlots: 3 },
    categories: { enabled: true, maxSlots: 2 },
    popular: { enabled: true, maxSlots: 2 },
    newApps: { enabled: true, maxSlots: 2 },
    helpCenter: { enabled: true, maxSlots: 1 },
    search: { enabled: true, maxSlots: 1 }
  }
};

export const isPageAdEnabled = (pageKey: string): boolean => {
  if (!AD_CONFIG.globalEnabled) return false;
  const pageSetting = AD_CONFIG.pages[pageKey];
  return pageSetting ? pageSetting.enabled : true;
};
