interface Metadata {
  url: string;
  title: string;
  description: string;
  keywords: string;
}

function analyzeMetadata(metadata: Metadata) {
  return 'time-waster';
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    console.log('page loaded');

    let metadata: Metadata;

    chrome.tabs.sendMessage(tabId, { action: 'getMetadata' }, response => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }

      if (response) {
        console.log('Metadata:', response);
        metadata = response;

        const result = analyzeMetadata(metadata);

        if (result === 'time-waster') {
          chrome.tabs.sendMessage(tabId, {
            action: 'blockWebsite',
            url: metadata.url,
          });
        }
      }
    });
  }
});
