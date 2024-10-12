// Import any necessary libraries for making HTTP requests
// You might need to use a library like axios if you're building with a bundler

const GROQ_API_KEY = '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function getWebsiteMetadata(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const title = doc.querySelector('title')?.innerText || '';
    const description =
      doc.querySelector('meta[name="description"]')?.content || '';
    const keywords = doc.querySelector('meta[name="keywords"]')?.content || '';

    console.log(title, description, keywords);

    return { title, description, keywords };
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return null;
  }
}

async function analyzeWithGroq(metadata) {
  const prompt = `Analyze the following website metadata and determine if the   website is likely to be beneficial or time-wasting. Consider a webpage as "beneficial" if it contains educational, useful, or informative content. Otherwise, consider it a "time-waster" such as content about video games, movies, series etc. Use only one word.
  
  Title: ${metadata.title}
  Description: ${metadata.description}
  Keywords: ${metadata.keywords}
    `;

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0,
    }),
  });


  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  return data.choices[0].message.content;
}

chrome.webNavigation.onCompleted.addListener(async function (details) {
  if (details.frameId === 0) {
    // Only process main frame navigation
    console.log('Visited: ' + details.url);

    const metadata = await getWebsiteMetadata(details.url);
    if (metadata) {
      try {
        const analysis = await analyzeWithGroq(metadata);
        console.log('Groq Analysis:', analysis);

        // Store the result
        chrome.storage.local.get({ visits: [] }, function (result) {
          let visits = result.visits;
          visits.push({
            url: details.url,
            timestamp: new Date().toISOString(),
            analysis: analysis,
          });
          chrome.storage.local.set({ visits: visits });
        });

        // Optionally, you could show a notification here
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Website Analysis',
          message: analysis,
        });
      } catch (error) {
        console.error('Error analyzing with Groq:', error);
      }
    }
  }
});
