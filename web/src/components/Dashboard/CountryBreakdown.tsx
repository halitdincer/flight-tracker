import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DailyStatistic } from '../../types';

interface CountryBreakdownProps {
  statistics: DailyStatistic[];
  loading: boolean;
}

export default function CountryBreakdown({ statistics, loading }: CountryBreakdownProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  // Aggregate country data across all days
  const countryTotals: Record<string, number> = {};
  statistics.forEach((stat) => {
    if (stat.flightsByCountry) {
      Object.entries(stat.flightsByCountry).forEach(([country, count]) => {
        countryTotals[country] = (countryTotals[country] || 0) + (count as number);
      });
    }
  });

  // Sort and take top 10
  const chartData = Object.entries(countryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([country, count]) => ({
      country: country.length > 15 ? country.substring(0, 15) + '...' : country,
      fullCountry: country,
      flights: count,
    }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Top Countries</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis 
              type="category" 
              dataKey="country" 
              tick={{ fontSize: 11 }} 
              width={100}
            />
            <Tooltip
              formatter={(value: number) => [value.toLocaleString(), 'Flights']}
              labelFormatter={(label, payload) => 
                payload?.[0]?.payload?.fullCountry || label
              }
            />
            <Bar dataKey="flights" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
