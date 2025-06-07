const XLSX = require("xlsx");
const fs = require('fs');
const path = require('path');
const ExcelData = require('../models/ExcelData');
const parseExcelFile = require('../utils/parseExcel');

exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'User ID is required' });

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Empty file" });
    }

    const headers = jsonData[0];
    const rows = jsonData.slice(1);

    const { sheetData, sheetNames, totalRows, totalColumns } = parseExcelFile(filePath);

    const excelDocument = new ExcelData({
      filename: req.file.filename,
      originalName: req.file.originalname,
      username,
      sheetData,
      metadata: {
        fileSize: req.file.size,
        sheetNames,
        totalRows,
        totalColumns,
        headers,
        rowCount: rows.length,
        uploadedAt: new Date(),
      }
    });

    await excelDocument.save();
    fs.unlinkSync(filePath); // cleanup after processing

    res.json({
      message: 'File uploaded and parsed successfully',
      fileId: excelDocument._id,
      metadata: excelDocument.metadata,
      sheetNames
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: 'Server error during upload' });
  }
};

exports.getUserFiles = async (req, res) => {
  try {
    const files = await ExcelData.find({ username: req.params.username }).select('-sheetData');
    res.json(files);
  } catch {
    res.status(500).json({ error: 'Error fetching user files' });
  }
};

exports.getFileData = async (req, res) => {
  try {
    const fileData = await ExcelData.findById(req.params.fileId);
    if (!fileData) return res.status(404).json({ error: 'File not found' });
    res.json(fileData);
  } catch {
    res.status(500).json({ error: 'Error fetching file data' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const fileData = await ExcelData.findById(req.params.fileId);
    if (!fileData) return res.status(404).json({ error: 'File not found' });

    const filePath = path.join('uploads', fileData.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await ExcelData.findByIdAndDelete(req.params.fileId);
    res.json({ message: 'File deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Error deleting file' });
  }
};
