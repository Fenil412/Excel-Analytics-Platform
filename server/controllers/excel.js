const fs = require('fs');
const path = require('path');
const ExcelData = require('../models/ExcelData');
const parseExcelFile = require('../utils/parseExcel');

exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'User ID is required' });

    const { sheetData, sheetNames, totalRows, totalColumns } = parseExcelFile(req.file.path);

    const excelDocument = new ExcelData({
      filename: req.file.filename,
      originalName: req.file.originalname,
      username,
      sheetData,
      metadata: {
        fileSize: req.file.size,
        sheetNames,
        totalRows,
        totalColumns
      }
    });

    await excelDocument.save();
    res.json({
      message: 'File uploaded and parsed successfully',
      fileId: excelDocument._id,
      metadata: excelDocument.metadata,
      sheetNames
    });
  } catch (err) {
    console.error(err);
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
