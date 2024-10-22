export enum Actions {
  GetMetadataAndContent = 'getMetadataAndContent',
  Block = 'Block',
}

export enum SiteCategory {
  BeneficialSites = 'beneficial_sites',
  TimeWastingSites = 'time_wasting_sites',
}

export const updateIconBadge = (isEnabled: boolean): void => {
  chrome.action.setBadgeText({ text: isEnabled ? 'on' : 'off' });
  chrome.action.setBadgeBackgroundColor({
    color: isEnabled ? '#00FF00' : '#FF0000',
  });
};