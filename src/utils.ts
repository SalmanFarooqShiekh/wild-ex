import sharp from "sharp";
import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import _ from "lodash";

const UNIDENTIFIED_ANNOTATIONS_FOLDER = "Unidentified_annotations";

const cropAndSaveImage = async (
  imageBuffer: ArrayBuffer,
  cropRectangle: number[],
  outputPath: string,
) => {
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

const downloadCropAndSaveImage = async (
  imageUrl: string,
  cropRectangle: number[],
  outputPath: string,
) => {
  console.log({ imageUrl, cropRectangle, outputPath });
  const buffer = await downloadImageToBuffer(imageUrl);
  await cropAndSaveImage(buffer, cropRectangle, outputPath);
};

const readExcelToJSON = (filePath: string): any[] => {
  const workbook: XLSX.WorkBook = XLSX.readFile(filePath);
  return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
};

const shortlistAnnotations = (annotations: Annotation[], maxNum: string): Annotation[] => {
  /*
   * To be shortlisted based on the following criteria:
   *   -> value of maxNum
   *   -> viewpoint of individual annotations
   *   -> no duplicates
   *
   * Q: What is an x-similar viewpoint?
   * A: When any of the straight left/right/front/back viewpoints aren't available,
   *    then replace with a similar viewpoint for each, e.g.:
   *       left => frontleft/backleft
   *       right => frontright/upright
   *       front => frontright/frontup
   *       back => backleft/backup
   *       up => upleft/upright
   *
   * 1:
   *   left
   *   if not available, then right,
   *   if not available, then left-similar
   *   if not available, then right-similar
   *   If not available, then any other viewpoint available
   *
   * 2:
   *   left + right
   *   if any not available, then respectively replace with a similar viewpoint of each
   *   if any still not available, then choose any other viewpoint(s) available to attempt to complete the total of 2
   *
   * 3: left + right + front
   *   if any not available, then respectively replace with a similar viewpoint of each
   *   if any still not available, then choose any other viewpoint(s) available to attempt to complete the total of 3
   *
   * 4:
   *   left + right + front + back
   *   if any not available, then respectively replace with a similar viewpoint of each
   *   if any still not available, then choose any other viewpoint(s) available to attempt to complete the total of 4
   *
   * 5:
   *   left + right + front + back + up
   *   if any not available, then respectively replace with a similar viewpoint of each
   *   if any still not available, then choose any other viewpoint(s) available to attempt to complete the total of 5
   *
   *
   * 6 and 6+:
   *   prefer to fill up the slots on left + right + front + back + up (in this order)
   *   if any not available, then respectively replace with a similar viewpoint of each
   *   if any still not available, then choose any other viewpoint(s) available to attempt to complete the required total at random
   */

  // TODO: implement above logic instead of the following:
  return maxNum === "all" ? annotations : annotations.slice(0, Number(maxNum));
};

const getRefinedDataFromExcel = ({
  inputXlsx,
  numAnnotationsPerId,
  unidentifiedEncounters,
}: {
  inputXlsx: string;
  numAnnotationsPerId: string;
  unidentifiedEncounters: boolean;
}): AnnotationsWithId[] => {
  return Object.entries(
    _.groupBy(
      readExcelToJSON(inputXlsx).map((obj) => {
        return obj["Name0.value"].trim() === ""
          ? { ...obj, "Name0.value": UNIDENTIFIED_ANNOTATIONS_FOLDER }
          : obj;
      }),
      "Name0.value",
    ),
  )
    .filter(
      ([individualId, groups]) =>
        unidentifiedEncounters || individualId !== UNIDENTIFIED_ANNOTATIONS_FOLDER,
    )
    .map(([individualId, groups]): AnnotationsWithId => {
      return {
        individualId: individualId,
        annotations: shortlistAnnotations(
          groups.map((obj) => {
            const i = 0;
            return {
              fileName: obj[`Encounter.mediaAsset${i}`],
              filePath: obj[`Encounter.mediaAsset${i}.filePath`],
              imageUrl: obj[`Encounter.mediaAsset${i}.imageUrl`],
              boundingBox: obj[`Annotation${i}.bbox`],
              viewPoint: obj[`Annotation${i}.Viewoint`],
            };
          }),
          numAnnotationsPerId,
        ),
      };
    });
};

const performFinalSave = async (submitData: SubmitData): Promise<Done> => {
  const wrappingFolder = path.join(submitData.downloadRoot, path.basename(submitData.inputXlsx));
  try {
    fs.mkdirSync(wrappingFolder, { recursive: true });
  } catch (error) {
    return { success: false, message: `Folder exists: ${wrappingFolder}` };
  }

  for (const annotationsWithId of getRefinedDataFromExcel(submitData)) {
    const individualIdFolder = path.join(wrappingFolder, annotationsWithId.individualId);
    try {
      fs.mkdirSync(individualIdFolder, { recursive: true });
    } catch (error) {
      return { success: false, message: `Folder exists: ${individualIdFolder}` };
    }

    for (const annotation of annotationsWithId.annotations) {
      try {
        await downloadCropAndSaveImage(
          annotation.imageUrl,
          annotation.boundingBox.match(/\d+/g).map(Number),
          path.join(individualIdFolder, `${annotation.viewPoint}-${annotation.fileName}`),
        );
      } catch (error) {
        // return { success: false, message: `An error occurred: ${error.message}` };
      }
    }
  }

  return { success: true, message: "All annotations downloaded successfully" };
};

export { downloadCropAndSaveImage, readExcelToJSON, getRefinedDataFromExcel, performFinalSave };
