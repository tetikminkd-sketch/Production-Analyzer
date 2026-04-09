
export interface ProjectMetrics {
  projectName: string;
  reference: string;
  quantity: number;
  unitTime: number;
  workedMinutes: number;
  workforce: number;
  absentee: number;
  supportIn: number;
  supportOut: number;
  scrap: number;
  
  // Calculated fields
  totalWorkforce: number;
  usedTime: number;
  productionTime: number;
  efficiency: number;
  netProduction: number;
  qualityRate: number;
}

export interface SheetMetrics {
  sheetName: string;
  projects: ProjectMetrics[];
  totalEfficiency: number;
  totalProductionTime: number;
  totalUsedTime: number;
  bestProject: ProjectMetrics | null;
  worstProject: ProjectMetrics | null;
  idleCapacity: number; // Placeholder for now
  isInactive: boolean;
  totalPersonnel: number;
  absentPersonnel: string[];
  leavePersonnel: string[];
  sickPersonnel: string[];
}

export interface LineStoppage {
  id: string;
  reason: string;
  personnelCount: number;
  durationMinutes: number;
  totalLoss: number; // personnelCount * durationMinutes
  date: string;
}

export interface AnalysisResult {
  id: string;
  reportName: string;
  uploadDate: Date;
  sheets: SheetMetrics[];
  overallEfficiency: number;
  totalProductionTime: number;
  totalUsedTime: number;
  bestProjectOverall: ProjectMetrics | null;
  mostUnstableProject: ProjectMetrics | null;
  language: 'tr' | 'en';
  originalHeaders: string[];
  lineStoppages?: LineStoppage[];
}

export interface Alert {
  type: 'critical' | 'warning' | 'success' | 'info';
  message: string;
  details?: string;
}
