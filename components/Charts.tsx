'use client';

import { AnalysisResult } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell, ReferenceLine, AreaChart, Area, LabelList } from 'recharts';
import { useState, useMemo, useRef, useCallback } from 'react';
import { Language, translations } from '@/lib/i18n';
import * as XLSX from 'xlsx';
import { Download, Image as ImageIcon, Settings2, Palette, BarChart2, LineChart as LineChartIcon, Activity } from 'lucide-react';
import { toPng } from 'html-to-image';

interface ChartsProps {
  data: AnalysisResult;
  reports: AnalysisResult[];
  language?: Language;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6366f1'];

const CustomBadgeLabel = (props: any) => {
  const { x, y, value, stroke, fill, unit = "%", language = 'en', disableNotWorked = false } = props;
  if (value === undefined || value === null) return null;
  
  const t = translations[language as Language];
  
  if (value === 0 && !disableNotWorked) {
    const textVal = t.notWorked;
    const width = Math.max(70, textVal.length * 7.5);
    return (
      <g transform={`translate(${x},${y})`}>
        <rect
          x={-(width / 2)}
          y={-24}
          width={width}
          height={18}
          fill="#ef4444"
          rx={4}
        />
        <text
          x={0}
          y={-11}
          fill="#ffffff"
          fontSize={10}
          fontWeight="600"
          textAnchor="middle"
        >
          {textVal}
        </text>
      </g>
    );
  }
  
  const bgColor = stroke || fill || "#3b82f6";
  const textVal = `${value}${unit}`;
  const width = Math.max(36, textVal.length * 7.5);
  
  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        x={-(width / 2)}
        y={-24}
        width={width}
        height={18}
        fill={bgColor}
        rx={4}
      />
      <text
        x={0}
        y={-11}
        fill="#ffffff"
        fontSize={11}
        fontWeight="600"
        textAnchor="middle"
      >
        {textVal}
      </text>
    </g>
  );
};

export default function Charts({ data, reports, language = 'en' }: ChartsProps) {
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [prodVsUsedSelectedProject, setProdVsUsedSelectedProject] = useState<string>('ALL');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [projectColors, setProjectColors] = useState<Record<string, string>>({
    'ALL': '#3b82f6',
    'DENSO TOPLAM': '#8b5cf6',
    'AISIN': '#10b981',
    'AUTOLIV': '#f97316',
    'ITALY': '#ef4444',
    'PSA': '#06b6d4',
    'SABİTLER': '#eab308',
    'TOGG': '#ec4899',
  });
  const currentChartColor = projectColors[selectedProject] || '#3b82f6';
  const prodVsUsedChartColor = projectColors[prodVsUsedSelectedProject] || '#3b82f6';
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProdVsUsedSettingsOpen, setIsProdVsUsedSettingsOpen] = useState(false);
  const [prodVsUsedChartType, setProdVsUsedChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [isWorkforceSettingsOpen, setIsWorkforceSettingsOpen] = useState(false);
  const [workforceChartType, setWorkforceChartType] = useState<'line' | 'bar' | 'area'>('bar');
  const t = translations[language];

  const trendChartRef = useRef<HTMLDivElement>(null);
  const sheetEfficiencyRef = useRef<HTMLDivElement>(null);
  const prodVsUsedRef = useRef<HTMLDivElement>(null);
  const workforceRef = useRef<HTMLDivElement>(null);
  const workforceDistRef = useRef<HTMLDivElement>(null);
  const stoppageRef = useRef<HTMLDivElement>(null);
  const absenteeismRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = useCallback((ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (ref.current === null) return;
    
    toPng(ref.current, { 
      cacheBust: true,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
      filter: (node) => {
        if (node.classList && node.classList.contains('exclude-from-export')) {
          return false;
        }
        return true;
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Error downloading chart:', err);
      });
  }, []);

  const handleChartClick = (state: any) => {
    if (state && state.activeLabel) {
      const clickedName = state.activeLabel;
      // Try to match clicked sheet name with a project name
      const match = allProjectNames.find(p => 
        p === clickedName || 
        p.toLowerCase() === clickedName.toLowerCase() ||
        p.includes(clickedName) || 
        clickedName.includes(p)
      );
      
      if (match) {
        setSelectedProject(match);
      }
    }
  };

  const sheetData = data.sheets.map(s => ({
    name: s.sheetName,
    efficiency: parseFloat(s.totalEfficiency.toFixed(2)),
    production: parseFloat(s.totalProductionTime.toFixed(2)),
    used: parseFloat(s.totalUsedTime.toFixed(2)),
    workforce: s.totalPersonnel,
    isInactive: s.isInactive
  })).sort((a, b) => a.name.localeCompare(b.name));

  // Get all unique names (prioritize sheet names as they represent "projects" in the sheet efficiency chart)
  const allProjectNames = (() => {
    const names = new Set<string>();
    reports.forEach(r => {
      r.sheets.forEach(s => {
        // Add sheet name (this is what is shown in Sheet Efficiency chart)
        if (s.sheetName) names.add(s.sheetName);
        // Also add internal project names if they differ
        s.projects.forEach(p => {
          if (p.projectName && p.projectName !== s.sheetName) {
            names.add(p.projectName);
          }
        });
      });
    });
    return Array.from(names).sort();
  })();

  // Calculate date range from reports
  const dateRange = useMemo(() => {
    if (!reports || reports.length === 0) return '';
    const sortedReports = [...reports].sort((a, b) => 
      a.reportName.localeCompare(b.reportName)
    );
    const firstDate = sortedReports[0].reportName;
    const lastDate = sortedReports[sortedReports.length - 1].reportName;
    
    if (firstDate === lastDate) return firstDate;
    return `${firstDate} - ${lastDate}`;
  }, [reports]);

  // Prepare trend data based on selection
  const trendData = useMemo(() => {
    // Sort reports by report name ascending (A to Z)
    const sortedReports = [...reports].sort((a, b) => 
      a.reportName.localeCompare(b.reportName)
    );

    return sortedReports.map(report => {
      let efficiency = 0;
      
      if (selectedProject === 'ALL') {
        // Calculate overall efficiency for the day: Total Production Time / Total Used Time
        efficiency = report.totalUsedTime > 0 
          ? (report.totalProductionTime / report.totalUsedTime) * 100 
          : 0;
      } else if (selectedProject === 'DENSO TOPLAM') {
        let densoProdTime = 0;
        let densoUsedTime = 0;
        let found = false;
        
        const targetSheets = ['ITALY', 'PSA', 'TOGG', 'SABİTLER'];
        
        report.sheets.forEach(s => {
          if (targetSheets.includes(s.sheetName.toUpperCase())) {
            densoProdTime += s.totalProductionTime;
            densoUsedTime += s.totalUsedTime;
            found = true;
          }
        });
        
        if (found && densoUsedTime > 0) {
          efficiency = (densoProdTime / densoUsedTime) * 100;
        } else {
          efficiency = 0;
        }
      } else {
        // 1. Try to find a Sheet with this name (matches Sheet Efficiency Chart logic)
        const matchingSheet = report.sheets.find(s => s.sheetName === selectedProject);
        
        if (matchingSheet) {
          // Use the pre-calculated total efficiency of the sheet
          efficiency = matchingSheet.totalEfficiency;
        } else {
          // 2. Fallback: Find specific projects inside sheets
          let projProdTime = 0;
          let projUsedTime = 0;
          let found = false;
          
          report.sheets.forEach(s => {
            const project = s.projects.find(p => p.projectName === selectedProject);
            if (project) {
              projProdTime += project.productionTime;
              projUsedTime += project.usedTime;
              found = true;
            }
          });
          
          if (found && projUsedTime > 0) {
            efficiency = (projProdTime / projUsedTime) * 100;
          } else {
            efficiency = 0;
          }
        }
      }

      return {
        date: report.reportName, // Use report name as date label
        efficiency: parseFloat(efficiency.toFixed(2)),
        timestamp: new Date(report.uploadDate).getTime() // For sorting if needed
      };
    });
  }, [reports, selectedProject]);

  // Calculate production vs used time trend data based on selection
  const productionVsUsedTimeData = useMemo(() => {
    const sortedReports = [...reports].sort((a, b) => 
      a.reportName.localeCompare(b.reportName)
    );

    return sortedReports.map(report => {
      let production = 0;
      let used = 0;
      
      if (prodVsUsedSelectedProject === 'ALL') {
        production = report.totalProductionTime;
        used = report.totalUsedTime;
      } else if (prodVsUsedSelectedProject === 'DENSO TOPLAM') {
        const targetSheets = ['ITALY', 'PSA', 'TOGG', 'SABİTLER'];
        report.sheets.forEach(s => {
          if (targetSheets.includes(s.sheetName.toUpperCase())) {
            production += s.totalProductionTime;
            used += s.totalUsedTime;
          }
        });
      } else {
        const matchingSheet = report.sheets.find(s => s.sheetName === prodVsUsedSelectedProject);
        if (matchingSheet) {
          production = matchingSheet.totalProductionTime;
          used = matchingSheet.totalUsedTime;
        } else {
          report.sheets.forEach(s => {
            const project = s.projects.find(p => p.projectName === prodVsUsedSelectedProject);
            if (project) {
              production += project.productionTime;
              used += project.usedTime;
            }
          });
        }
      }

      return {
        date: report.reportName,
        production: parseFloat(production.toFixed(2)),
        used: parseFloat(used.toFixed(2)),
        timestamp: new Date(report.uploadDate).getTime()
      };
    });
  }, [reports, prodVsUsedSelectedProject]);

  // Calculate workforce distribution trend data based on selection
  const workforceDistributionData = useMemo(() => {
    const sortedReports = [...reports].sort((a, b) => 
      a.reportName.localeCompare(b.reportName)
    );

    return sortedReports.map(report => {
      let total = 0;
      let absent = 0;
      let leave = 0;
      let sick = 0;
      let working = 0;
      
      if (selectedProject === 'ALL') {
        report.sheets.forEach(s => {
          total += s.totalPersonnel;
          absent += s.absentPersonnel.length;
          leave += s.leavePersonnel.length;
          sick += s.sickPersonnel.length;
        });
      } else if (selectedProject === 'DENSO TOPLAM') {
        const targetSheets = ['ITALY', 'PSA', 'TOGG', 'SABİTLER'];
        report.sheets.forEach(s => {
          if (targetSheets.includes(s.sheetName.toUpperCase())) {
            total += s.totalPersonnel;
            absent += s.absentPersonnel.length;
            leave += s.leavePersonnel.length;
            sick += s.sickPersonnel.length;
          }
        });
      } else {
        const matchingSheet = report.sheets.find(s => s.sheetName === selectedProject);
        if (matchingSheet) {
          total = matchingSheet.totalPersonnel;
          absent = matchingSheet.absentPersonnel.length;
          leave = matchingSheet.leavePersonnel.length;
          sick = matchingSheet.sickPersonnel.length;
        } else {
          report.sheets.forEach(s => {
            const project = s.projects.find(p => p.projectName === selectedProject);
            if (project) {
              total += project.workforce;
              absent += project.absentee;
            }
          });
        }
      }

      working = total - absent - leave - sick;

      return {
        date: report.reportName,
        total,
        working,
        absent,
        leave,
        sick,
        timestamp: new Date(report.uploadDate).getTime()
      };
    });
  }, [reports, selectedProject]);

  // Calculate absenteeism trend data
  const absenteeismData = useMemo(() => {
    const sortedReports = [...reports].sort((a, b) => 
      a.reportName.localeCompare(b.reportName)
    );

    return sortedReports.map(report => {
      let totalAbsent = 0;
      let totalLeave = 0;
      let totalSick = 0;
      let totalWorkforce = 0;

      report.sheets.forEach(s => {
        totalAbsent += s.absentPersonnel.length;
        totalLeave += s.leavePersonnel.length;
        totalSick += s.sickPersonnel.length;
        totalWorkforce += s.totalPersonnel;
      });

      const totalAbsenteeism = totalAbsent + totalLeave + totalSick;
      const rate = totalWorkforce > 0 ? (totalAbsenteeism / totalWorkforce) * 100 : 0;

      return {
        date: report.reportName,
        rate: parseFloat(rate.toFixed(2)),
        timestamp: new Date(report.uploadDate).getTime()
      };
    });
  }, [reports]);

  // Calculate stoppage trend data
  const stoppageTrendData = useMemo(() => {
    const sortedReports = [...reports].sort((a, b) => 
      a.reportName.localeCompare(b.reportName)
    );

    return sortedReports.map(report => {
      const totalStoppageLoss = report.lineStoppages?.reduce((sum, s) => sum + s.totalLoss, 0) || 0;
      const totalUsedTime = report.totalUsedTime || 0;
      
      const rate = totalUsedTime > 0 ? (totalStoppageLoss / totalUsedTime) * 100 : 0;

      return {
        date: report.reportName,
        rate: parseFloat(rate.toFixed(2)),
        timestamp: new Date(report.uploadDate).getTime()
      };
    });
  }, [reports]);

  const projectData = data.sheets.flatMap(s => s.projects.map(p => ({
    name: p.projectName,
    efficiency: parseFloat(p.efficiency.toFixed(2)),
    sheet: s.sheetName
  }))).slice(0, 10); // Top 10 for readability

  const getTargetForProject = (project: string) => {
    switch (project.toUpperCase()) {
      case 'ALL': return 95;
      case 'AISIN': return 150;
      case 'AUTOLIV': return 85;
      case 'ITALY': return 100;
      case 'PSA': return 100;
      case 'SABİTLER': return 80;
      case 'TOGG': return 90;
      default: return 85;
    }
  };

  const currentTarget = getTargetForProject(selectedProject);
  const maxEfficiency = trendData.length > 0 ? Math.max(...trendData.map(d => d.efficiency)) : 0;
  const yAxisMax = Math.max(120, currentTarget + 10, maxEfficiency + 10);

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Daily Efficiency Trend Data
    const trendWsData = trendData.map(item => ({
      Date: item.date,
      'Efficiency (%)': item.efficiency,
      Project: selectedProject
    }));
    const trendWs = XLSX.utils.json_to_sheet(trendWsData);
    XLSX.utils.book_append_sheet(wb, trendWs, 'Efficiency Trend');

    // 2. Current Report Sheet Data
    const currentSheetWsData = sheetData.map(item => ({
      'Sheet Name': item.name,
      'Efficiency (%)': item.efficiency,
      'Production Time': item.production,
      'Used Time': item.used,
      'Total Workforce': item.workforce,
      'Status': item.isInactive ? 'Inactive' : 'Active'
    }));
    const currentSheetWs = XLSX.utils.json_to_sheet(currentSheetWsData);
    XLSX.utils.book_append_sheet(wb, currentSheetWs, 'Current Report Data');

    // 3. Absenteeism Trend Data
    const absenteeismWsData = absenteeismData.map(item => ({
      Date: item.date,
      'Absenteeism Rate (%)': item.rate
    }));
    const absenteeismWs = XLSX.utils.json_to_sheet(absenteeismWsData);
    XLSX.utils.book_append_sheet(wb, absenteeismWs, 'Absenteeism Trend');

    // 4. Stoppage Trend Data
    const stoppageWsData = stoppageTrendData.map(item => ({
      Date: item.date,
      'Stoppage Rate (%)': item.rate
    }));
    const stoppageWs = XLSX.utils.json_to_sheet(stoppageWsData);
    XLSX.utils.book_append_sheet(wb, stoppageWs, 'Stoppage Trend');

    // Generate Excel file
    XLSX.writeFile(wb, 'chart_data_export.xlsx');
  };

  const renderWorkforceLabel = (props: any) => {
    const { x, y, width, index } = props;
    const data = workforceDistributionData[index];
    if (!data) return null;

    const centerX = x + (width ? width / 2 : 0);
    const centerY = 144; // middle of 288px (h-72)

    const items = [
      { label: 'W', value: data.working, color: '#10b981' },
      { label: 'A', value: data.absent, color: '#ef4444' },
      { label: 'L', value: data.leave, color: '#3b82f6' },
      { label: 'S', value: data.sick, color: '#f97316' }
    ].filter(item => item.value > 0);

    if (items.length === 0) return null;

    const boxHeight = items.length * 14 + 8;
    const boxWidth = 36;

    return (
      <g transform={`translate(${centerX}, ${centerY})`} className="pointer-events-none z-10">
        <rect 
          x={-boxWidth/2} 
          y={-boxHeight/2} 
          width={boxWidth} 
          height={boxHeight} 
          fill="rgba(255, 255, 255, 0.9)" 
          stroke="#e5e7eb" 
          strokeWidth={1}
          rx={4} 
        />
        {items.map((item, i) => (
          <g key={i} transform={`translate(0, ${-boxHeight/2 + 11 + (i * 14)})`}>
            <circle cx={-10} cy={-3} r={3} fill={item.color} />
            <text x={-4} y={0} textAnchor="start" fontSize="10" fill="#4b5563" fontWeight="bold">
              {Math.round(item.value)}
            </text>
          </g>
        ))}
      </g>
    );
  };

  return (
    <div className="mt-8">
      <div className="flex justify-end mb-4 gap-2 relative">
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Settings2 className="w-4 h-4" />
          {t.settings || 'Settings'}
        </button>
        
        {isSettingsOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Chart Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border ${chartType === 'line' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <LineChartIcon className="w-5 h-5 mb-1" />
                  <span className="text-xs">Line</span>
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border ${chartType === 'bar' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <BarChart2 className="w-5 h-5 mb-1" />
                  <span className="text-xs">Bar</span>
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border ${chartType === 'area' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <Activity className="w-5 h-5 mb-1" />
                  <span className="text-xs">Area</span>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4" /> {selectedProject} Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { color: '#3b82f6', name: 'Blue' },
                  { color: '#10b981', name: 'Green' },
                  { color: '#8b5cf6', name: 'Purple' },
                  { color: '#f97316', name: 'Orange' },
                  { color: '#ef4444', name: 'Red' },
                  { color: '#06b6d4', name: 'Cyan' },
                  { color: '#eab308', name: 'Yellow' },
                  { color: '#ec4899', name: 'Pink' },
                  { color: '#64748b', name: 'Slate' },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setProjectColors(prev => ({ ...prev, [selectedProject]: c.color }))}
                    className={`w-8 h-8 rounded-full border-2 ${currentChartColor === c.color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-110'} transition-transform`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleExportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          {t.exportToExcel}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Efficiency Trend */}
        <div ref={trendChartRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {selectedProject === 'ALL' ? `${t.dailyEfficiencyTrend} (${t.overall})` : `${t.dailyEfficiencyTrend}: ${selectedProject}`}
              {dateRange && <span className="ml-2 text-sm font-normal text-gray-500">({dateRange})</span>}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.trackPerformance}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="block w-full sm:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="ALL">{t.allProjects}</option>
              <option value="DENSO TOPLAM">DENSO TOPLAM</option>
              {allProjectNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button 
              onClick={() => handleDownloadImage(trendChartRef, 'daily_efficiency_trend')}
              className="exclude-from-export flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Download as Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="h-72">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={trendData} margin={{ top: 30, right: 30, left: 110, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={{stroke: '#e5e7eb'}} />
                  <YAxis domain={[0, yAxisMax]} tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} formatter={(value: any) => [value === 0 ? t.notWorked : `${value}%`, t.efficiency]} cursor={{stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2}} />
                  <Legend />
                  <ReferenceLine y={currentTarget} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'left', value: `${t.target}: %${currentTarget}`, fill: '#10b981', fontSize: 13, fontWeight: 'bold', offset: 50 }} />
                  <Line 
                    type="linear" 
                    dataKey="efficiency" 
                    name={selectedProject === 'ALL' ? t.totalEfficiency : `${selectedProject} ${t.efficiency}`}
                    stroke={currentChartColor} 
                    strokeWidth={3}
                    dot={{r: 4, fill: currentChartColor, strokeWidth: 2, stroke: '#fff'}}
                    activeDot={{r: 6}}
                    animationDuration={1000}
                    label={<CustomBadgeLabel language={language} unit="%" stroke={currentChartColor} fill={currentChartColor} />}
                  />
                </LineChart>
              ) : chartType === 'bar' ? (
                <BarChart data={trendData} margin={{ top: 30, right: 30, left: 110, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={{stroke: '#e5e7eb'}} />
                  <YAxis domain={[0, yAxisMax]} tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} formatter={(value: any) => [value === 0 ? t.notWorked : `${value}%`, t.efficiency]} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                  <Legend />
                  <ReferenceLine y={currentTarget} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'left', value: `${t.target}: %${currentTarget}`, fill: '#10b981', fontSize: 13, fontWeight: 'bold', offset: 50 }} />
                  <Bar 
                    dataKey="efficiency" 
                    name={selectedProject === 'ALL' ? t.totalEfficiency : `${selectedProject} ${t.efficiency}`}
                    fill={currentChartColor} 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1000}
                    label={<CustomBadgeLabel language={language} unit="%" stroke={currentChartColor} fill={currentChartColor} />}
                  />
                </BarChart>
              ) : (
                <AreaChart data={trendData} margin={{ top: 30, right: 30, left: 110, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentChartColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={currentChartColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={{stroke: '#e5e7eb'}} />
                  <YAxis domain={[0, yAxisMax]} tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} formatter={(value: any) => [value === 0 ? t.notWorked : `${value}%`, t.efficiency]} cursor={{stroke: 'rgba(0,0,0,0.1)', strokeWidth: 2}} />
                  <Legend />
                  <ReferenceLine y={currentTarget} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'left', value: `${t.target}: %${currentTarget}`, fill: '#10b981', fontSize: 13, fontWeight: 'bold', offset: 50 }} />
                  <Area 
                    type="linear" 
                    dataKey="efficiency" 
                    name={selectedProject === 'ALL' ? t.totalEfficiency : `${selectedProject} ${t.efficiency}`}
                    stroke={currentChartColor} 
                    fillOpacity={1}
                    fill="url(#colorEfficiency)"
                    strokeWidth={3}
                    dot={{r: 4, fill: currentChartColor, strokeWidth: 2, stroke: '#fff'}}
                    activeDot={{r: 6}}
                    animationDuration={1000}
                    label={<CustomBadgeLabel language={language} unit="%" stroke={currentChartColor} fill={currentChartColor} />}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
              {t.noHistoricalData}
            </div>
          )}
        </div>
        
        {/* Project Chips for Quick Filtering */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedProject('ALL')}
            className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
              selectedProject === 'ALL' 
                ? 'bg-blue-600 text-white border border-blue-700 shadow-md font-bold scale-105 dark:bg-blue-500 dark:border-blue-400' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent font-medium dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setSelectedProject('DENSO TOPLAM')}
            className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
              selectedProject === 'DENSO TOPLAM' 
                ? 'bg-blue-600 text-white border border-blue-700 shadow-md font-bold scale-105 dark:bg-blue-500 dark:border-blue-400' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent font-medium dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            DENSO TOPLAM
          </button>
          {allProjectNames.map(name => (
            <button
              key={name}
              onClick={() => setSelectedProject(name)}
              className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                selectedProject === name 
                  ? 'bg-blue-600 text-white border border-blue-700 shadow-md font-bold scale-105 dark:bg-blue-500 dark:border-blue-400' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent font-medium dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Production vs Used Time Trend */}
      <div ref={prodVsUsedRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {prodVsUsedSelectedProject === 'ALL' ? `${t.productionVsUsedTimeTrend} (${t.overall})` : `${t.productionVsUsedTimeTrend}: ${prodVsUsedSelectedProject}`}
              {dateRange && <span className="ml-2 text-sm font-normal text-gray-500">({dateRange})</span>}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.trackPerformance}</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto relative">
            <select
              value={prodVsUsedSelectedProject}
              onChange={(e) => setProdVsUsedSelectedProject(e.target.value)}
              className="block w-full sm:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="ALL">{t.allProjects}</option>
              <option value="DENSO TOPLAM">DENSO TOPLAM</option>
              {allProjectNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button
              onClick={() => setIsProdVsUsedSettingsOpen(!isProdVsUsedSettingsOpen)}
              className="exclude-from-export flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors shadow-sm"
              title={t.settings || 'Settings'}
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t.settings || 'Settings'}</span>
            </button>
            <button 
              onClick={() => handleDownloadImage(prodVsUsedRef, 'production_vs_used_time')}
              className="exclude-from-export p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Download as Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {isProdVsUsedSettingsOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Chart Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setProdVsUsedChartType('line')}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border ${prodVsUsedChartType === 'line' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      <LineChartIcon className="w-5 h-5 mb-1" />
                      <span className="text-xs">Line</span>
                    </button>
                    <button
                      onClick={() => setProdVsUsedChartType('bar')}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border ${prodVsUsedChartType === 'bar' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      <BarChart2 className="w-5 h-5 mb-1" />
                      <span className="text-xs">Bar</span>
                    </button>
                    <button
                      onClick={() => setProdVsUsedChartType('area')}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border ${prodVsUsedChartType === 'area' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      <Activity className="w-5 h-5 mb-1" />
                      <span className="text-xs">Area</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> {prodVsUsedSelectedProject} Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { color: '#3b82f6', name: 'Blue' },
                      { color: '#10b981', name: 'Green' },
                      { color: '#8b5cf6', name: 'Purple' },
                      { color: '#f97316', name: 'Orange' },
                      { color: '#ef4444', name: 'Red' },
                      { color: '#06b6d4', name: 'Cyan' },
                      { color: '#eab308', name: 'Yellow' },
                      { color: '#ec4899', name: 'Pink' },
                      { color: '#64748b', name: 'Slate' },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => setProjectColors(prev => ({ ...prev, [prodVsUsedSelectedProject]: c.color }))}
                        className={`w-8 h-8 rounded-full border-2 ${prodVsUsedChartColor === c.color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-110'} transition-transform`}
                        style={{ backgroundColor: c.color }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-72">
          {productionVsUsedTimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {prodVsUsedChartType === 'line' ? (
                <LineChart data={productionVsUsedTimeData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={{stroke: '#e5e7eb'}} />
                  <YAxis tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Legend />
                  <Line type="monotone" dataKey="production" name={t.productionTime} stroke={prodVsUsedChartColor} strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}}>
                    <LabelList 
                      dataKey="production" 
                      content={(props: any) => {
                        const { x, y, value, index } = props;
                        if (!value || value <= 0) return null;
                        const dataPoint = productionVsUsedTimeData[index];
                        if (!dataPoint) return null;
                        const isHigher = dataPoint.production >= dataPoint.used;
                        return (
                          <text x={x} y={y} dy={isHigher ? -12 : 16} fill={prodVsUsedChartColor} fontSize={10} fontWeight={500} textAnchor="middle">
                            {Math.round(value)}
                          </text>
                        );
                      }} 
                    />
                  </Line>
                  <Line type="monotone" dataKey="used" name={t.usedTime} stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}}>
                    <LabelList 
                      dataKey="used" 
                      content={(props: any) => {
                        const { x, y, value, index } = props;
                        if (!value || value <= 0) return null;
                        const dataPoint = productionVsUsedTimeData[index];
                        if (!dataPoint) return null;
                        const isHigher = dataPoint.used > dataPoint.production;
                        return (
                          <text x={x} y={y} dy={isHigher ? -12 : 16} fill="#f59e0b" fontSize={10} fontWeight={500} textAnchor="middle">
                            {Math.round(value)}
                          </text>
                        );
                      }} 
                    />
                  </Line>
                </LineChart>
              ) : prodVsUsedChartType === 'bar' ? (
                <BarChart data={productionVsUsedTimeData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={{stroke: '#e5e7eb'}} />
                  <YAxis tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Legend />
                  <Bar dataKey="production" name={t.productionTime} fill={prodVsUsedChartColor} radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="production" position="top" formatter={(val: any) => val > 0 ? Math.round(val) : ''} style={{ fontSize: '10px', fill: prodVsUsedChartColor, fontWeight: 500 }} />
                  </Bar>
                  <Bar dataKey="used" name={t.usedTime} fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="used" position="top" formatter={(val: any) => val > 0 ? Math.round(val) : ''} style={{ fontSize: '10px', fill: '#f59e0b', fontWeight: 500 }} />
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart data={productionVsUsedTimeData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={prodVsUsedChartColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={prodVsUsedChartColor} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={{stroke: '#e5e7eb'}} />
                  <YAxis tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Legend />
                  <Area type="monotone" dataKey="production" name={t.productionTime} stroke={prodVsUsedChartColor} fillOpacity={1} fill="url(#colorProd)" strokeWidth={3}>
                    <LabelList dataKey="production" position="top" formatter={(val: any) => val > 0 ? Math.round(val) : ''} style={{ fontSize: '10px', fill: prodVsUsedChartColor, fontWeight: 500 }} />
                  </Area>
                  <Area type="monotone" dataKey="used" name={t.usedTime} stroke="#f59e0b" fillOpacity={1} fill="url(#colorUsed)" strokeWidth={3}>
                    <LabelList dataKey="used" position="top" formatter={(val: any) => val > 0 ? Math.round(val) : ''} style={{ fontSize: '10px', fill: '#f59e0b', fontWeight: 500 }} />
                  </Area>
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
              {t.noHistoricalData}
            </div>
          )}
        </div>
        
        {/* Project Chips for Quick Filtering (Production vs Used Time) */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setProdVsUsedSelectedProject('ALL')}
            className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
              prodVsUsedSelectedProject === 'ALL' 
                ? 'bg-blue-600 text-white border border-blue-700 shadow-md font-bold scale-105 dark:bg-blue-500 dark:border-blue-400' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent font-medium dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setProdVsUsedSelectedProject('DENSO TOPLAM')}
            className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
              prodVsUsedSelectedProject === 'DENSO TOPLAM' 
                ? 'bg-blue-600 text-white border border-blue-700 shadow-md font-bold scale-105 dark:bg-blue-500 dark:border-blue-400' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent font-medium dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            DENSO TOPLAM
          </button>
          {allProjectNames.map(name => (
            <button
              key={name}
              onClick={() => setProdVsUsedSelectedProject(name)}
              className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                prodVsUsedSelectedProject === name 
                  ? 'bg-blue-600 text-white border border-blue-700 shadow-md font-bold scale-105 dark:bg-blue-500 dark:border-blue-400' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent font-medium dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Workforce Distribution Trend */}
      <div ref={workforceDistRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {selectedProject === 'ALL' ? `${t.workforceDistributionTrend} (${t.overall})` : `${t.workforceDistributionTrend}: ${selectedProject}`}
              {dateRange && <span className="ml-2 text-sm font-normal text-gray-500">({dateRange})</span>}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.trackPerformance}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative exclude-from-export">
              <button
                onClick={() => setIsWorkforceSettingsOpen(!isWorkforceSettingsOpen)}
                className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Chart Settings"
              >
                <Settings2 className="w-4 h-4" />
              </button>
              
              {isWorkforceSettingsOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-10 p-2">
                  <div className="mb-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block px-2">
                      Chart Type
                    </label>
                    <div className="space-y-1">
                      <button
                        onClick={() => { setWorkforceChartType('line'); setIsWorkforceSettingsOpen(false); }}
                        className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${workforceChartType === 'line' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                      >
                        <LineChartIcon className="w-4 h-4 mr-2" />
                        Line
                      </button>
                      <button
                        onClick={() => { setWorkforceChartType('bar'); setIsWorkforceSettingsOpen(false); }}
                        className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${workforceChartType === 'bar' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                      >
                        <BarChart2 className="w-4 h-4 mr-2" />
                        Bar
                      </button>
                      <button
                        onClick={() => { setWorkforceChartType('area'); setIsWorkforceSettingsOpen(false); }}
                        className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${workforceChartType === 'area' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Area
                      </button>
                    </div>
                  </div>
                  
                  {selectedProject !== 'ALL' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block px-2 flex items-center">
                        <Palette className="w-3 h-3 mr-1" />
                        Project Color
                      </label>
                      <div className="flex flex-wrap gap-1 px-2">
                        {CHART_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setProjectColors(prev => ({ ...prev, [selectedProject]: color }));
                              setIsWorkforceSettingsOpen(false);
                            }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                              projectColors[selectedProject] === color ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                            title={`Set color to ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={() => handleDownloadImage(workforceDistRef, 'workforce_distribution')}
              className="exclude-from-export p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Download as Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="h-72">
          {workforceDistributionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {workforceChartType === 'line' ? (
                <LineChart data={workforceDistributionData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={{stroke: '#e5e7eb'}} />
                  <YAxis tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Legend />
                  <Line type="monotone" dataKey="working" name={t.working || 'Working'} stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}}>
                    <LabelList dataKey="working" content={renderWorkforceLabel} />
                  </Line>
                  <Line type="monotone" dataKey="absent" name={t.absent} stroke="#ef4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="leave" name={t.onLeave} stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="sick" name={t.sickReport} stroke="#f97316" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
              ) : workforceChartType === 'bar' ? (
                <BarChart data={workforceDistributionData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={{stroke: '#e5e7eb'}} />
                  <YAxis tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Legend />
                  <Bar dataKey="working" name={t.working || 'Working'} stackId="a" fill="#10b981" radius={[0, 0, 4, 4]}>
                    <LabelList dataKey="working" content={renderWorkforceLabel} />
                  </Bar>
                  <Bar dataKey="absent" name={t.absent} stackId="a" fill="#ef4444" />
                  <Bar dataKey="leave" name={t.onLeave} stackId="a" fill="#3b82f6" />
                  <Bar dataKey="sick" name={t.sickReport} stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={workforceDistributionData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorWorking" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLeave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSick" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={{stroke: '#e5e7eb'}} />
                  <YAxis tick={{fill: '#6b7280', fontSize: 12}} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Legend />
                  <Area type="monotone" dataKey="working" name={t.working || 'Working'} stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorWorking)" strokeWidth={3}>
                    <LabelList dataKey="working" content={renderWorkforceLabel} />
                  </Area>
                  <Area type="monotone" dataKey="absent" name={t.absent} stackId="1" stroke="#ef4444" fillOpacity={1} fill="url(#colorAbsent)" strokeWidth={3} />
                  <Area type="monotone" dataKey="leave" name={t.onLeave} stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLeave)" strokeWidth={3} />
                  <Area type="monotone" dataKey="sick" name={t.sickReport} stackId="1" stroke="#f97316" fillOpacity={1} fill="url(#colorSick)" strokeWidth={3} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
              {t.noHistoricalData}
            </div>
          )}
        </div>
      </div>

      {/* Sheet Efficiency Trend (Current Report) */}
      <div ref={sheetEfficiencyRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.sheetEfficiency}</h3>
          <button 
            onClick={() => handleDownloadImage(sheetEfficiencyRef, 'sheet_efficiency')}
            className="exclude-from-export p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Download as Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={sheetData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} formatter={(value: any) => [value === 0 ? t.notWorked : `${value}%`, t.efficiency]} />
                <Legend />
                <Line 
                  type="linear" 
                  dataKey="efficiency" 
                  stroke={currentChartColor} 
                  strokeWidth={2} 
                  name={`${t.efficiency} (%)`} 
                  label={<CustomBadgeLabel language={language} unit="%" stroke={currentChartColor} fill={currentChartColor} />}
                />
              </LineChart>
            ) : chartType === 'bar' ? (
              <BarChart data={sheetData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} formatter={(value: any) => [value === 0 ? t.notWorked : `${value}%`, t.efficiency]} />
                <Legend />
                <Bar 
                  dataKey="efficiency" 
                  fill={currentChartColor} 
                  name={`${t.efficiency} (%)`} 
                  radius={[4, 4, 0, 0]}
                  label={<CustomBadgeLabel language={language} unit="%" stroke={currentChartColor} fill={currentChartColor} />}
                />
              </BarChart>
            ) : (
              <AreaChart data={sheetData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                <defs>
                  <linearGradient id="colorSheetEff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentChartColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={currentChartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} formatter={(value: any) => [value === 0 ? t.notWorked : `${value}%`, t.efficiency]} />
                <Legend />
                <Area 
                  type="linear" 
                  dataKey="efficiency" 
                  stroke={currentChartColor} 
                  fillOpacity={1}
                  fill="url(#colorSheetEff)"
                  strokeWidth={2} 
                  name={`${t.efficiency} (%)`} 
                  label={<CustomBadgeLabel language={language} unit="%" stroke={currentChartColor} fill={currentChartColor} />}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Production vs Used Time */}
      <div ref={prodVsUsedRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.productionVsUsed}</h3>
          <button 
            onClick={() => handleDownloadImage(prodVsUsedRef, 'production_vs_used')}
            className="exclude-from-export p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Download as Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sheetData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="production" fill="#10b981" name={t.productionTime} radius={[4, 4, 0, 0]} label={<CustomBadgeLabel language={language} unit="m" />} />
              <Bar dataKey="used" fill="#f59e0b" name={t.usedTime} radius={[4, 4, 0, 0]} label={<CustomBadgeLabel language={language} unit="m" />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Workforce Distribution */}
      <div ref={workforceRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.workforceDist}</h3>
          <button 
            onClick={() => handleDownloadImage(workforceRef, 'workforce_distribution')}
            className="exclude-from-export p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Download as Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sheetData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="workforce" fill="#8884d8" name={t.totalWorkforce} radius={[4, 4, 0, 0]} label={<CustomBadgeLabel language={language} unit="" />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stoppage Trend */}
      <div ref={stoppageRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.stoppageTrend}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.stoppageDesc}</p>
          </div>
          <button 
            onClick={() => handleDownloadImage(stoppageRef, 'stoppage_trend')}
            className="exclude-from-export p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Download as Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stoppageTrendData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{fill: '#6b7280', fontSize: 12}}
                tickLine={false}
                axisLine={{stroke: '#e5e7eb'}}
              />
              <YAxis 
                domain={[0, 'auto']} 
                tick={{fill: '#6b7280', fontSize: 12}}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                formatter={(value: any) => [`${value}%`, t.stoppageRate]}
              />
              <Legend />
              <ReferenceLine 
                y={0.9} 
                stroke="#ef4444" 
                strokeDasharray="3 3" 
                label={{ 
                  position: 'left', 
                  value: `${t.target}: %0.9`, 
                  fill: '#ef4444', 
                  fontSize: 13,
                  fontWeight: 'bold',
                  offset: 50
                }} 
              />
              <Line 
                type="linear" 
                dataKey="rate" 
                stroke="#f97316" 
                strokeWidth={3} 
                dot={{r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff'}}
                activeDot={{r: 6}}
                name={`${t.stoppageRate} (%)`}
                animationDuration={1000}
                label={<CustomBadgeLabel unit="%" disableNotWorked={true} stroke="#f97316" fill="#f97316" />}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Absenteeism Trend */}
      <div ref={absenteeismRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {t.dailyAbsenteeism}
              {dateRange && <span className="ml-2 text-sm font-normal text-gray-500">({dateRange})</span>}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.absenteeismDesc}</p>
          </div>
          <button 
            onClick={() => handleDownloadImage(absenteeismRef, 'absenteeism_trend')}
            className="exclude-from-export p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Download as Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={absenteeismData} margin={{ top: 30, right: 30, left: 110, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{fill: '#6b7280', fontSize: 12}}
                tickLine={false}
                axisLine={{stroke: '#e5e7eb'}}
              />
              <YAxis 
                domain={[0, 'auto']} 
                tick={{fill: '#6b7280', fontSize: 12}}
                tickLine={false}
                axisLine={false}
                unit="%"
              />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                formatter={(value: any) => [`${value}%`, t.absenteeismRate]}
              />
              <Legend />
              <ReferenceLine 
                y={5} 
                stroke="#ef4444" 
                strokeDasharray="3 3" 
                label={{ 
                  position: 'left', 
                  value: `${t.maxLimit}: %5`, 
                  fill: '#ef4444', 
                  fontSize: 13,
                  fontWeight: 'bold',
                  offset: 50
                }} 
              />
              <Line 
                type="linear" 
                dataKey="rate" 
                stroke="#ef4444" 
                strokeWidth={3} 
                dot={{r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff'}}
                activeDot={{r: 6}}
                name={`${t.absenteeismRate} (%)`}
                animationDuration={1000}
                label={<CustomBadgeLabel unit="%" disableNotWorked={true} stroke="#ef4444" fill="#ef4444" />}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    </div>
  );
}
