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
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Report Period
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(monthNum => (
                <option key={monthNum} value={monthNum}>
                  {getMonthName(monthNum)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              {availableYears.map(yearNum => (
                <option key={yearNum} value={yearNum}>
                  {yearNum}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Selected: {getMonthName(selectedMonth)} {selectedYear}
        </p>
      </div>

      {/* Download Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => handleGenerateReport('pdf')}
          disabled={isGenerating}
          className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
        </button>

        <button
          onClick={() => handleGenerateReport('excel')}
          disabled={isGenerating}
          className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{isGenerating ? 'Generating...' : 'Download Excel'}</span>
        </button>
      </div>
    </div>
  );
}
