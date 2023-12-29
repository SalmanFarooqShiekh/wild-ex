import sharp from "sharp";
import XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import _ from "lodash";

import { Viewpoint } from "./constants";
// import { AnnotationRow, AnnotationsWithId, Done, SubmitData } from "../declarations";

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

const shortlistAnnotations = (
  inputAnnotationRows: AnnotationRow[],
  maxNum: string,
): AnnotationRow[] => {
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
   * 3:
   *   left + right + front
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

  const maxNumInt = _.parseInt(maxNum);
  if (maxNum === "all" || maxNumInt >= inputAnnotationRows.length) {
    return inputAnnotationRows;
  }

  const pullAnnotationRow = (
    match: "any" | "similar" | "exact",
    viewpoint?: Viewpoint,
  ): AnnotationRow | undefined => {
    // mutates inputAnnotationRows

    const indexToPull = _.findIndex(inputAnnotationRows, (annotationRow: AnnotationRow) => {
      if (match === "any") return true;
      if (match === "similar") return annotationRow["Annotation0.Viewoint"].includes(viewpoint);
      if (match === "exact") return annotationRow["Annotation0.Viewoint"] === viewpoint;
    });

    if (indexToPull === -1) {
      return undefined;
    }

    return _.first(_.pullAt(inputAnnotationRows, [indexToPull]));
  };

  const pullAnnotationRowPreference1Wise = (viewpoint1: Viewpoint, viewpoint2: Viewpoint) => {
    return (
      pullAnnotationRow("exact", viewpoint1) ||
      pullAnnotationRow("exact", viewpoint2) ||
      pullAnnotationRow("similar", viewpoint1) ||
      pullAnnotationRow("similar", viewpoint2) ||
      pullAnnotationRow("any")
    );
  };

  const pullAnnotationRowPreference2Wise = (viewpoint: Viewpoint) => {
    return (
      pullAnnotationRow("exact", viewpoint) ||
      pullAnnotationRow("similar", viewpoint) ||
      pullAnnotationRow("any")
    );
  };

  if (maxNumInt === 1) {
    return [pullAnnotationRowPreference1Wise(Viewpoint.LEFT, Viewpoint.RIGHT)];
  } else if (maxNumInt > 1) {
    const viewpointPreferenceList: (Viewpoint | "any")[] = [
      Viewpoint.LEFT,
      Viewpoint.RIGHT,
      Viewpoint.FRONT,
      Viewpoint.BACK,
      Viewpoint.UP,
    ];

    const numAny: number = maxNumInt - viewpointPreferenceList.length;
    const anyArray: "any"[] = numAny > 0 ? _.fill(Array(numAny), "any") : [];

    return _.concat(viewpointPreferenceList, anyArray)
      .slice(0, maxNumInt)
      .map((viewpoint: Viewpoint | "any"): AnnotationRow => {
        return viewpoint === "any"
          ? pullAnnotationRow("any")
          : pullAnnotationRowPreference2Wise(viewpoint);
      });
  }
};

const getGroupedAnnotationsFromExcel = ({
  inputXlsx,
  numAnnotationsPerId,
  unidentifiedEncounters,
}: {
  inputXlsx: string;
  numAnnotationsPerId: string;
  unidentifiedEncounters: boolean;
}): AnnotationsWithId[] => {
  const ungroupedJSON = readExcelToJSON(inputXlsx).map((obj) => {
    return obj["Name0.value"].trim() === ""
      ? { ...obj, "Name0.value": UNIDENTIFIED_ANNOTATIONS_FOLDER }
      : obj;
  });

  // TODO: validate at runtime that ungroupedJSON is really of type AnnotationRow[], maybe using something like https://github.com/gcanti/io-ts

  return Object.entries(_.groupBy(ungroupedJSON, "Name0.value"))
    .filter(
      ([individualId, groups]) =>
        unidentifiedEncounters || individualId !== UNIDENTIFIED_ANNOTATIONS_FOLDER,
    )
    .map(([individualId, groups]): AnnotationsWithId => {
      return {
        "Name0.value": individualId,
        annotationRows: shortlistAnnotations(groups, numAnnotationsPerId),
      };
    });
};

const performFinalSave = async (submitData: SubmitData): Promise<Done> => {
  const wrappingFolder = path.join(submitData.downloadRoot, path.basename(submitData.inputXlsx));
  try {
    fs.mkdirSync(wrappingFolder, { recursive: true });
  } catch (error) {
    return { success: false, message: `Couldn't create folder: ${wrappingFolder}.` };
  }

  let annotationsWithIds: AnnotationsWithId[];
  try {
    annotationsWithIds = getGroupedAnnotationsFromExcel(submitData);
  } catch (error) {
    return { success: false, message: `Malformed excel file: ${submitData.inputXlsx}.` };
  }

  const errors: { [key: string]: AnnotationsWithId } = {}; // should be an array really but object property lookups are faster/more convenient than linear search
  for (const annotationsWithId of annotationsWithIds) {
    const individualIdFolder = path.join(wrappingFolder, annotationsWithId["Name0.value"]);
    try {
      fs.mkdirSync(individualIdFolder, { recursive: true });
    } catch (error) {
      errors[annotationsWithId["Name0.value"]] = {
        "Name0.value": annotationsWithId["Name0.value"],
        annotationRows: annotationsWithId["annotationRows"].map((annotationRow: AnnotationRow) => {
          return {
            ...annotationRow,
            wildExErrorMessage: `Couldn't create folder: ${individualIdFolder}.`,
          };
        }),
      };
      continue;
    }

    for (const annotationRow of annotationsWithId.annotationRows) {
      try {
        await downloadCropAndSaveImage(
          annotationRow["Encounter.mediaAsset0.imageUrl"],
          annotationRow["Annotation0.bbox"].match(/\d+/g).map(Number),
          path.join(
            individualIdFolder,
            `${annotationRow["Annotation0.Viewoint"]} - ${annotationRow["Encounter.mediaAsset0"]}`,
          ),
        );
      } catch (error) {
        const errorAnnotationRow: AnnotationRow = {
          ...annotationRow,
          wildExErrorMessage: error.message,
        };
        if (_.has(errors, annotationsWithId["Name0.value"])) {
          errors[annotationsWithId["Name0.value"]].annotationRows.push(errorAnnotationRow);
        } else {
          errors[annotationsWithId["Name0.value"]] = {
            "Name0.value": annotationsWithId["Name0.value"],
            annotationRows: [errorAnnotationRow],
          };
        }
      }
    }
  }

  const errorsExcelJSON: AnnotationRow[] = _.flatMap(Object.values(errors), "annotationRows");

  const errorsExcelFilePath = path.join(wrappingFolder, path.basename(submitData.inputXlsx));
  fs.existsSync(errorsExcelFilePath) && fs.unlinkSync(errorsExcelFilePath); // delete the file if it already exists

  if (errorsExcelJSON.length) {
    const worksheet = XLSX.utils.json_to_sheet(errorsExcelJSON);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");
    XLSX.writeFile(workbook, errorsExcelFilePath, { compression: true });

    return {
      success: false,
      message: `${errorsExcelJSON.length} annotations couldn't be downloaded, retry with fixed ${errorsExcelFilePath} to resume.`,
    };
  } else {
    return { success: true, message: "All annotations downloaded successfully." };
  }
};

export {
  downloadCropAndSaveImage,
  readExcelToJSON,
  getGroupedAnnotationsFromExcel,
  performFinalSave,
};
