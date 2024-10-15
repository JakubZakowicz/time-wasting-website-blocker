interface Metadata {
  url: string;
  title: string;
  description: string;
  keywords: string;
}

enum SiteStatus {
  Beneficial = 'beneficial',
  TimeWasting = 'time-wasting',
}

enum SiteCategory {
  BeneficialSites = 'beneficial_sites',
  TimeWastingSites = 'time_wasting_sites',
}

const checkIfWebsiteAlreadyAdded = async (url: string) => {
  const result = await chrome.storage.local.get([
    SiteCategory.BeneficialSites,
    SiteCategory.TimeWastingSites,
  ]);
  const beneficialSites: string[] = result[SiteCategory.BeneficialSites] || [];
  const timeWastingSites: string[] =
    result[SiteCategory.TimeWastingSites] || [];

  const timeWastingSite = timeWastingSites.find(site => site === url);
  const beneficialSite = beneficialSites.find(site => site === url);

  if (beneficialSite) return SiteStatus.Beneficial;
  if (timeWastingSite) return SiteStatus.TimeWasting;

  return null;
};

function analyzeMetadata(metadata: Metadata): SiteStatus {
  return SiteStatus.TimeWasting;
}

const getResult = async (metadata: Metadata) => {
  return (
    (await checkIfWebsiteAlreadyAdded(metadata.url)) ||
    analyzeMetadata(metadata)
  );
};

const addSiteToStorage = async (siteCategory: SiteCategory, url: string) => {
  const result = await chrome.storage.local.get(siteCategory);
  const sites: string[] = result[siteCategory] || [];

  if (sites.length === 0) {
    sites.push(url);
  } else {
    const site = sites.find(site => site === url);

    if (site) return;

    sites.push(url);
  }

  chrome.storage.local.set({ [siteCategory]: sites });
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    console.log('page loaded');

    let metadata: Metadata;

    chrome.tabs.sendMessage(
      tabId,
      { action: 'getMetadata' },
      async response => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }

        if (response) {
          console.log('Metadata:', response);
          metadata = response;

          const result = await getResult(metadata);

          chrome.storage.local.get(console.log);
          if (result === SiteStatus.TimeWasting) {
            addSiteToStorage(SiteCategory.TimeWastingSites, metadata.url);
            chrome.tabs.sendMessage(tabId, {
              action: 'blockWebsite',
              url: metadata.url,
            });
          }

          if (result === SiteStatus.Beneficial) {
            addSiteToStorage(SiteCategory.BeneficialSites, metadata.url);
          }
        }
      }
    );
  }
});
