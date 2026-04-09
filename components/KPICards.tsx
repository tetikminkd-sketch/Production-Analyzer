
'use client';

import { AnalysisResult } from '@/lib/types';
import { Activity, Clock, TrendingUp, Users } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';

interface KPICardsProps {
  data: AnalysisResult;
  language?: Language;
}

export default function KPICards({ data, language = 'en' }: KPICardsProps) {
  const t = translations[language];

  const cards = [
    {
      title: t.totalEfficiency,
      value: `${data.overallEfficiency.toFixed(2)}%`,
      icon: <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      color: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: t.productionTime,
      value: `${data.totalProductionTime.toFixed(0)} min`,
      icon: <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />,
      color: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: t.usedTime,
      value: `${data.totalUsedTime.toFixed(0)} min`,
      icon: <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
      color: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      title: t.bestProject,
      value: data.bestProjectOverall?.projectName || 'N/A',
      icon: <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      color: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  const inactiveSheets = data.sheets.filter(s => s.isInactive).map(s => s.sheetName);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>
      
      {inactiveSheets.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start space-x-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
            <Activity className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">{t.inactiveProjects}</h4>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {t.inactiveSheetsDesc} 
              <span className="font-bold ml-1">{inactiveSheets.join(', ')}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
