import { getRefinedDataFromExcel, readExcelToJSON } from "../utils";

// console.log(readExcelToJSON("/home/salman/Downloads/xlsx/5.xlsx"));
console.log(
  JSON.stringify(
    getRefinedDataFromExcel({
      inputXlsx: "/home/salman/Downloads/xlsx/6.xlsx",
      numAnnotationsPerId: "4",
      unidentifiedEncounters: true,
    }),
    null,
    4,
  ),
);
