import { useQuery } from '@apollo/client/react';
import { GET_STATISTICS } from '../graphql/queries/statistics';
import type { DailyStatistic } from '../types';
import { format, subDays } from 'date-fns';

interface StatisticsData {
  statistics: DailyStatistic[];
}

export function useStatistics(days: number = 30) {
  const endDate = format(new Date(), 'yyyy-MM-dd');
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

  const { data, loading, error, refetch } = useQuery<StatisticsData>(
    GET_STATISTICS,
    {
      variables: { startDate, endDate },
    }
  );

  return {
    statistics: data?.statistics ?? [],
    loading,
    error,
    refetch,
  };
}
