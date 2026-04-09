'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Languages } from 'lucide-react';
import { Language, translations } from '@/lib/i18n';

interface LanguageThemeToggleProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export default function LanguageThemeToggle({ language, setLanguage }: LanguageThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = translations[language];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Language Toggle */}
      <div className="relative group">
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" title={t.language}>
          <Languages className="w-5 h-5" />
        </button>
        <div className="absolute left-0 bottom-full pb-2 w-32 hidden group-hover:block z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
            <button
              onClick={() => setLanguage('en')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${language === 'en' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
            >
              {t.english}
            </button>
            <button
              onClick={() => setLanguage('tr')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${language === 'tr' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
            >
              {t.turkish}
            </button>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="relative group">
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300" title={t.theme}>
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : theme === 'light' ? <Sun className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </button>
        <div className="absolute left-0 bottom-full pb-2 w-32 hidden group-hover:block z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
            <button
              onClick={() => setTheme('light')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${theme === 'light' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
            >
              <Sun className="w-4 h-4" /> {t.light}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
            >
              <Moon className="w-4 h-4" /> {t.dark}
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 ${theme === 'system' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
            >
              <Monitor className="w-4 h-4" /> {t.system}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
