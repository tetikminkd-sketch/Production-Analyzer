
'use client';

import { AnalysisResult } from '@/lib/types';
import KPICards from './KPICards';
import Charts from './Charts';
import ProjectTable from './ProjectTable';
import AIInsights from './AIInsights';
import WorkforceDetails from './WorkforceDetails';
import LineStoppages from './LineStoppages';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';

interface DashboardProps {
  data: AnalysisResult;
  reports: AnalysisResult[];
  onReset: () => void;
  onUpdateReport?: (report: AnalysisResult) => void;
  language?: Language;
}

export default function Dashboard({ data, reports, onReset, onUpdateReport, language = 'en' }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const t = translations[language];

  const tabs = [
    { id: 'overview', label: t.overallSummary },
    { id: 'workforce', label: t.totalWorkforce },
    { id: 'details', label: t.details },
    { id: 'insights', label: t.aiInsights },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{data.reportName}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Analyzing {data.sheets.length} {t.sheets} • Uploaded on {data.uploadDate.toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.close}
        </button>
      </div>

      <KPICards data={data} language={language} />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-1">
        <div className="flex space-x-1 bg-gray-100/50 dark:bg-gray-900/50 p-1 rounded-lg overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap px-4
                ${activeTab === tab.id 
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <Charts data={data} reports={reports} language={language} />
        </div>
      )}

      {activeTab === 'workforce' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <WorkforceDetails data={data} language={language} />
        </div>
      )}

      {activeTab === 'details' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
          <ProjectTable data={data} language={language} />
          {onUpdateReport && (
            <LineStoppages data={data} onUpdateReport={onUpdateReport} language={language} />
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <AIInsights data={data} language={language} />
        </div>
      )}
    </div>
  );
}
