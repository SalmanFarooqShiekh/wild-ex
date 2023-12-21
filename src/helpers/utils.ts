import sharp from "sharp";
import XLSX from "xlsx";

const cropAndSaveImage = async (imageBuffer: ArrayBuffer, cropRectangle: number[], outputPath: string) => {
  return await sharp(imageBuffer)
    .extract({
      left: cropRectangle[0],
      top: cropRectangle[1],
      width: cropRectangle[2],
      height: cropRectangle[3],
    })
    .withMetadata()
    .toFile(outputPath);
};

const downloadImageToBuffer = async (imageUrl: string) => {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Failed to download image, status ${response.status}`);
  }

  return await response.arrayBuffer();
};

const downloadCropAndSaveImage = async (imageUrl: string, cropRectangle: number[], outputPath: string) => {
  const buffer = await downloadImageToBuffer(imageUrl);
  await cropAndSaveImage(buffer, cropRectangle, outputPath);
};

const readExcelToJSON = (filePath: string): any[] => {
  const workbook: XLSX.WorkBook = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
};

export { downloadCropAndSaveImage, readExcelToJSON };
