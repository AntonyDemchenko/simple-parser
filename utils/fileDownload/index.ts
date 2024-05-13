import { CatalogItem, FileType } from "../../types";
import fs from "fs";
import axios from "axios";

const downloadFile = async (
  item: CatalogItem,
  fileDirPath: string,
  fileType: FileType
) => {
  const fileExtension = fileType === FileType.IMG ? "JPG" : "PDF";
  const fileTypeName = fileType === FileType.IMG ? "image" : "pdf";
  const fileName = `${fileTypeName}_${item.title}.${fileType}`;
  const fileUrl = fileType === FileType.IMG ? item.imageSrc : item.pdfLink;
  const imagePath = `${fileDirPath}/${fileName}`;
  try {
    const imageResponse = await axios.get(fileUrl, {
      responseType: "stream",
    });
    const imageStream = fs.createWriteStream(imagePath);
    imageResponse.data.pipe(imageStream);
    console.log(`${fileExtension} ${fileName} downloaded successfully.`);
  } catch (error) {
    console.error(
      `Error downloading ${fileExtension} ${fileName}: ${error.message}`
    );
  }
};

export default downloadFile;
