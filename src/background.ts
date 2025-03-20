import { MetadataAndContent } from './types';
import { Actions, checkIfExtensionIsEnabled, SiteCategory, updateIconBadge } from './utils';

const API_KEY = process.env.API_KEY as string;
const API_URL = process.env.API_URL as string;
const IGNORED_DOMAINS = process.env.IGNORED_DOMAINS as string;

enum SiteStatus {
  Beneficial = 'beneficial',
  TimeWasting = 'time-wasting',
}

const checkIfWebsiteAlreadyAdded = async (url: string) => {
  const result = await chrome.storage.local.get([
    SiteCategory.BeneficialSites,
    SiteCategory.TimeWastingSites,
  ]);
  const beneficialSites: string[] = result[SiteCategory.BeneficialSites] || [];
  const timeWastingSites: string[] =
    result[SiteCategory.TimeWastingSites] || [];

  const beneficialSite = beneficialSites.find(site => site === url);
  if (beneficialSite) return [true, SiteStatus.Beneficial];

  const timeWastingSite = timeWastingSites.find(site => site === url);
  if (timeWastingSite) return [true, SiteStatus.TimeWasting];

  return [false, null];
};

const analyzeMetadataAndContent = async (
  websiteInfo: MetadataAndContent
): Promise<SiteStatus> => {
  const prompt = `Analyze the following website metadata and determine if the   website is likely to be beneficial or time-wasting. Consider a webpage as "beneficial" if it contains educational, useful, or informative content. Otherwise, consider it "time-wasting" such as content about video games, movies, series etc. Use only one word.
  
  Title: ${websiteInfo.title}
  Metadata: ${JSON.stringify(websiteInfo.metadata)}
  headers: ${websiteInfo.headings}
  paragraphs: ${websiteInfo.paragraphs}
    `;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  return data.choices[0].message.content.toLowerCase();
};

const blockWebsite = async (tabId: number, url: string) => {
  chrome.tabs.sendMessage(tabId, {
    action: Actions.Block,
    url,
  });
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

const getMetadataAndContent = (tabId: number) => {
  return chrome.tabs.sendMessage(tabId, {
    action: Actions.GetMetadataAndContent,
  });
};

const isOneOfIgnoredDomains = (url: string) => {
  const envIgnoredDomains = IGNORED_DOMAINS.split(',');
  const ignoredDomains = [
    'google.com',
    'blocked/blocked.html',
    ...envIgnoredDomains,
  ];
  return ignoredDomains.some(domain => url.includes(domain));
};

chrome.runtime.onStartup.addListener(async () => {
  updateIconBadge();
});

chrome.runtime.onInstalled.addListener(async () => {
  updateIconBadge();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const url: string = tab.url!;
  const isEnabled = await checkIfExtensionIsEnabled();
  if (
    changeInfo.status === 'complete' &&
    !isOneOfIgnoredDomains(url) &&
    isEnabled
  ) {
    const [isWebsiteAlreadyAdded, result] = await checkIfWebsiteAlreadyAdded(
      url
    );

    if (isWebsiteAlreadyAdded) {
      if (result === SiteStatus.TimeWasting) blockWebsite(tabId, url);
    } else {
      const metadataAndContent = await getMetadataAndContent(tabId);
      const result = await analyzeMetadataAndContent(metadataAndContent);

      if (result === SiteStatus.TimeWasting) {
        addSiteToStorage(SiteCategory.TimeWastingSites, url);
        blockWebsite(tabId, url);
      }

      if (result === SiteStatus.Beneficial) {
        addSiteToStorage(SiteCategory.BeneficialSites, url);
      }
    }
  }
});
