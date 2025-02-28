# Google Maps Review Scraper

A Puppeteer-based scraper that extracts Google Maps reviews by scrolling and capturing XHR requests.

Make sure you have **Node.js (v16+)** installed.

## Running the Scraper

```sh
yarn install
yarn start:dev
```

## Customization

- **Language support:** You can extend the `LANGUAGE_MAP` object to support additional languages by adding translations for buttons and labels.
- **Target URL:** Modify the `GOOGLE_REVIEW_URL` constant to specify the Google Maps location to scrape.

## Disclaimer

This script is for **educational purposes only**. Scraping Google Maps data may violate **Google's Terms of Service**. Use responsibly.
