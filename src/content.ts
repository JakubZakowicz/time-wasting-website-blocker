function getWebsiteMetadata() {
  const title = document.querySelector('title')?.innerText || '';
  const description =
    (document.querySelector('meta[name="description"]') as HTMLMetaElement)
      ?.content || '';
  const keywords =
    (document.querySelector('meta[name="keywords"]') as HTMLMetaElement)
      ?.content || '';

  return {
    url: window.location.href,
    title,
    description,
    keywords,
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getMetadata') {
    sendResponse(getWebsiteMetadata());
  }

  if (message.action === 'blockWebsite') {
    console.log('blocking')
    window.location.href =
      chrome.runtime.getURL('blocked.html') +
      '?blockedUrl=' +
      encodeURIComponent(message.url);
  }
});
