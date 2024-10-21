const updateIcon = (isEnabled: boolean): void => {
  chrome.action.setBadgeText({ text: isEnabled ? 'on' : 'off' });
  chrome.action.setBadgeBackgroundColor({
    color: isEnabled ? '#00FF00' : '#FF0000',
  });
};

const updateStatusContainer = (isEnabled: boolean): void => {
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
      console.log(tabs);
      console.log(tabUrl);
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
  console.log(isWebsiteBlocked);

  const statusResult = document.querySelector('#statusResult') as HTMLElement;
  const classificationToggleButton = document.querySelector(
    '#classificationToggle'
  ) as HTMLElement;

  if (isWebsiteBlocked) {
    statusResult.innerText = 'Time-wasting';
    statusResult.classList.add('time-wasting');
    classificationToggleButton.innerText = 'Change to Beneficial';
  } else {
    statusResult.innerText = 'Beneficial';
    statusResult.classList.remove('beneficial');
    classificationToggleButton.innerText = 'Change to Time-wasting';
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const toggleSwitch = document.getElementById(
    'toggleSwitch'
  ) as HTMLInputElement;

  chrome.storage.local.get('isEnabled', async data => {
    toggleSwitch.checked = data.isEnabled || false;
    updateIcon(data.isEnabled);
    updateStatusContainer(data.isEnabled);
    if (data.isEnabled) {
      getStatusResult();
    }
  });

  // Check if the website is beneficial: Find URL in storage
  // Check if website loaded the blocked website

  // Or just check if there is the blocked window

  toggleSwitch.addEventListener('change', async event => {
    const target = event.target as HTMLInputElement;
    const isEnabled = target.checked;
    updateIcon(isEnabled);
    updateStatusContainer(isEnabled);
    chrome.storage.local.set({ isEnabled });
  });
});
