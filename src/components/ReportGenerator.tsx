import React, { useState } from 'react';
import { getMonthName } from '../lib/utils';

interface ReportGeneratorProps {
  month: number;
  year: number;
  onGenerate: (format: 'pdf' | 'excel', selectedMonth?: number, selectedYear?: number, period?: 'month' | 'year') => Promise<void>;
}

export default function ReportGenerator({ month, year, onGenerate }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true);
    try {
      await onGenerate(format, selectedMonth, selectedYear, period);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const availableYears = [];
  for (let i = 0; i <= 2; i++) {
    availableYears.push(currentYear - i);
  }

  return (
    <div className="space-y-4">
      {/* Period Toggle */}
      <div className="report-toggle">
        <button
          type="button"
          onClick={() => setPeriod('month')}
          className={period === 'month' ? 'selected' : ''}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setPeriod('year')}
          className={period === 'year' ? 'selected' : ''}
        >
          Annual
        </button>
      </div>

      {/* Month/Year Selection */}
      <div className="space-y-3">
        <h4 className="report-label">
          Report Period
        </h4>

        <div className={`grid gap-2.5 ${period === 'month' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {period === 'month' && (
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
          )}

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

        <p className="text-xs opacity-70 font-medium">
          {period === 'month' ? `${getMonthName(selectedMonth)} ${selectedYear}` : `Full year ${selectedYear}`}
        </p>
      </div>

      {/* Download Buttons */}
      <div className="report-buttons">
        <button
          onClick={() => handleGenerateReport('pdf')}
          disabled={isGenerating}
          className="w-full disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs">{isGenerating ? 'Generating...' : 'PDF'}</span>
        </button>

        <button
          onClick={() => handleGenerateReport('excel')}
          disabled={isGenerating}
          className="w-full disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs">{isGenerating ? 'Generating...' : 'Excel'}</span>
        </button>
      </div>
    </div>
  );
}
