
'use client';

import { AnalysisResult, ProjectMetrics } from '@/lib/types';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';

interface ProjectTableProps {
  data: AnalysisResult;
  language?: Language;
}

export default function ProjectTable({ data, language = 'en' }: ProjectTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProjectMetrics; direction: 'asc' | 'desc' } | null>(null);
  const t = translations[language];

  const allProjects = data.sheets.flatMap(sheet => 
    sheet.projects.map(project => ({ ...project, sheetName: sheet.sheetName }))
  ).sort((a, b) => a.projectName.localeCompare(b.projectName));

  const filteredProjects = allProjects.filter(project =>
    project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: keyof ProjectMetrics) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof ProjectMetrics) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.detailedAnalysis}</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestSort('projectName')}>
                <div className="flex items-center space-x-1"><span>{t.project}</span>{getSortIcon('projectName')}</div>
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestSort('reference')}>
                <div className="flex items-center space-x-1"><span>{t.ref}</span>{getSortIcon('reference')}</div>
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestSort('sheetName' as any)}>
                <div className="flex items-center space-x-1"><span>{t.sheet}</span></div>
              </th>
              <th className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestSort('efficiency')}>
                <div className="flex items-center justify-end space-x-1"><span>{t.efficiency}</span>{getSortIcon('efficiency')}</div>
              </th>
              <th className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestSort('productionTime')}>
                <div className="flex items-center justify-end space-x-1"><span>{t.prodTime}</span>{getSortIcon('productionTime')}</div>
              </th>
              <th className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestSort('usedTime')}>
                <div className="flex items-center justify-end space-x-1"><span>{t.usedTime}</span>{getSortIcon('usedTime')}</div>
              </th>
              <th className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestSort('quantity')}>
                <div className="flex items-center justify-end space-x-1"><span>{t.qty}</span>{getSortIcon('quantity')}</div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortedProjects.map((project, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{project.projectName}</td>
                <td className="px-6 py-4">{project.reference}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{(project as any).sheetName}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${project.efficiency >= 85 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                      project.efficiency >= 70 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }
                  `}>
                    {project.efficiency.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right">{project.productionTime.toFixed(0)}</td>
                <td className="px-6 py-4 text-right">{project.usedTime.toFixed(0)}</td>
                <td className="px-6 py-4 text-right">{project.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
