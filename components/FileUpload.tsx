
'use client';

import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { parseExcelFile } from '@/lib/analyzer';
import { AnalysisResult } from '@/lib/types';
import { Language, translations } from '@/lib/i18n';

interface FileUploadProps {
  onUpload: (data: AnalysisResult | AnalysisResult[]) => void;
  language?: Language;
}

export default function FileUpload({ onUpload, language = 'en' }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];

  const handleFiles = async (files: FileList | File[]) => {
    setLoading(true);
    setError(null);
    try {
      const results: AnalysisResult[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await parseExcelFile(file);
        results.push(result);
      }
      onUpload(results.length === 1 ? results[0] : results);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse Excel file. Please ensure it follows the correct format.');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
        ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
        ${loading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input
        id="fileInput"
        type="file"
        accept=".xlsx, .xls"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <UploadCloud className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
        {loading ? t.processing : t.uploadTitle}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        {t.dragDrop}
      </p>
      {error && <p className="text-red-500 dark:text-red-400 mt-4 text-sm">{error}</p>}
    </div>
  );
}
