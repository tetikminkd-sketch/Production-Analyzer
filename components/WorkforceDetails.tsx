import { AnalysisResult } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';

interface WorkforceDetailsProps {
  data: AnalysisResult;
  language?: Language;
}

export default function WorkforceDetails({ data, language = 'en' }: WorkforceDetailsProps) {
  const t = translations[language];
  const sortedSheets = [...data.sheets].sort((a, b) => a.sheetName.localeCompare(b.sheetName));
  const totalWorkforce = sortedSheets.reduce((sum, s) => sum + s.totalPersonnel, 0);
  const totalAbsent = sortedSheets.reduce((sum, s) => sum + s.absentPersonnel.length, 0);
  const totalLeave = sortedSheets.reduce((sum, s) => sum + s.leavePersonnel.length, 0);
  const totalSick = sortedSheets.reduce((sum, s) => sum + s.sickPersonnel.length, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.workforceStatus}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t.workforceDesc}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.projectSheet}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.totalWorkforce}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.absent}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.onLeave}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.sickReport}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedSheets.map((sheet, idx) => (
              <tr key={idx} className={sheet.isInactive ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {sheet.sheetName}
                  {sheet.isInactive && <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-normal border border-red-200 dark:border-red-800 px-1 rounded bg-white dark:bg-transparent">({t.inactive})</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">
                  {sheet.totalPersonnel}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 align-top">
                  <div className="flex flex-col">
                    <span className={`font-bold ${sheet.absentPersonnel.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-600'}`}>
                      {sheet.absentPersonnel.length}
                    </span>
                    {sheet.absentPersonnel.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {sheet.absentPersonnel.map((name, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 align-top">
                  <div className="flex flex-col">
                    <span className={`font-bold ${sheet.leavePersonnel.length > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`}>
                      {sheet.leavePersonnel.length}
                    </span>
                    {sheet.leavePersonnel.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {sheet.leavePersonnel.map((name, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 align-top">
                  <div className="flex flex-col">
                    <span className={`font-bold ${sheet.sickPersonnel.length > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-600'}`}>
                      {sheet.sickPersonnel.length}
                    </span>
                    {sheet.sickPersonnel.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {sheet.sickPersonnel.map((name, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 dark:bg-gray-700 font-semibold">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{t.total}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{totalWorkforce}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 dark:text-red-400">{totalAbsent}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 dark:text-blue-400">{totalLeave}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-700 dark:text-orange-400">{totalSick}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
