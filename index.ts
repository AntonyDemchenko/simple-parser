import puppeteer from "puppeteer";
import fs from "fs";
import axios from "axios";

type CatalogItem = {
  title: string;
  link: string;
  datetime: string;
  imageSrc: string;
  pdfLink?: string;
};

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

  const validateDir = (
    path: string,
    options: { recursive: boolean } = { recursive: false }
  ) => {
    try {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: options.recursive });
      }
    } catch (error) {
      console.error(`Failed to create directory ${path}: ${error}`);
    }
  };

  const catalogFilesDir = "./files";
  validateDir(catalogFilesDir);

  for (const item of data) {
    const imageDirPath = `${catalogFilesDir}/${item.title}/images`;
    validateDir(imageDirPath, { recursive: true });

    const pdfDirPath = `${catalogFilesDir}/${item.title}/pdfs`;
    validateDir(pdfDirPath, { recursive: true });

    // Download images
    if (item.imageSrc) {
      const imageName = `image_${item.title}.jpg`;
      const imageUrl = item.imageSrc;
      const imagePath = `${imageDirPath}/${imageName}`;
      try {
        const imageResponse = await axios.get(imageUrl, {
          responseType: "stream",
        });
        const imageStream = fs.createWriteStream(imagePath);
        imageResponse.data.pipe(imageStream);
        console.log(`Image ${imageName} downloaded successfully.`);
      } catch (error) {
        console.error(`Error downloading image ${imageName}: ${error.message}`);
      }
    }

    // Download pdf
    if (item.pdfLink) {
      const pdfName = `pdf_${item.title}.pdf`;
      const pdfUrl = item.pdfLink;
      const pdfPath = `${pdfDirPath}/${pdfName}`;
      try {
        const pdfResponse = await axios.get(pdfUrl, { responseType: "stream" });
        const pdfStream = fs.createWriteStream(pdfPath);
        pdfResponse.data.pipe(pdfStream);
        console.log(`PDF ${pdfName} downloaded successfully.`);
      } catch (error) {
        console.error(`Error downloading PDF ${pdfName}: ${error}`);
      }
    }
  }

  // Write data to JSON file
  const jsonPath = "./data.json";
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

  return;
}

parsePage(examplePageURL);
