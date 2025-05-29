const XLSX = require('xlsx');

const parseExcelFile = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  const sheetData = {};
  let totalRows = 0;
  let totalColumns = 0;

  sheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    sheetData[sheetName] = jsonData;
    if (jsonData.length > totalRows) totalRows = jsonData.length;
    if (jsonData[0]?.length > totalColumns) totalColumns = jsonData[0].length;
  });

  return { sheetData, sheetNames, totalRows, totalColumns };
};

module.exports = parseExcelFile;
