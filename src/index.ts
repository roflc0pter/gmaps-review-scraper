import puppeteer, { Page } from "puppeteer";
import fs from "fs";

const LANGUAGE_MAP = {
  de: {
    acceptAll: "Alle akzeptieren",
    sort: "Rezensionen sortieren",
    newest: "Neueste",
    filter: "Rezensionen filtern",
  },
};
const GOOGLE_REVIEW_URL = "<your_url_here>&hl=";
const LANGUAGE = "de";
const selectors = LANGUAGE_MAP[LANGUAGE];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  page.on("response", async (response) => {
    if (
      !response.url().startsWith("https://www.google.com/maps/rpc/listugcposts")
    ) {
      return;
    }
    const resText = await response.text();
    const data = JSON.parse(resText.slice(4));
    saveData(data, `${data[1]}.json`);
  });

  await setupPage(page);
  await acceptCookies(page);
  await sortByNewest(page);
  await scrollAndCaptureXHR(page);

  await browser.close();
})();

// Opens the page and sets viewport size
async function setupPage(page: Page) {
  await page.goto(GOOGLE_REVIEW_URL + LANGUAGE);
  await page.setViewport({ width: 1080, height: 1024 });
}

// Accepts cookie consent
async function acceptCookies(page: Page) {
  await page.locator(`button[aria-label="${selectors.acceptAll}"]`).click();
}

// Opens the sorting menu and selects "Newest"
async function sortByNewest(page: Page) {
  await page.locator(`button[aria-label="${selectors.sort}"]`).click();
  await page
    .locator(`div[role="menuitemradio"] ::-p-text(${selectors.newest})`)
    .click();
}

// Scrolls the page and captures XHR requests
async function scrollAndCaptureXHR(page: Page) {
  let retryCount = 0;
  const maxRetries = 3;

  while (true) {
    try {
      if (retryCount >= maxRetries) {
        console.log("Max retries reached.");
        break;
      }

      const lastElement = page.locator(
        `div[aria-label="${selectors.filter}"] ~ div:last-of-type`,
      );
      if (!lastElement) {
        console.log("End of scroll reached");
        break;
      }

      await lastElement.scroll();
      retryCount = 0;
    } catch (err) {
      console.error("Failed", err);
      retryCount += 1;
    }
  }
}

function saveData(data: Record<string, unknown>, filename: string) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}
