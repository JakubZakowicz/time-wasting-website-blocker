import { MetadataAndContent } from './types';
import { Actions } from './actions';

const getWebsiteMetadataAndContent = (): MetadataAndContent => {
  const title = document.querySelector('title')?.innerText || '';
  const metadata: { [key: string]: string } = {};

  const metaTags = document.querySelectorAll('meta');
  metaTags.forEach(meta => {
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    const content = meta.getAttribute('content');
    if (name && content) {
      metadata[name] = content;
    }
  });

  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .map(h => (h as HTMLElement).innerText.trim())
    .filter(Boolean)
    .slice(0, 3);

  const paragraphs = Array.from(document.querySelectorAll('p'))
    .map(p => p.innerText.trim())
    .filter(Boolean)
    .slice(0, 3);

  return {
    title,
    metadata,
    headings,
    paragraphs,
  };
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === Actions.GetMetadataAndContent) {
    sendResponse(getWebsiteMetadataAndContent());
  }

  if (message.action === Actions.Block) {
    window.location.href =
      chrome.runtime.getURL('blocked/blocked.html') +
      '?blockedUrl=' +
      encodeURIComponent(message.url);
  }
});
