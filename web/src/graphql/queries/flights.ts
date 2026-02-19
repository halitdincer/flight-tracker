import { gql } from '@apollo/client';

export const GET_LIVE_FLIGHTS = gql`
  query GetLiveFlights($boundingBox: BoundingBoxInput) {
    liveFlights(boundingBox: $boundingBox) {
      icao24
      callsign
      originCountry
      latitude
      longitude
      altitude
      velocity
      heading
      verticalRate
      onGround
    }
  }
`;

export const GET_FLIGHTS = gql`
  query GetFlights(
    $callsign: String
    $country: String
    $limit: Int
    $offset: Int
  ) {
    flights(
      callsign: $callsign
      country: $country
      limit: $limit
      offset: $offset
    ) {
      nodes {
        id
        icao24
        callsign
        originCountry
        firstSeenAt
        lastSeenAt
      }
      totalCount
      hasNextPage
    }
  }
`;

export const GET_FLIGHT = gql`
  query GetFlight($icao24: String!) {
    flight(icao24: $icao24) {
      id
      icao24
      callsign
      originCountry
      firstSeenAt
      lastSeenAt
      positions(limit: 500) {
        id
        latitude
        longitude
        altitude
        velocity
        heading
        onGround
        recordedAt
      }
    }
  }
`;

export const GET_FLIGHT_HISTORY = gql`
  query GetFlightHistory(
    $icao24: String!
    $startTime: ISO8601DateTime
    $endTime: ISO8601DateTime
  ) {
    flightHistory(icao24: $icao24, startTime: $startTime, endTime: $endTime) {
      id
      latitude
      longitude
      altitude
      velocity
      heading
      onGround
      recordedAt
    }
  }
`;
