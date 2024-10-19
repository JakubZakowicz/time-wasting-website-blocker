document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const blockedUrl = urlParams.get('blockedUrl');
  const blockedUrlElement = document.getElementById('blockedUrl');
  if (blockedUrlElement) {
    blockedUrlElement.textContent = blockedUrl || 'Unknown';
  }
});
