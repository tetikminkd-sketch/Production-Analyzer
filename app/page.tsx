
'use client';

import { useState, useEffect } from 'react';
import FileUpload from '@/components/FileUpload';
import Dashboard from '@/components/Dashboard';
import { AnalysisResult } from '@/lib/types';
import { Plus, FileText, Trash2, Edit2, Check, X, Menu, Save, Loader2, ArrowUpDown } from 'lucide-react';
import { saveReportLocal, getSavedReportsLocal, deleteReportLocal } from '@/lib/storage';
import { Language, translations } from '@/lib/i18n';
import LanguageThemeToggle from '@/components/LanguageThemeToggle';

type SortOrder = 'dateDesc' | 'dateAsc' | 'nameAsc' | 'nameDesc';

export default function Home() {
  const [reports, setReports] = useState<AnalysisResult[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [sortOrder, setSortOrder] = useState<SortOrder>('dateDesc');
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  
  const t = translations[language];

  // Load saved reports on mount
  useEffect(() => {
    const loadReports = () => {
      try {
        const savedReports = getSavedReportsLocal();
        setReports(savedReports);
      } catch (error) {
        console.error('Failed to load reports:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleUpload = async (newReportData: AnalysisResult | AnalysisResult[]) => {
    const newReports = Array.isArray(newReportData) ? newReportData : [newReportData];
    
    // Auto-save all newly uploaded reports
    for (const report of newReports) {
      try {
        saveReportLocal(report);
      } catch (error) {
        console.error('Failed to auto-save report:', error);
      }
    }
    
    // Refresh the list from storage to ensure consistency
    try {
      const savedReports = getSavedReportsLocal();
      setReports(savedReports);
    } catch (error) {
      console.error('Failed to refresh reports:', error);
    }
    
    if (newReports.length > 0) {
      setActiveReportId(newReports[0].id);
    }
  };

  const handleSave = async (report: AnalysisResult) => {
    setIsSaving(true);
    try {
      const result = saveReportLocal(report);
      if (result.success) {
        // Optionally show a success toast here
        // Refresh list to ensure sync (though we already have it in state)
        const savedReports = getSavedReportsLocal();
        setReports(savedReports);
      }
    } catch (error) {
      console.error('Failed to save report:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportToDelete(id);
  };

  const confirmDelete = async () => {
    if (reportToDelete) {
      try {
        deleteReportLocal(reportToDelete);
        setReports(prev => prev.filter(r => r.id !== reportToDelete));
        if (activeReportId === reportToDelete) {
          setActiveReportId(null);
        }
      } catch (error) {
        console.error('Failed to delete report:', error);
      }
      setReportToDelete(null);
    }
  };

  const startEditing = (report: AnalysisResult, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(report.id);
    setEditName(report.reportName);
  };

  const saveEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId && editName.trim()) {
      setReports(prev => prev.map(r => 
        r.id === editingId ? { ...r, reportName: editName.trim() } : r
      ));
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const activeReport = reports.find(r => r.id === activeReportId);

  const sortedReports = [...reports].sort((a, b) => {
    switch (sortOrder) {
      case 'nameAsc':
        return a.reportName.localeCompare(b.reportName);
      case 'nameDesc':
        return b.reportName.localeCompare(a.reportName);
      case 'dateAsc':
        return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      case 'dateDesc':
      default:
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    }
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-500">Production</span> Analyzer
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.subtitle}</p>
          </div>

          <div className="p-4 space-y-3">
            <button 
              onClick={() => setActiveReportId(null)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition-colors shadow-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              {t.newUpload}
            </button>
            
            {reports.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="w-full text-xs bg-transparent border-none text-gray-600 dark:text-gray-300 focus:ring-0 cursor-pointer outline-none"
                >
                  <option value="dateDesc">{t.dateDesc || 'Date (Newest First)'}</option>
                  <option value="dateAsc">{t.dateAsc || 'Date (Oldest First)'}</option>
                  <option value="nameAsc">{t.nameAsc || 'Name (A-Z)'}</option>
                  <option value="nameDesc">{t.nameDesc || 'Name (Z-A)'}</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {reports.length === 0 && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                {t.noReports}
                <br />{t.uploadPrompt}
              </div>
            )}

            {sortedReports.map((report) => (
              <div 
                key={report.id}
                onClick={() => setActiveReportId(report.id)}
                className={`
                  group relative p-3 rounded-lg cursor-pointer border transition-all duration-200
                  ${activeReportId === report.id 
                    ? 'bg-blue-50 border-blue-200 shadow-sm dark:bg-blue-900/20 dark:border-blue-800' 
                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 p-1.5 rounded ${activeReportId === report.id ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {editingId === report.id ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full text-sm border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing(e as any);
                            if (e.key === 'Escape') cancelEditing(e as any);
                          }}
                        />
                        <button onClick={saveEditing} className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 p-1 rounded"><Check className="w-3 h-3" /></button>
                        <button onClick={cancelEditing} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <div>
                        <h3 className={`text-sm font-medium truncate ${activeReportId === report.id ? 'text-blue-900 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                          {report.reportName}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {new Date(report.uploadDate).toLocaleDateString()} • {report.sheets.length} {t.sheets}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {editingId !== report.id && (
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded shadow-sm">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(report);
                      }}
                      className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                      title={t.saveReport}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={(e) => startEditing(report, e)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title={t.rename}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(report.id, e)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t.settings}</h3>
            <LanguageThemeToggle language={language} setLanguage={setLanguage} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
          <h1 className="font-bold text-gray-900 dark:text-white">Production Analyzer</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 dark:text-gray-300">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            {activeReport ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave(activeReport)}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t.saveReport}
                  </button>
                </div>
                <Dashboard 
                  data={activeReport} 
                  reports={reports}
                  onReset={() => setActiveReportId(null)} 
                  onUpdateReport={handleSave}
                  language={language}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-4 max-w-2xl">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    {t.uploadTitle}
                  </h2>
                  <p className="text-lg text-gray-500 dark:text-gray-400">
                    {t.uploadDesc}
                  </p>
                </div>
                
                <div className="w-full max-w-xl bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
                  <FileUpload onUpload={handleUpload} language={language} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
                   {[
                     { label: t.historicalData, val: `${reports.length} ${t.reports}` },
                     { label: t.totalEfficiency, val: reports.length > 0 ? `${(reports.reduce((acc, r) => acc + r.overallEfficiency, 0) / reports.length).toFixed(1)}%` : '-' },
                     { label: t.totalSheets, val: reports.reduce((acc, r) => acc + r.sheets.length, 0) }
                   ].map((stat, i) => (
                     <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                       <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">{stat.label}</div>
                       <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stat.val}</div>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t.deleteConfirm || 'Are you sure you want to delete this report?'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {language === 'tr' ? 'Bu işlem geri alınamaz.' : 'This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t.cancel || 'Cancel'}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {t.delete || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
