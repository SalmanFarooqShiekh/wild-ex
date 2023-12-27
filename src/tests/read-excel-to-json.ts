import {getRefinedDataFromExcel, readExcelToJSON} from "../utils";

// console.log(readExcelToJSON("/home/salman/Downloads/xlsx/3.xls"));
console.log(JSON.stringify(getRefinedDataFromExcel("/home/salman/Downloads/xlsx/3.xls", "4"), null, 4));
