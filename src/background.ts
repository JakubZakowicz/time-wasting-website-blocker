const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

  const beneficialSite = beneficialSites.find(site => site === url);
  if (beneficialSite) return [true, SiteStatus.Beneficial];

  const timeWastingSite = timeWastingSites.find(site => site === url);
  if (timeWastingSite) return [true, SiteStatus.TimeWasting];

  return [false, null];
};

const analyzeMetadata = async (metadata: Metadata): Promise<SiteStatus> => {
  const prompt = `Analyze the following website metadata and determine if the   website is likely to be beneficial or time-wasting. Consider a webpage as "beneficial" if it contains educational, useful, or informative content. Otherwise, consider it a "time-waster" such as content about video games, movies, series etc. Use only one word.
  
  Title: ${metadata.title}
  Description: ${metadata.description}
  Keywords: ${metadata.keywords}
    `;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
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

  return data.choices[0].message.content;
}

const blockWebsite = async (tabId: number, url: string) => {
  chrome.tabs.sendMessage(tabId, {
    action: 'blockWebsite',
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

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('page loaded');
    const url: string = tab.url!;

    const [websiteAlreadyAdded, result] = await checkIfWebsiteAlreadyAdded(url);

    if (websiteAlreadyAdded) {
      if (result === SiteStatus.TimeWasting) blockWebsite(tabId, url);
    } else {
      const metadata = await chrome.tabs.sendMessage(tabId, {
        action: 'getMetadata',
      });
      const result = await analyzeMetadata(metadata);

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
