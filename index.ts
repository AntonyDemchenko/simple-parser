import puppeteer from "puppeteer";
import fs from "fs";
import axios from "axios";

type CatalogItem = {
  title: string;
  link: string;
  datetime: string;
  imageSrc: string;
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

      if (title && link && datetime && imageSrc) {
        items.push({ title, link, datetime, imageSrc });
      }
    });

    return items;
  });

  await browser.close();

  // Save images
  const imageDir = "./images";
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir);
  }

  for (const [index, item] of data.entries()) {
    const imageName = `image_${index}.jpg`;
    const imageUrl = item.imageSrc;
    const imagePath = `${imageDir}/${imageName}`;
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

  // Write data to JSON file
  const jsonPath = "./data.json";
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

  return;
}

parsePage(examplePageURL);
