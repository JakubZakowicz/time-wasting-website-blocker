export enum Actions {
  GetMetadataAndContent = 'getMetadataAndContent',
  Block = 'Block',
}

export enum SiteCategory {
  BeneficialSites = 'beneficial_sites',
  TimeWastingSites = 'time_wasting_sites',
}

export const checkIfExtensionIsEnabled = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('isEnabled', state => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(state.isEnabled);
    });
  });
};

export const updateIconBadge = async (): Promise<void> => {
  const isEnabled = await checkIfExtensionIsEnabled();
  chrome.action.setBadgeText({ text: isEnabled ? 'on' : 'off' });
  chrome.action.setBadgeBackgroundColor({
    color: isEnabled ? '#00FF00' : '#FF0000',
  });
};