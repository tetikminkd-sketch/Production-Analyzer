
import * as XLSX from 'xlsx';
import { AnalysisResult, ProjectMetrics, SheetMetrics } from './types';

// Column Mapping Logic
const COLUMN_MAPPINGS = {
  project: ['proje', 'project', 'project name', 'proje adı', 'model'],
  reference: ['referans', 'part reference', 'ref', 'reference', 'parça no', 'part no'],
  quantity: ['adet', 'quantity', 'qty', 'amount', 'miktar', 'üretim adedi'],
  unitTime: ['birim süre', 'unit time', 'cycle time', 'std time', 'süre', 'time'],
  workedMinutes: ['çalışılan süre', 'worked minutes', 'working time', 'shift time', 'vardiya süresi', 'toplam süre'],
  workforce: ['kadro', 'workforce', 'manpower', 'headcount', 'operatör sayısı', 'kişi sayısı'],
  absentee: ['devamsızlık', 'absentee', 'absenteeism', 'absent', 'gelmeyen'],
  supportIn: ['destek gelen', 'support in', 'borrowed', 'gelen destek'],
  supportOut: ['destek giden', 'support out', 'lent', 'giden destek'],
  scrap: ['hurda', 'scrap', 'rejection', 'defect', 'fire'],
};

function normalizeHeader(header: string): string {
  return String(header).trim().toLowerCase();
}

function findColumn(headers: string[], keys: string[]): string | undefined {
  return headers.find(h => keys.some(k => normalizeHeader(h).includes(k)));
}

function detectLanguage(headers: string[]): 'tr' | 'en' {
  const trKeywords = ['proje', 'referans', 'adet', 'süre', 'kadro'];
  const enKeywords = ['project', 'reference', 'quantity', 'time', 'workforce'];

  let trCount = 0;
  let enCount = 0;

  headers.forEach(h => {
    const normalized = normalizeHeader(h);
    if (trKeywords.some(k => normalized.includes(k))) trCount++;
    if (enKeywords.some(k => normalized.includes(k))) enCount++;
  });

  return trCount >= enCount ? 'tr' : 'en';
}

export async function parseExcelFile(file: File): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error("Dosya okunamadı (File could not be read).");
        }

        const data = new Uint8Array(e.target.result as ArrayBuffer);
        let workbook;
        try {
          workbook = XLSX.read(data, { type: 'array' });
        } catch (readError) {
          console.error("XLSX Read Error:", readError);
          throw new Error("Excel dosyası okunamadı. Dosya bozuk veya formatı desteklenmiyor olabilir. (Excel file could not be read. It might be corrupted or unsupported.)");
        }
        
        const sheets: SheetMetrics[] = [];
        let globalLanguage: 'tr' | 'en' = 'en';
        let firstSheetHeaders: string[] = [];
        let processedSheetsCount = 0;

        const IGNORED_SHEET_PATTERNS = ['TASLAK', 'TEMPLATE', 'ÖRNEK', 'SAMPLE', 'BOŞ', 'EMPTY', 'ESKİ', 'OLD'];

        workbook.SheetNames.forEach((sheetName, index) => {
          // Skip ignored sheets
          if (IGNORED_SHEET_PATTERNS.some(pattern => sheetName.toUpperCase().includes(pattern))) {
            console.log(`Skipping sheet "${sheetName}" based on ignore pattern.`);
            return;
          }

          const worksheet = workbook.Sheets[sheetName];
          
          // Extract fixed metrics from M5, M8, M11
          const getFixedCell = (addr: string): number => {
            const cell = worksheet[addr];
            if (!cell) return 0;
            
            // Handle error values like #DIV/0! (#SAYI/0!)
            if (cell.t === 'e') return 0;
            
            if (cell.t === 'n') return Number(cell.v);
            
            const strVal = String(cell.v).trim();
            // Check for specific error strings just in case
            if (strVal.includes('#') || strVal.includes('SAYI/0') || strVal.includes('DIV/0')) return 0;
            
            const cleanVal = strVal.replace(',', '.').replace(/[^0-9.-]/g, '');
            return parseFloat(cleanVal) || 0;
          };

          const m5_ProdTime = getFixedCell('M5');
          const m8_UsedTime = getFixedCell('M8');
          let m11_Efficiency = getFixedCell('M11');
          
          const c14_Personnel = getFixedCell('C14');
          const d14_Personnel = getFixedCell('D14');
          const totalPersonnel = c14_Personnel + d14_Personnel;

          // Extract personnel lists
          const getNamesFromRange = (col: string, startRow: number, endRow: number): string[] => {
            const names: string[] = [];
            for (let r = startRow; r <= endRow; r++) {
              const cell = worksheet[`${col}${r}`];
              if (cell && cell.v) {
                const val = String(cell.v).trim();
                if (val) names.push(val);
              }
            }
            return names;
          };

          const absentPersonnel = getNamesFromRange('L', 17, 26);
          const leavePersonnel = getNamesFromRange('M', 17, 26);
          const sickPersonnel = getNamesFromRange('N', 17, 26);

          // Heuristic: If efficiency is a decimal <= 1 (e.g. 0.85), convert to percentage (85)
          if (m11_Efficiency > 0 && m11_Efficiency <= 1) {
            m11_Efficiency *= 100;
          }
          
          const isInactive = m11_Efficiency === 0;

          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (!jsonData || jsonData.length < 2) return; // Skip empty sheets

          // Find header row (heuristic: row with most string matches to known columns)
          let headerRowIndex = -1;
          let maxMatches = 0;
          
          // Scan first 20 rows to be safe
          for(let i = 0; i < Math.min(jsonData.length, 20); i++) {
             const row = jsonData[i];
             if(!Array.isArray(row)) continue;
             
             const rowStrings = row.map(c => String(c));
             let matches = 0;
             Object.values(COLUMN_MAPPINGS).forEach(keys => {
                if (findColumn(rowStrings, keys)) matches++;
             });
             
             // Require at least 2 matches to consider it a header row to avoid false positives
             if (matches > maxMatches && matches >= 2) {
               maxMatches = matches;
               headerRowIndex = i;
             }
          }

          if (headerRowIndex === -1) {
            console.warn(`Sheet "${sheetName}" skipped: No valid header row found.`);
            return;
          }

          const headers = (jsonData[headerRowIndex] || []).map(h => String(h));
          if (processedSheetsCount === 0) {
            globalLanguage = detectLanguage(headers);
            firstSheetHeaders = headers;
          }
          processedSheetsCount++;

          const rows = jsonData.slice(headerRowIndex + 1);
          const projects: ProjectMetrics[] = [];

          // Map columns
          const colMap = {
            project: findColumn(headers, COLUMN_MAPPINGS.project),
            reference: findColumn(headers, COLUMN_MAPPINGS.reference),
            quantity: findColumn(headers, COLUMN_MAPPINGS.quantity),
            unitTime: findColumn(headers, COLUMN_MAPPINGS.unitTime),
            workedMinutes: findColumn(headers, COLUMN_MAPPINGS.workedMinutes),
            workforce: findColumn(headers, COLUMN_MAPPINGS.workforce),
            absentee: findColumn(headers, COLUMN_MAPPINGS.absentee),
            supportIn: findColumn(headers, COLUMN_MAPPINGS.supportIn),
            supportOut: findColumn(headers, COLUMN_MAPPINGS.supportOut),
            scrap: findColumn(headers, COLUMN_MAPPINGS.scrap),
          };

          rows.forEach(row => {
            const getValue = (colName: string | undefined, defaultVal = 0) => {
              if (!colName) return defaultVal;
              const colIndex = headers.indexOf(colName);
              if (colIndex === -1) return defaultVal;
              const val = row[colIndex];
              // Handle strings that might contain commas or other chars
              if (typeof val === 'string') {
                 const cleanVal = val.replace(/,/g, '.').replace(/[^0-9.-]/g, '');
                 return parseFloat(cleanVal) || defaultVal;
              }
              return typeof val === 'number' ? val : defaultVal;
            };
            
            const getString = (colName: string | undefined, defaultVal = '') => {
                if (!colName) return defaultVal;
                const colIndex = headers.indexOf(colName);
                if (colIndex === -1) return defaultVal;
                return String(row[colIndex] || defaultVal).trim();
            };

            // Skip empty rows
            if (!getString(colMap.project) && !getString(colMap.reference)) return;

            const quantity = getValue(colMap.quantity);
            const unitTime = getValue(colMap.unitTime);
            const workedMinutes = getValue(colMap.workedMinutes);
            const workforce = getValue(colMap.workforce);
            const absentee = getValue(colMap.absentee);
            const supportIn = getValue(colMap.supportIn);
            const supportOut = getValue(colMap.supportOut);
            const scrap = getValue(colMap.scrap);

            // Calculations
            const totalWorkforce = workforce + supportIn - absentee - supportOut;
            const usedTime = workedMinutes * totalWorkforce;
            const productionTime = quantity * unitTime;
            const efficiency = usedTime > 0 ? (productionTime / usedTime) * 100 : 0;
            const netProduction = quantity - scrap;
            const qualityRate = quantity > 0 ? (netProduction / quantity) * 100 : 0;

            if (getString(colMap.project)) {
                projects.push({
                  projectName: getString(colMap.project),
                  reference: getString(colMap.reference),
                  quantity,
                  unitTime,
                  workedMinutes,
                  workforce,
                  absentee,
                  supportIn,
                  supportOut,
                  scrap,
                  totalWorkforce,
                  usedTime,
                  productionTime,
                  efficiency,
                  netProduction,
                  qualityRate,
                });
            }
          });

          // Sheet Aggregations
          const calculatedProdTime = projects.reduce((sum, p) => sum + p.productionTime, 0);
          const calculatedUsedTime = projects.reduce((sum, p) => sum + p.usedTime, 0);
          const calculatedEfficiency = calculatedUsedTime > 0 ? (calculatedProdTime / calculatedUsedTime) * 100 : 0;
          
          // Use fixed values from M5, M8 if available, otherwise fallback to calculated
          const finalProdTime = m5_ProdTime !== 0 ? m5_ProdTime : calculatedProdTime;
          const finalUsedTime = m8_UsedTime !== 0 ? m8_UsedTime : calculatedUsedTime;
          
          // Always calculate efficiency based on final times to ensure consistency and correct percentage scaling
          // Formula: (Production Time / Used Time) * 100
          const finalEfficiency = finalUsedTime > 0 ? (finalProdTime / finalUsedTime) * 100 : 0;

          // Sort projects by efficiency
          projects.sort((a, b) => b.efficiency - a.efficiency);

          sheets.push({
            sheetName,
            projects,
            totalEfficiency: finalEfficiency,
            totalProductionTime: finalProdTime,
            totalUsedTime: finalUsedTime,
            bestProject: projects.length > 0 ? projects[0] : null,
            worstProject: projects.length > 0 ? projects[projects.length - 1] : null,
            idleCapacity: 0, // To be implemented if logic provided
            isInactive,
            totalPersonnel,
            absentPersonnel,
            leavePersonnel,
            sickPersonnel
          });
        });

        if (sheets.length === 0) {
           throw new Error("Hiçbir sayfada geçerli veri bulunamadı. Lütfen sütun başlıklarını kontrol edin (Proje, Adet, Süre, vb.). (No valid data found in any sheet. Please check column headers.)");
        }

        // Overall Aggregations
        const allProjects = sheets.flatMap(s => s.projects);
        const overallProdTime = sheets.reduce((sum, s) => sum + s.totalProductionTime, 0);
        const overallUsedTime = sheets.reduce((sum, s) => sum + s.totalUsedTime, 0);
        const overallEfficiency = overallUsedTime > 0 ? (overallProdTime / overallUsedTime) * 100 : 0;

        // Find best project overall
        let bestProjectOverall: ProjectMetrics | null = null;
        let maxEff = -1;
        
        allProjects.forEach(p => {
            if (p.efficiency > maxEff) {
                maxEff = p.efficiency;
                bestProjectOverall = p;
            }
        });

        resolve({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          reportName: file.name.replace(/\.[^/.]+$/, ""), // Default to filename without extension
          uploadDate: new Date(),
          sheets,
          overallEfficiency,
          totalProductionTime: overallProdTime,
          totalUsedTime: overallUsedTime,
          bestProjectOverall,
          mostUnstableProject: null, // Placeholder
          language: globalLanguage,
          originalHeaders: firstSheetHeaders
        });

      } catch (error: any) {
        console.error("Parse Error:", error);
        reject(error instanceof Error ? error : new Error("Bilinmeyen bir hata oluştu (Unknown error occurred)."));
      }
    };
    
    reader.onerror = (error) => {
        console.error("FileReader Error:", error);
        reject(new Error("Dosya okuma hatası (File reading error)."));
    };
    
    reader.readAsArrayBuffer(file);
  });
}
