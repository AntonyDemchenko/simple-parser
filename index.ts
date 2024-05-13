import puppeteer from "puppeteer";
import fs from "fs";
import axios from "axios";
import validateDir from "./utils/dirValidator";
import { CatalogItem, FileType } from "./types";
import downloadFile from "./utils/fileDownload";

const examplePageURL = "https://www.tus.si/#";

async function parsePage(pageUrl: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(pageUrl);

  let data: CatalogItem[] = [];

  data = await page.evaluate(() => {
    const items: CatalogItem[] = [];
    const catalogueSection = document.querySelector(
      ".section-catalogue-and-magazines"
    );
    const listItems = catalogueSection?.querySelectorAll(".list-item");

    listItems?.forEach((item: any) => {
      const title = item.querySelector("h3 > a")?.innerText;
      const link = item.querySelector("h3 > a")?.href;
      const datetime = item.querySelector("p > time")?.getAttribute("datetime");
      const imageSrc = item
        .querySelector(".card.card-catalogue img")
        ?.getAttribute("src");
      const pdfLink = item.querySelector(
        "figcaption a.link-icon.solid.pdf"
      )?.href;

      if (title && link && datetime && imageSrc && pdfLink) {
        items.push({ title, link, datetime, imageSrc, pdfLink });
      }
    });

    return items;
  });

  await browser.close();

  const catalogFilesDir = "./files";
  validateDir(catalogFilesDir);

  for (const item of data) {
    const imageDirPath = `${catalogFilesDir}/${item.title}/images`;
    validateDir(imageDirPath, { recursive: true });

    const pdfDirPath = `${catalogFilesDir}/${item.title}/pdfs`;
    validateDir(pdfDirPath, { recursive: true });

    // Download images
    if (item.imageSrc) {
      downloadFile(item, imageDirPath, FileType.IMG);
    }

    // Download pdf
    if (item.pdfLink) {
      downloadFile(item, pdfDirPath, FileType.PDF);
    }
  }

  // Write data to JSON file
  const jsonPath = "./data.json";
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

  return;
}

parsePage(examplePageURL);
