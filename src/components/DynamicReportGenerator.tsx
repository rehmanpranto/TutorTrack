import dynamic from 'next/dynamic';
import { MonthlyReport } from '../types';

// Dynamically import heavy PDF/Excel libraries only when needed
const ReportGenerator = dynamic(() => import('./ReportGenerator'), {
  loading: () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
});

interface DynamicReportGeneratorProps {
  month: number;
  year: number;
  onGenerate: (month: number, year: number) => Promise<MonthlyReport>;
}

export default function DynamicReportGenerator(props: DynamicReportGeneratorProps) {
  return <ReportGenerator {...props} />;
}
