import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { DailyStatistic } from '../../types';

interface FlightCountChartProps {
  statistics: DailyStatistic[];
  loading: boolean;
}

export default function FlightCountChart({ statistics, loading }: FlightCountChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  const chartData = statistics.map((stat) => ({
    date: stat.date,
    displayDate: format(parseISO(stat.date), 'MMM d'),
    totalFlights: stat.totalFlights,
    uniqueAircraft: stat.uniqueAircraft,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Flight Activity</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value: number | undefined) => [value?.toLocaleString() ?? '', '']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalFlights"
              name="Total Flights"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="uniqueAircraft"
              name="Unique Aircraft"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
