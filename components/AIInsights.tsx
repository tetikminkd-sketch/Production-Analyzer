
'use client';

import { useEffect, useState } from 'react';
import { generateInsightsClient } from '@/lib/gemini';
import { AnalysisResult } from '@/lib/types';
import { Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Language, translations } from '@/lib/i18n';

interface AIInsightsProps {
  data: AnalysisResult;
  language?: Language;
}

export default function AIInsights({ data, language = 'en' }: AIInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = translations[language];

  useEffect(() => {
    let isMounted = true;

    const fetchInsights = async () => {
      if (!data) return;
      
      setLoading(true);
      try {
        const res = await generateInsightsClient(data, language);
        if (isMounted) setInsights(res);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInsights();

    return () => {
      isMounted = false;
    };
  }, [data, language]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">{t.generatingInsights}</p>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.aiAnalysisReport}</h2>
      </div>
      <div className="prose prose-blue dark:prose-invert max-w-none">
        <ReactMarkdown>{insights}</ReactMarkdown>
      </div>
    </div>
  );
}
