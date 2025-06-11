const fs = require('fs').promises;
const path = require('path');

class ChartExportUtils {
  // Generate chart configuration for different chart libraries
  static generateChartJSConfig(chartData, chartType, options = {}) {
    const config = {
      type: chartType,
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!options.title,
            text: options.title || ''
          },
          legend: {
            display: options.showLegend !== false
          }
        },
        ...options.chartOptions
      }
    };

    // Chart type specific configurations
    switch (chartType) {
      case 'bar':
      case 'line':
        config.options.scales = {
          x: {
            display: true,
            title: {
              display: !!options.xAxisLabel,
              text: options.xAxisLabel || ''
            }
          },
          y: {
            display: true,
            title: {
              display: !!options.yAxisLabel,
              text: options.yAxisLabel || ''
            }
          }
        };
        break;
      case 'pie':
      case 'doughnut':
        config.options.plugins.legend.position = 'right';
        break;
    }

    return config;
  }

  // Convert raw data to Chart.js format
  static convertToChartJSFormat(rawData, xField, yFields, chartType = 'bar') {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Invalid data format');
    }

    const labels = rawData.map(row => row[xField]);
    const datasets = [];

    if (Array.isArray(yFields)) {
      yFields.forEach((field, index) => {
        datasets.push({
          label: field,
          data: rawData.map(row => row[field] || 0),
          backgroundColor: this.generateColor(index, 0.6),
          borderColor: this.generateColor(index, 1),
          borderWidth: 1
        });
      });
    } else {
      datasets.push({
        label: yFields,
        data: rawData.map(row => row[yFields] || 0),
        backgroundColor: this.generateColor(0, 0.6),
        borderColor: this.generateColor(0, 1),
        borderWidth: 1
      });
    }

    return { labels, datasets };
  }

  // Generate colors for chart datasets
  static generateColor(index, alpha = 1) {
    const colors = [
      `rgba(54, 162, 235, ${alpha})`,   // Blue
      `rgba(255, 99, 132, ${alpha})`,   // Red
      `rgba(255, 205, 86, ${alpha})`,   // Yellow
      `rgba(75, 192, 192, ${alpha})`,   // Green
      `rgba(153, 102, 255, ${alpha})`,  // Purple
      `rgba(255, 159, 64, ${alpha})`,   // Orange
      `rgba(199, 199, 199, ${alpha})`,  // Grey
      `rgba(83, 102, 255, ${alpha})`    // Indigo
    ];
    
    return colors[index % colors.length];
  }

  // Validate chart data structure
  static validateChartData(chartData, chartType) {
    if (!chartData) {
      throw new Error('Chart data is required');
    }

    if (chartType === 'pie' || chartType === 'doughnut') {
      if (!chartData.labels || !chartData.datasets || chartData.datasets.length === 0) {
        throw new Error('Pie charts require labels and at least one dataset');
      }
    } else if (chartType === 'bar' || chartType === 'line') {
      if (!chartData.labels || !chartData.datasets || chartData.datasets.length === 0) {
        throw new Error('Bar and line charts require labels and at least one dataset');
      }
    }

    return true;
  }

  // Clean filename for downloads
  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }

  // Get file size in human readable format
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Create temporary directory for file operations
  static async createTempDir() {
    const tempDir = path.join(__dirname, '../temp', Date.now().toString());
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  }

  // Clean up temporary files
  static async cleanupTempFiles(dirPath) {
    try {
      await fs.rmdir(dirPath, { recursive: true });
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

module.exports = ChartExportUtils;