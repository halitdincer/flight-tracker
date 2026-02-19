import { DailyStatistic } from '../../types';

interface StatisticsPanelProps {
  statistics: DailyStatistic[];
  loading: boolean;
}

export default function StatisticsPanel({ statistics, loading }: StatisticsPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const latestStat = statistics[statistics.length - 1];
  const totalFlights = statistics.reduce((sum, s) => sum + s.totalFlights, 0);
  const avgDailyFlights = statistics.length > 0 
    ? Math.round(totalFlights / statistics.length) 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Flights"
          value={totalFlights.toLocaleString()}
          subtext={`Last ${statistics.length} days`}
        />
        <StatCard
          label="Avg Daily Flights"
          value={avgDailyFlights.toLocaleString()}
        />
        <StatCard
          label="Today's Flights"
          value={latestStat?.totalFlights?.toLocaleString() || '0'}
        />
        <StatCard
          label="Unique Aircraft"
          value={latestStat?.uniqueAircraft?.toLocaleString() || '0'}
          subtext="Today"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
}

function StatCard({ label, value, subtext }: StatCardProps) {
  return (
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="text-2xl font-bold text-blue-600">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
      {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
    </div>
  );
}
