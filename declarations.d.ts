declare module "*.png";

declare type AnnotationsWithId = {
  "Name0.value": string | null;
  annotationRows: AnnotationRow[];
};

declare type AnnotationRow = {
  "Encounter.mediaAsset0": string;
  "Encounter.mediaAsset0.filePath": string;
  "Encounter.mediaAsset0.imageUrl": string;
  "Annotation0.bbox": string;
  "Annotation0.Viewoint": Viewpoint;
  wildExErrorMessage?: string;
  [key: string | number]: any; // for other columns in the Excel file
};

declare type SubmitData = {
  downloadRoot: string;
  inputXlsx: string;
  unidentifiedEncounters: boolean;
  numAnnotationsPerId: string;
};

declare type Done = {
  success: boolean;
  message: string;
};
