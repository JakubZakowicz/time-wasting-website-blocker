document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.local.get({ visits: [] }, function (result) {
    let urlList = document.getElementById('urlList');
    result.visits
      .slice(-5)
      .reverse()
      .forEach(function (item) {
        let li = document.createElement('li');
        li.textContent = `${item.url} - ${item.analysis}`;
        urlList.appendChild(li);
      });
  });
});
