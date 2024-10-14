chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    console.log('page loaded');

    chrome.tabs.sendMessage(tabId, { action: 'getMetadata' }, response => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }

      if (response) {
        console.log('Metadata:', response);
        // Here you can do whatever you want with the metadata
      }
    });
  }
});
