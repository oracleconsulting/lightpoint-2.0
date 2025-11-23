# Use official Node.js LTS image
FROM node:20-alpine

# Fix DNS/network issues in Railway
RUN apk add --no-cache bind-tools

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./

# Install dependencies without running scripts (skip Husky)
ENV HUSKY=0
RUN npm ci --ignore-scripts

# Copy application code
COPY . .

# Accept build-time arguments from Railway
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_KEY
ARG STRIPE_SECRET_KEY
ARG OPENROUTER_API_KEY

# Make them available to the build process
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build the application with environment variables available
RUN npm run build

# Copy necessary files for standalone mode
RUN cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
RUN cp -r public .next/standalone/public 2>/dev/null || true

# Expose port
EXPOSE 3005

# Set Node.js DNS to prefer IPv4 (fixes Railway network issues)
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
ENV PORT=3005

# Start the application using standalone mode (stay in /app, reference .next/standalone/server.js)
CMD ["node", ".next/standalone/server.js"]

