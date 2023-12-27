declare module "*.png";

declare type WxSettings = {
  abc: boolean;
  xyz: boolean;
  download_root: string;
};

declare type AnnotationsWithId = {
  individualId: string | null;
  annotations: Annotation[];
};

declare type Annotation = {
  fileName: string;
  filePath: string;
  imageUrl: string;
  boundingBox: string;
  viewPoint: string;
};

declare type SubmitData = {
  downloadRoot: string;
  inputXlsx: string;
  unidentifiedEncounters: boolean;
  numAnnotationsPerId: string;
}

declare type Done = {
  success: boolean;
  message: string;
}
