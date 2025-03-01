import puppeteer, { Page } from "puppeteer";
import { Server } from "socket.io";

const LANGUAGE_MAP = {
  de: {
    acceptAll: "Alle akzeptieren",
    sort: "Rezensionen sortieren",
    newest: "Neueste",
    filter: "Rezensionen filtern",
  },
  en: {
    acceptAll: "Accept all",
    sort: "Sort reviews",
    newest: "Newest",
    filter: "Filter reviews",
  },
};

export async function scrapePage(
  url: string,
  language: string = "de",
  io?: Server,
  socketId?: string,
): Promise<any> {
  const selectors = LANGUAGE_MAP[language] || LANGUAGE_MAP["de"];

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let results: any[] = [];

  page.on("response", async (response) => {
    if (
      !response.url().startsWith("https://www.google.com/maps/rpc/listugcposts")
    ) {
      return;
    }
    const resText = await response.text();
    const data = JSON.parse(resText.slice(4));
    results.push(data);
    if (io && socketId) {
      io.to(socketId).emit("scrapeData", data);
    }
  });

  try {
    await setupPage(page, url, language);
    await acceptCookies(page, selectors);
    await sortByNewest(page, selectors);
    await scrollAndCaptureXHR(page, selectors);
  } catch (error) {
    console.error("Scraping failed:", error);
    if (io && socketId) {
      io.to(socketId).emit("scrapeError", { error: "Scraping failed." });
    }
    throw error;
  } finally {
    await browser.close();
  }

  return results;
}

async function setupPage(page: Page, url: string, language: string) {
  await page.goto(url + "&hl=" + language);
  await page.setViewport({ width: 1080, height: 1024 });
}

async function acceptCookies(page: Page, selectors: any) {
  await page.locator(`button[aria-label="${selectors.acceptAll}"]`).click();
}

async function sortByNewest(page: Page, selectors: any) {
  await page.locator(`button[aria-label="${selectors.sort}"]`).click();
  await page
    .locator(`div[role="menuitemradio"] ::-p-text(${selectors.newest})`)
    .click();
}

async function scrollAndCaptureXHR(page: Page, selectors: any) {
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
