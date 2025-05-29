const mongoose = require('mongoose');

const excelDataSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  uploadTime: { type: Date, default: Date.now },
  username: { type: String, required: true },
  sheetData: { type: Object, required: true },
  metadata: {
    fileSize: Number,
    sheetNames: [String],
    totalRows: Number,
    totalColumns: Number
  }
});

module.exports = mongoose.model('ExcelData', excelDataSchema);
