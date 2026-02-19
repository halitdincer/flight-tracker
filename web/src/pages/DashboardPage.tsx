import { StatisticsPanel, FlightCountChart, CountryBreakdown } from '../components/Dashboard';
import { useStatistics } from '../hooks/useStatistics';

export default function DashboardPage() {
  const { statistics, loading } = useStatistics(30);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="space-y-6">
        <StatisticsPanel statistics={statistics} loading={loading} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FlightCountChart statistics={statistics} loading={loading} />
          <CountryBreakdown statistics={statistics} loading={loading} />
        </div>
      </div>
    </div>
  );
}
