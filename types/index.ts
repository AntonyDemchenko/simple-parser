export type CatalogItem = {
  title: string;
  link: string;
  datetime: string;
  imageSrc: string;
  pdfLink?: string;
};

export enum FileType {
  PDF = "pdf",
  IMG = "jpg",
}
