import fs from "fs";

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

export default validateDir;
