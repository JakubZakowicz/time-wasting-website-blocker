# Time-wasting website blocker ![icon](public/icons/icon32.png)

Chrome extension that blocks time-wasting websites to keep you more focused and productive. 

## How does it work?

This extension takes metadata and first three headers and paragraphs from the website, passes them to llama3-8b-8192 model deployed on [GroqCloud](https://groq.com/), which decides if the website is beneficial or time-wasting.

## Extension disabled
![image1](public/images/image-1.png)

## Extension enabled
![image2](public/images/image-2.png)