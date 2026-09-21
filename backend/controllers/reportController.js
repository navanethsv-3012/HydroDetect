import { getReportData as fetchReportData, generateCSV, generatePDF } from '../services/reportService.js';

/**
 * GET /api/reports/:period
 * Generate a report for the specified period (daily, weekly, monthly).
 * Query param: format=pdf|csv (default: pdf)
 */
export const getReport = async (req, res, next) => {
  try {
    const { period } = req.params;
    const { format = 'pdf' } = req.query;

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Period must be daily, weekly, or monthly.',
      });
    }

    const reportData = await fetchReportData(period);

    if (format === 'csv') {
      const csv = generateCSV(reportData.readings);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=aquasentinel_${period}_report.csv`);
      return res.send(csv);
    }

    // Default: PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=aquasentinel_${period}_report.pdf`);
    generatePDF(reportData, res);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/:period/data
 * Get raw report data as JSON (for frontend preview).
 */
export const getReportData = async (req, res, next) => {
  try {
    const { period } = req.params;

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Period must be daily, weekly, or monthly.',
      });
    }

    const data = await fetchReportData(period);

    res.status(200).json({
      success: true,
      data: data.stats,
    });
  } catch (error) {
    next(error);
  }
};

export default { getReport, getReportData };
