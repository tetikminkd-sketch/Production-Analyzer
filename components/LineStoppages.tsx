'use client';

import { AnalysisResult, LineStoppage } from '@/lib/types';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';

interface LineStoppagesProps {
  data: AnalysisResult;
  onUpdateReport: (report: AnalysisResult) => void;
  language?: Language;
}

const STOPPAGE_REASONS = [
  'Malzeme/kablo eksiği kaynaklı üretim duruşu',
  'Kadro geçişi evrak teslimi sebepli üretim duruşu',
  'Malzeme/kablo eksiği kaynaklı zorunlu referans değişikliği',
  'Malzeme/kablo hatası kaynaklı üretim duruşu',
  'Eğitim',
  'Sendika gezi/görevleri',
  'Müşteriye gidilen dış görevler',
  'Tatbikatlar',
  'Sağlık taraması',
  'Anket',
  'Konveyör arızası kaynaklı duruş',
  'Doğal afetler kaynaklı duruş',
  'Enerji kesintisi kaynaklı duruş'
];

export default function LineStoppages({ data, onUpdateReport, language = 'en' }: LineStoppagesProps) {
  const [reason, setReason] = useState(STOPPAGE_REASONS[0]);
  const [personnelCount, setPersonnelCount] = useState<number | ''>('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const t = translations[language];
  const stoppages = data.lineStoppages || [];

  const handleAddStoppage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnelCount || !durationMinutes) return;

    const newStoppage: LineStoppage = {
      id: crypto.randomUUID(),
      reason,
      personnelCount: Number(personnelCount),
      durationMinutes: Number(durationMinutes),
      totalLoss: Number(personnelCount) * Number(durationMinutes),
      date
    };

    const updatedReport = {
      ...data,
      lineStoppages: [...stoppages, newStoppage]
    };

    onUpdateReport(updatedReport);
    
    // Reset form
    setPersonnelCount('');
    setDurationMinutes('');
  };

  const handleDeleteStoppage = (id: string) => {
    const updatedReport = {
      ...data,
      lineStoppages: stoppages.filter(s => s.id !== id)
    };
    onUpdateReport(updatedReport);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Hat Duruşları Ekle</h3>
        <form onSubmit={handleAddStoppage} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duruş Sebebi</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {STOPPAGE_REASONS.map((r, idx) => (
                <option key={idx} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Personel Sayısı</label>
            <input
              type="number"
              min="1"
              required
              value={personnelCount}
              onChange={(e) => setPersonnelCount(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dakika</label>
            <input
              type="number"
              min="1"
              required
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarih</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="lg:col-span-5 flex justify-end mt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Ekle
            </button>
          </div>
        </form>
      </div>

      {stoppages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Hat Duruşları Listesi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Tarih</th>
                  <th className="px-6 py-3">Duruş Sebebi</th>
                  <th className="px-6 py-3 text-right">Personel Sayısı</th>
                  <th className="px-6 py-3 text-right">Dakika</th>
                  <th className="px-6 py-3 text-right">Toplam Kayıp (dk)</th>
                  <th className="px-6 py-3 text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {stoppages.map((stoppage) => (
                  <tr key={stoppage.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{stoppage.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{stoppage.reason}</td>
                    <td className="px-6 py-4 text-right">{stoppage.personnelCount}</td>
                    <td className="px-6 py-4 text-right">{stoppage.durationMinutes}</td>
                    <td className="px-6 py-4 text-right font-semibold text-red-600 dark:text-red-400">{stoppage.totalLoss}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteStoppage(stoppage.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
