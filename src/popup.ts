document.addEventListener('DOMContentLoaded', async () => {
  const toggleSwitch = document.getElementById(
    'toggleSwitch'
  ) as HTMLInputElement;

  chrome.storage.local.get('isEnabled', data => {
    toggleSwitch.checked = data.isEnabled || false;
  });

  toggleSwitch.addEventListener('change', async event => {
    const target = event.target as HTMLInputElement;
    const isEnabled = target.checked;
    chrome.storage.local.set({ isEnabled });
  });
});
