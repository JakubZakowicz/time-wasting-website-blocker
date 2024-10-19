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

document.addEventListener('DOMContentLoaded', async () => {
  const toggleSwitch = document.getElementById(
    'toggleSwitch'
  ) as HTMLInputElement;

  chrome.storage.local.get('isEnabled', data => {
    toggleSwitch.checked = data.isEnabled || false;
    updateIcon(data.isEnabled);
    updateStatusContainer(data.isEnabled);
  });

  toggleSwitch.addEventListener('change', async event => {
    const target = event.target as HTMLInputElement;
    const isEnabled = target.checked;
    updateIcon(isEnabled);
    updateStatusContainer(isEnabled);
    chrome.storage.local.set({ isEnabled });
  });
});
