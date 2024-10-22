import { SiteCategory, updateIconBadge } from './utils';

const buttonTexts = {
  changeToTimeWasting: 'Change to Time-wasting',
  changeToBeneficial: 'Change to Beneficial',
};

const updateStatusVisibility = (isEnabled: boolean): void => {
  const statusContainer = document.querySelector('.status-container');
  if (isEnabled) {
    statusContainer?.classList.add('show');
  } else {
    statusContainer?.classList.remove('show');
  }
};

const checkIfWebsiteBlocked = async (): Promise<boolean> => {
  return new Promise(resolve => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      const tabUrl = tabs[0].url;
      if (tabUrl?.includes('blocked/blocked.html')) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

const getStatusResult = async () => {
  const isWebsiteBlocked = await checkIfWebsiteBlocked();

  const statusResult = document.querySelector('#statusResult') as HTMLElement;
  const classificationToggleButton = document.querySelector(
    '#classificationToggle'
  ) as HTMLElement;

  if (isWebsiteBlocked) {
    statusResult.innerText = 'Time-wasting';
    statusResult.classList.add('time-wasting');
    classificationToggleButton.innerText = buttonTexts.changeToBeneficial;
  } else {
    statusResult.innerText = 'Beneficial';
    statusResult.classList.remove('beneficial');
    classificationToggleButton.innerText = buttonTexts.changeToTimeWasting;
  }
};

const moveSiteToBeneficial = async (url: string) => {
  console.log('moving');
  const result = await chrome.storage.local.get([
    SiteCategory.BeneficialSites,
    SiteCategory.TimeWastingSites,
  ]);

  const beneficialSites: string[] = result[SiteCategory.BeneficialSites] || [];
  const timeWastingSites: string[] =
    result[SiteCategory.TimeWastingSites] || [];

  const filteredTimeWastingSites: string[] = timeWastingSites.filter(
    site => site !== url
  );

  beneficialSites.push(url);
  const updatedBeneficialSites: string[] = beneficialSites;

  chrome.storage.local.set({
    [SiteCategory.BeneficialSites]: updatedBeneficialSites,
    [SiteCategory.TimeWastingSites]: filteredTimeWastingSites,
  });
};

const moveSiteToTimeWasting = async (url: string) => {
  const result = await chrome.storage.local.get([
    SiteCategory.BeneficialSites,
    SiteCategory.TimeWastingSites,
  ]);

  const beneficialSites: string[] = result[SiteCategory.BeneficialSites] || [];
  const timeWastingSites: string[] =
    result[SiteCategory.TimeWastingSites] || [];

  const filteredBeneficialSites: string[] = beneficialSites.filter(
    site => site !== url
  );

  timeWastingSites.push(url);
  const updatedTimeWastingSites: string[] = timeWastingSites;

  chrome.storage.local.set({
    [SiteCategory.BeneficialSites]: filteredBeneficialSites,
    [SiteCategory.TimeWastingSites]: updatedTimeWastingSites,
  });
};

const changeWebsiteToBeneficial = async () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    const tabUrl = tabs[0].url;
    if (tabUrl) {
      const urlQueryString = new URL(tabUrl).search;
      const urlParams = new URLSearchParams(urlQueryString);
      const blockedUrlParam = urlParams.get('blockedUrl');

      if (blockedUrlParam) {
        moveSiteToBeneficial(blockedUrlParam);
        chrome.tabs.update({ url: blockedUrlParam });
      }
    }
  });
};

const changeWebsiteToTimeWasting = async () => {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    const tabUrl = tabs[0].url;
    if (tabUrl) {
      moveSiteToTimeWasting(tabUrl);
      chrome.tabs.update({
        url:
          chrome.runtime.getURL('blocked/blocked.html') +
          '?blockedUrl=' +
          encodeURIComponent(tabUrl),
      });
    }
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  const toggleSwitch = document.getElementById(
    'toggleSwitch'
  ) as HTMLInputElement;
  const classificationToggleButton = document.getElementById(
    'classificationToggle'
  ) as HTMLButtonElement;

  chrome.storage.local.get('isEnabled', async data => {
    const { isEnabled } = data;
    toggleSwitch.checked = isEnabled || false;
    updateIconBadge(isEnabled);
    updateStatusVisibility(isEnabled);
    if (isEnabled) {
      getStatusResult();
    }
  });

  toggleSwitch.addEventListener('change', async event => {
    const target = event.target as HTMLInputElement;
    const isEnabled = target.checked;
    updateIconBadge(isEnabled);
    updateStatusVisibility(isEnabled);
    getStatusResult();
    chrome.storage.local.set({ isEnabled });
  });

  classificationToggleButton.addEventListener('click', async () => {
    const isWebsiteBlocked = await checkIfWebsiteBlocked();
    if (isWebsiteBlocked) {
      classificationToggleButton.innerText = buttonTexts.changeToTimeWasting;
      changeWebsiteToBeneficial();
    } else {
      classificationToggleButton.innerText = buttonTexts.changeToBeneficial;
      changeWebsiteToTimeWasting();
    }
  });
});
