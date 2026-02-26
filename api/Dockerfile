# syntax=docker/dockerfile:1
FROM ruby:4.0.1-slim AS base

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    default-mysql-client \
    libmariadb3 \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Set production environment
ENV RAILS_ENV=production \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_WITHOUT=development:test

# Build stage
FROM base AS build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    git \
    pkg-config \
    libyaml-dev \
    && rm -rf /var/lib/apt/lists/*

# Install gems
COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git

# Copy application code
COPY . .

# Precompile bootsnap
RUN bundle exec bootsnap precompile app/ lib/

# Production stage
FROM base AS production

# Copy built artifacts
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /app /app

# Create non-root user
RUN useradd -m -u 1000 rails && \
    chown -R rails:rails /app

USER rails

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -fsS http://localhost:3000/up || exit 1

# Start the server
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
