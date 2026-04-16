'use server';

import fs from 'fs/promises';
import path from 'path';
import { AnalysisResult } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Read reports from file
async function readReportsFromFile(): Promise<AnalysisResult[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(REPORTS_FILE, 'utf-8');
    const reports = JSON.parse(data);
    // Convert date strings back to Date objects
    return reports.map((r: any) => ({
      ...r,
      uploadDate: new Date(r.uploadDate)
    }));
  } catch (error) {
    // If file doesn't exist or is empty, return empty array
    return [];
  }
}

// Save a new report
export async function saveReport(report: AnalysisResult): Promise<{ success: boolean; message: string }> {
  try {
    const reports = await readReportsFromFile();
    
    // Check if report with same ID already exists
    const existingIndex = reports.findIndex(r => r.id === report.id);
    
    if (existingIndex >= 0) {
      // Update existing report
      reports[existingIndex] = report;
    } else {
      // Add new report
      reports.push(report);
    }
    
    await fs.writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
    return { success: true, message: 'Report saved successfully' };
  } catch (error) {
    console.error('Error saving report:', error);
    return { success: false, message: 'Failed to save report' };
  }
}

// Get all saved reports
export async function getSavedReports(): Promise<AnalysisResult[]> {
  return await readReportsFromFile();
}

// Delete a report
export async function deleteReport(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const reports = await readReportsFromFile();
    const filteredReports = reports.filter(r => r.id !== id);
    
    await fs.writeFile(REPORTS_FILE, JSON.stringify(filteredReports, null, 2), 'utf-8');
    return { success: true, message: 'Report deleted successfully' };
  } catch (error) {
    console.error('Error deleting report:', error);
    return { success: false, message: 'Failed to delete report' };
  }
}
