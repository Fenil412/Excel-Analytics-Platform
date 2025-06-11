const express = require('express');
const { body, query } = require('express-validator');
const ChartDownloadController = require('../controllers/ChartDownloadController');

const router = express.Router();

// Validation middleware for downloads
const validateImageDownload = [
  body('chartConfig')
    .isObject()
    .withMessage('Chart configuration is required'),
  query('format')
    .optional()
    .isIn(['png', 'jpeg'])
    .withMessage('Format must be png or jpeg'),
  query('width')
    .optional()
    .isInt({ min: 100, max: 2000 })
    .withMessage('Width must be between 100 and 2000 pixels'),
  query('height')
    .optional()
    .isInt({ min: 100, max: 2000 })
    .withMessage('Height must be between 100 and 2000 pixels')
];

const validateDataDownload = [
  body('chartData')
    .exists()
    .withMessage('Chart data is required'),
  body('title')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Title must be a string with maximum 100 characters')
];

const validatePDFDownload = [
  body('title')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Title must be a string with maximum 100 characters'),
  body('includeImage')
    .optional()
    .isBoolean()
    .withMessage('includeImage must be a boolean')
];

// Routes
router.post('/download/image', validateImageDownload, ChartDownloadController.downloadChartImage);
router.post('/download/excel', validateDataDownload, ChartDownloadController.downloadChartExcel);
router.post('/download/csv', validateDataDownload, ChartDownloadController.downloadChartCSV);
router.post('/download/pdf', validatePDFDownload, ChartDownloadController.downloadChartPDF);
router.get('/download/formats', ChartDownloadController.getDownloadFormats);

module.exports = router;