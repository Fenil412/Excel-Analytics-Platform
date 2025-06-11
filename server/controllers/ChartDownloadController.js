const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const { ChartJSNodeCanvas } = require("chartjs-node-canvas")
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const ChartExportUtils = require('../utils/ChartExportUtils'); // Assuming you have a utility for chart data validation

class ChartDownloadController {
  constructor() {
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: 800,
      height: 600,
      backgroundColour: 'white'
    });
  }

  // Download chart as image (PNG/JPEG)
  static async downloadChartImage(req, res) {
  try {
    console.log('Received request for chart image download');
    const { format = 'png', width = 800, height = 600 } = req.query;
    const { chartConfig, title } = req.body;

    console.log('Query params:', { format, width, height });
    console.log('Request body:', JSON.stringify({ chartConfig, title }, null, 2));

    if (!chartConfig) {
      console.log('Missing chartConfig');
      return res.status(400).json({
        success: false,
        message: 'Chart configuration is required'
      });
    }

    console.log('Validating chartConfig');
    ChartExportUtils.validateChartData(chartConfig.data, chartConfig.type);

    console.log('Initializing chartJSNodeCanvas');
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width: parseInt(width),
      height: parseInt(height),
      backgroundColour: 'white'
    });

    console.log('Rendering chart to buffer');
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(chartConfig, format);
    console.log('Chart rendered, buffer length:', imageBuffer.length);

    const filename = `chart_${title || 'export'}_${Date.now()}.${format}`;
    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', imageBuffer.length);

    console.log('Sending response');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating chart image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate chart image',
      error: error.message
    });
  }
}

  // Download chart data as Excel
  static async downloadChartExcel(req, res) {
    try {
      const { chartData, title, metadata } = req.body;

      if (!chartData) {
        return res.status(400).json({
          success: false,
          message: 'Chart data is required'
        });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Chart Data');

      // Add title
      if (title) {
        worksheet.addRow([title]);
        worksheet.getRow(1).font = { bold: true, size: 16 };
        worksheet.addRow([]);
      }

      // Add metadata if available
      if (metadata) {
        worksheet.addRow(['Chart Metadata:']);
        worksheet.getRow(worksheet.rowCount).font = { bold: true };

        Object.entries(metadata).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            worksheet.addRow([key, typeof value === 'object' ? JSON.stringify(value) : value]);
          }
        });
        worksheet.addRow([]);
      }

      // Add chart data
      if (chartData.labels && chartData.datasets) {
        // Chart.js format
        const headers = ['Label', ...chartData.datasets.map(dataset => dataset.label || 'Dataset')];
        worksheet.addRow(headers);
        worksheet.getRow(worksheet.rowCount).font = { bold: true };

        chartData.labels.forEach((label, index) => {
          const row = [label];
          chartData.datasets.forEach(dataset => {
            row.push(dataset.data[index] || '');
          });
          worksheet.addRow(row);
        });
      } else if (Array.isArray(chartData)) {
        // Raw data array
        if (chartData.length > 0) {
          const headers = Object.keys(chartData[0]);
          worksheet.addRow(headers);
          worksheet.getRow(worksheet.rowCount).font = { bold: true };

          chartData.forEach(row => {
            const values = headers.map(header => row[header] || '');
            worksheet.addRow(values);
          });
        }
      }

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      const filename = `chart_data_${title || 'export'}_${Date.now()}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error generating Excel file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate Excel file',
        error: error.message
      });
    }
  }

  // Download chart data as CSV
  static async downloadChartCSV(req, res) {
    try {
      const { chartData, title } = req.body;

      if (!chartData) {
        return res.status(400).json({
          success: false,
          message: 'Chart data is required'
        });
      }

      let csvContent = '';

      if (chartData.labels && chartData.datasets) {
        // Chart.js format
        const headers = ['Label', ...chartData.datasets.map(dataset => dataset.label || 'Dataset')];
        csvContent += headers.join(',') + '\n';

        chartData.labels.forEach((label, index) => {
          const row = [label];
          chartData.datasets.forEach(dataset => {
            row.push(dataset.data[index] || '');
          });
          csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
      } else if (Array.isArray(chartData)) {
        // Raw data array
        if (chartData.length > 0) {
          const headers = Object.keys(chartData[0]);
          csvContent += headers.join(',') + '\n';

          chartData.forEach(row => {
            const values = headers.map(header => `"${row[header] || ''}"`);
            csvContent += values.join(',') + '\n';
          });
        }
      }

      const filename = `chart_data_${title || 'export'}_${Date.now()}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.send(csvContent);
    } catch (error) {
      console.error('Error generating CSV file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate CSV file',
        error: error.message
      });
    }
  }

  // Download chart as PDF report
  static async downloadChartPDF(req, res) {
    try {
      const { chartConfig, chartData, title, metadata, includeImage = true } = req.body;

      const doc = new PDFDocument();
      const filename = `chart_report_${title || 'export'}_${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      doc.pipe(res);

      // Add title
      doc.fontSize(20).text(title || 'Chart Report', { align: 'center' });
      doc.moveDown();

      // Add metadata
      if (metadata) {
        doc.fontSize(14).text('Chart Information:', { underline: true });
        doc.fontSize(12);

        Object.entries(metadata).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
            doc.text(`${key}: ${displayValue}`);
          }
        });
        doc.moveDown();
      }

      // Add chart image if requested and config provided
      if (includeImage && chartConfig) {
        try {
          const chartJSNodeCanvas = new ChartJSNodeCanvas({
            width: 600,
            height: 400,
            backgroundColour: 'white'
          });

          const imageBuffer = await chartJSNodeCanvas.renderToBuffer(chartConfig, 'png');
          doc.image(imageBuffer, { fit: [500, 300], align: 'center' });
          doc.moveDown();
        } catch (imageError) {
          console.warn('Could not generate chart image for PDF:', imageError.message);
          doc.text('Chart image could not be generated');
          doc.moveDown();
        }
      }

      // Add data table
      if (chartData) {
        doc.fontSize(14).text('Chart Data:', { underline: true });
        doc.fontSize(10);

        if (chartData.labels && chartData.datasets) {
          // Chart.js format
          const headers = ['Label', ...chartData.datasets.map(dataset => dataset.label || 'Dataset')];
          doc.text(headers.join(' | '));
          doc.text('-'.repeat(headers.join(' | ').length));

          chartData.labels.forEach((label, index) => {
            const row = [label];
            chartData.datasets.forEach(dataset => {
              row.push(dataset.data[index] || '');
            });
            doc.text(row.join(' | '));
          });
        } else if (Array.isArray(chartData) && chartData.length > 0) {
          // Raw data array
          const headers = Object.keys(chartData[0]);
          doc.text(headers.join(' | '));
          doc.text('-'.repeat(headers.join(' | ').length));

          chartData.slice(0, 50).forEach(row => { // Limit to first 50 rows
            const values = headers.map(header => row[header] || '');
            doc.text(values.join(' | '));
          });

          if (chartData.length > 50) {
            doc.text(`... and ${chartData.length - 50} more rows`);
          }
        }
      }

      // Add footer
      doc.fontSize(8).text(`Generated on ${new Date().toLocaleString()}`, { align: 'right' });

      doc.end();
    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF report',
        error: error.message
      });
    }
  }

  // Get download formats available
  static async getDownloadFormats(req, res) {
    try {
      const formats = {
        image: ['png', 'jpeg'],
        data: ['csv', 'xlsx'],
        report: ['pdf']
      };

      res.json({
        success: true,
        data: formats
      });
    } catch (error) {
      console.error('Error fetching download formats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch download formats',
        error: error.message
      });
    }
  }
}

module.exports = ChartDownloadController;