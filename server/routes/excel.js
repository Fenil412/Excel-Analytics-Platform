const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const excelController = require('../controllers/excel');

router.post('/upload-excel', upload.single('excelFile'), excelController.uploadExcel);
router.get('/user-files/:username', excelController.getUserFiles);
router.get('/file-data/:fileId', excelController.getFileData);
router.delete('/delete-file/:fileId', excelController.deleteFile);

module.exports = router;