import React, { useState } from 'react';
import { getMonthName } from '../lib/utils';

interface ReportGeneratorProps {
  month: number;
  year: number;
  onGenerate: (format: 'pdf' | 'excel', selectedMonth: number, selectedYear: number) => Promise<void>;
}

export default function ReportGenerator({ month, year, onGenerate }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true);
    try {
      await onGenerate(format, selectedMonth, selectedYear);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate years for dropdown (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const availableYears = [];
  for (let i = 0; i <= 2; i++) {
    availableYears.push(currentYear - i);
  }

  return (
    <div className="space-y-4">
      {/* Month/Year Selection */}
      <div className="bg-gray-50/80 dark:bg-gray-700/30 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Report Period
        </h4>
        
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="input text-sm py-2.5"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(monthNum => (
                <option key={monthNum} value={monthNum}>
                  {getMonthName(monthNum)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input text-sm py-2.5"
            >
              {availableYears.map(yearNum => (
                <option key={yearNum} value={yearNum}>
                  {yearNum}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
          {getMonthName(selectedMonth)} {selectedYear}
        </p>
      </div>

      {/* Download Buttons */}
      <div className="space-y-2.5">
        <button
          onClick={() => handleGenerateReport('pdf')}
          disabled={isGenerating}
          className="w-full flex items-center justify-center space-x-2.5 px-5 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/20 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
        </button>

        <button
          onClick={() => handleGenerateReport('excel')}
          disabled={isGenerating}
          className="w-full flex items-center justify-center space-x-2.5 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{isGenerating ? 'Generating...' : 'Download Excel'}</span>
        </button>
      </div>
    </div>
  );
}
