interface Visit {
  url: string;
  timestamp: string;
  analysis: string;
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.local.get(
    { visits: [] },
    function (result: { visits: Visit[] }) {
      let urlList = document.getElementById(
        'urlList'
      ) as HTMLUListElement | null;

      if (urlList) {
        result.visits
          .slice(-5) // Get the last 5 visits
          .reverse() // Reverse to display the most recent ones first
          .forEach(function (item: Visit) {
            let li = document.createElement('li');
            li.textContent = `${item.url} - ${item.analysis}`;
            urlList.appendChild(li);
          });
      }
    }
  );
});
