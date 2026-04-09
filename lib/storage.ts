import { AnalysisResult } from "./types";

const STORAGE_KEY = 'production_analyzer_reports';

export function saveReportLocal(report: AnalysisResult): { success: boolean; message: string } {
  try {
    const reports = getSavedReportsLocal();
    const existingIndex = reports.findIndex(r => r.id === report.id);
    
    if (existingIndex >= 0) {
      reports[existingIndex] = report;
    } else {
      reports.push(report);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return { success: true, message: 'Report saved successfully' };
  } catch (error) {
    console.error('Error saving report:', error);
    return { success: false, message: 'Failed to save report' };
  }
}

export function getSavedReportsLocal(): AnalysisResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const reports = JSON.parse(data);
    return reports.map((r: any) => ({
      ...r,
      uploadDate: new Date(r.uploadDate)
    }));
  } catch (error) {
    console.error('Error reading reports:', error);
    return [];
  }
}

export function deleteReportLocal(id: string): { success: boolean; message: string } {
  try {
    const reports = getSavedReportsLocal();
    const filteredReports = reports.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredReports));
    return { success: true, message: 'Report deleted successfully' };
  } catch (error) {
    console.error('Error deleting report:', error);
    return { success: false, message: 'Failed to delete report' };
  }
}
