import { gql } from '@apollo/client';

export const GET_STATISTICS = gql`
  query GetStatistics($startDate: ISO8601Date!, $endDate: ISO8601Date!) {
    statistics(startDate: $startDate, endDate: $endDate) {
      id
      date
      totalFlights
      uniqueAircraft
      flightsByCountry
      avgAltitude
    }
  }
`;
