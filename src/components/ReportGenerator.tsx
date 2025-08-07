import React from 'react';
import { getMonthName } from '../lib/utils';

interface ReportGeneratorProps {
  month: number;
  year: number;
  onGenerate: (format: 'pdf' | 'excel') => Promise<void>;
}

export default function ReportGenerator({ month, year, onGenerate }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true);
    try {
      await onGenerate(format);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Report Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-[#57564F] mb-2">
          Generate Report
        </h4>
        <p className="text-sm text-[#7A7A73]">
          {getMonthName(month)} {year}
        </p>
      </div>

      {/* Download Buttons */}
      <div className="space-y-2">
        <button
          onClick={() => handleGenerateReport('pdf')}
          disabled={isGenerating}
          className="btn w-full flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
        </button>

        <button
          onClick={() => handleGenerateReport('excel')}
          disabled={isGenerating}
          className="btn w-full flex items-center justify-center space-x-2"
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
