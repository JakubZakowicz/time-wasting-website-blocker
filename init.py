import os
import requests
from bs4 import BeautifulSoup
from groq import Groq

client = Groq(api_key=os.environ['API_KEY'])

def classify_website_content(content):
    prompt = f"""
        I will give you a webpage content, and you will classify it as either 'beneficial' or 'time-waster'. 
        Consider a webpage as 'beneficial' if it contains educational, useful, or informative content.
        Otherwise, consider it a 'time-waster' such as content about video games, movies, series etc.

        Webpage content: {content}

        How would you classify this page?
        Use only one word. Either 'beneficial' or 'time-waster'.
        """
    try:
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0,
            max_tokens=1024,
            top_p=1,
            stream=True,
            stop=None,
        )

        result = ""

        print(content)

        for chunk in completion:
             result += chunk.choices[0].delta.content or ""

        return result
    except Exception as e:
        return f"Error occurred: {str(e)}"

def extract_website_content(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        html_content = response.text

        soup = BeautifulSoup(html_content, 'html.parser')

        text_content = soup.get_text(separator=' ', strip=True)

        return text_content

    except requests.exceptions.RequestException as e:
        return f"Failed to fetch website content: {str(e)}"

def evaluate_website(url):
    content = extract_website_content(url)

    print(content)

    if not content or 'Failed to fetch' in content:
        return content

    classification = classify_website_content(content)

    return classification

if __name__ == '__main__':
    url = 'https://www.youtube.com/watch?v=PI6VA8ZNL-0&ab_channel=HacksmithIndustries'

    result = evaluate_website(url)

    print(f"Classification result for {url}: {result}")

