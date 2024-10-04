import os
import time
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
        for chunk in completion:
            result += chunk.choices[0].delta.content or ""

        return result.strip()
    except Exception as e:
        return f"Error in classification: {str(e)}"

def extract_metadata(page):
    metadata = {}
    meta_elements = page.query_selector_all('meta')
    for meta in meta_elements:
        name = meta.get_attribute('name') or meta.get_attribute('property')
        content = meta.get_attribute('content')
        if name and content:
            metadata[name] = content
    return metadata

def get_first_n_paragraphs(page, n=3):
    paragraphs = page.evaluate(f"""
        () => {{
            const paragraphs = Array.from(document.querySelectorAll('p'));
            return paragraphs.slice(0, {n}).map(p => p.textContent.trim()).filter(text => text.length > 0);
        }}
    """)
    return "\n\n".join(paragraphs)

def extract_website_content(url, max_retries=2, initial_timeout=15000):
    for attempt in range(max_retries):
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    viewport={'width': 1280, 'height': 720},
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                )
                page = context.new_page()

                timeout = initial_timeout * (attempt + 1)
                page.set_default_timeout(timeout)
                page.set_default_navigation_timeout(timeout)

                response = page.goto(url, wait_until="domcontentloaded")
                if response.status >= 400:
                    return f"Error: HTTP status {response.status}"

                page.wait_for_load_state("networkidle", timeout=timeout)

                page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.5)")
                time.sleep(1)

                title = page.title()
                metadata = extract_metadata(page)
                headings = page.locator('h1, h2, h3, h4, h5, h6').all_inner_texts()
                body_content = page.locator('body').inner_text()
                first_paragraphs = get_first_n_paragraphs(page, 5)

                browser.close()

                content = f"Title: {title}\n\n"
                content += "Metadata:\n"
                for key, value in metadata.items():
                    content += f"{key}: {value}\n"
                if headings:
                    content += f"Main Headings: {' | '.join(headings[:6])}\n\n"

                main_body_content = extract_main_content(body_content)
                content += f"Body Content:\n{main_body_content}\n\n"
                content += f"First Paragraph:\n{first_paragraphs}\n\n"

                return content

        except PlaywrightTimeoutError:
            if attempt == max_retries - 1:
                return "Error: Page load timed out after multiple attempts"
        except Exception as e:
            return f"Error extracting content: {str(e)}"

def extract_main_content(body_content):
    clean_content = " ".join(body_content.split())
    return clean_content[:3000]

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
    url = 'https://gamerant.com/far-cry-6-best-loadouts/'
    try:
        result = evaluate_website(url)
        print(f"Classification result for {url}: {result}")
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")