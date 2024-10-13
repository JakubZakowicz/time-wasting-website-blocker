const GROQ_API_KEY = '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "analyzeMetadata") {
    analyzeMetadata(message.metadata, sender.tab.id)
      .then(() => sendResponse({status: "completed"}))
      .catch((error) => sendResponse({status: "error", message: error.message}));
    return true;  // Indicates we will send a response asynchronously
  } else if (message.action === "checkBlocked") {
    checkIfBlocked(message.url, sender.tab.id)
      .then((isBlocked) => sendResponse({status: "completed", isBlocked: isBlocked}))
      .catch((error) => sendResponse({status: "error", message: error.message}));
    return true;  // Indicates we will send a response asynchronously
  }
});

async function analyzeMetadata(metadata, tabId) {
  try {
    const analysis = await analyzeWithGroq(metadata);
    console.log('Groq Analysis:', analysis);

    const result = await chrome.storage.local.get('visits');
    let visits = result.visits || [];
    visits.push({
      url: metadata.url,
      timestamp: new Date().toISOString(),
      analysis: analysis,
    });
    await chrome.storage.local.set({ visits: visits });

    if (analysis.toLowerCase().includes('time-wasting')) {
      await chrome.tabs.sendMessage(tabId, { action: "block", blockedUrl: metadata.url });
    }

    // chrome.notifications.create({
    //   type: 'basic',
    //   iconUrl: 'icons/icon48.png',
    //   title: 'Website Analysis',
    //   message: analysis,
    // });

    return { status: "completed", analysis: analysis };
  } catch (error) {
    console.error('Error analyzing with Groq:', error);
    throw error;
  }
}

async function checkIfBlocked(url, tabId) {
  try {
    console.log('checkBlocked')
    const result = await chrome.storage.local.get('visits');
    const visits = result.visits || [];
    const recentVisits = visits.filter(v => 
      new Date(v.timestamp) > new Date(Date.now() - 5 * 60 * 1000)
    );
    const matchingVisit = recentVisits.find(v => v.url === url);
    
    const isBlocked = matchingVisit && matchingVisit.analysis.toLowerCase().includes('time-waster');
    
    if (isBlocked) {
      await chrome.tabs.sendMessage(tabId, { action: "block", blockedUrl: url });
    }

    return isBlocked;
  } catch (error) {
    console.error('Error checking if blocked:', error);
    throw error;
  }
}