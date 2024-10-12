chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'block') {
    window.location.href =
      chrome.runtime.getURL('blocked.html') +
      '?blockedUrl=' +
      encodeURIComponent(message.blockedUrl);
  }
  console.log('action - block')
});

// Check if the page should be blocked on load
chrome.runtime.sendMessage({
  action: 'checkBlocked',
  url: window.location.href,
});
