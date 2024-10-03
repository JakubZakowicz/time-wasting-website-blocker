import os
from groq import Groq
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

if 'API_KEY' not in os.environ:
    raise EnvironmentError("API_KEY not found in environment variables")

client = Groq(api_key=os.environ['API_KEY'])

def classify_website_content(content):
    prompt = f"""
        I will give you a webpage content, and you will classify it as either 'beneficial' or 'time-waster'. 
        Consider a webpage as 'beneficial' if it contains educational, useful, or informative content.
        Otherwise, consider it a 'time-waster' such as content about video games, movies, series etc.

        Webpage content: {content}

        How would you classify this page?
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
        for chunk in completion:
            result += chunk.choices[0].delta.content or ""

        return result.strip()
    except Exception as e:
        return f"Error in classification: {str(e)}"

def extract_website_content(url):
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            page.goto(url, timeout=30000)  # 30 seconds timeout

            title = page.title()

            meta_description = page.locator('meta[name="description"]').get_attribute('content')

            headings = page.locator('h1, h2, h3, h4, h5, h6').all_inner_texts()
            body_content = page.text_content('body')

            browser.close()

            content = f"Title: {title}\n\n"
            if meta_description:
                content += f"Meta Description: {meta_description}\n\n"
            if headings:
                content += f"Headings: {' | '.join(headings)}\n\n"

            main_body_content = extract_main_content(body_content)
            content += f"Body Content:\n{main_body_content}"

        return content
    except PlaywrightTimeoutError:
        return "Error: Page load timed out"
    except Exception as e:
        return f"Error extracting content: {str(e)}"

def extract_main_content(body_content):
    clean_content = " ".join(body_content.split())
    return clean_content[:2000]

def evaluate_website(url):
    try:
        content = extract_website_content(url)
        print(content)
        if not content or 'Error' in content:
            return f"Failed to extract content: {content}"

        classification = classify_website_content(content)
        return classification
    except Exception as e:
        return f"Error evaluating website: {str(e)}"

if __name__ == '__main__':
    url = 'https://www.youtube.com/watch?v=PXMJ6FS7llk&list=WL&index=4&ab_channel=freeCodeCamp.org'
    try:
        result = evaluate_website(url)
        print(f"Classification result for {url}: {result}")
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")