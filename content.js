function getWebsiteMetadata() {
  const title = document.querySelector('title')?.innerText || '';
  const description =
    document.querySelector('meta[name="description"]')?.content || '';
  const keywords =
    document.querySelector('meta[name="keywords"]')?.content || '';

  return {
    url: window.location.href,
    title,
    description,
    keywords,
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'block') {
    window.location.href =
      chrome.runtime.getURL('blocked.html') +
      '?blockedUrl=' +
      encodeURIComponent(message.blockedUrl);
  }
});

// Extract metadata and send it to the background script for analysis
const metadata = getWebsiteMetadata();

function sendMessageAsync(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (response.status === 'error') {
        reject(new Error(response.message));
      } else {
        resolve(response);
      }
    });
  });
}

async function analyzeAndCheck() {
  try {
    const metadata = getWebsiteMetadata();

    // First, analyze metadata
    const analysisResponse = await sendMessageAsync({
      action: 'analyzeMetadata',
      metadata: metadata,
    });
    console.log('Analysis complete:', analysisResponse.analysis);

    // Then, check if the page should be blocked
    const blockCheckResponse = await sendMessageAsync({
      action: 'checkBlocked',
      url: window.location.href,
    });
    console.log(
      'Block check complete. Is blocked:',
      blockCheckResponse.isBlocked
    );
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

// Call the async function
analyzeAndCheck();
