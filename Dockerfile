# Use official Node.js LTS image
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./

# Install dependencies without running scripts (skip Husky)
ENV HUSKY=0
RUN npm ci --ignore-scripts

# Copy application code
COPY . .

# Set build-time environment variables for Next.js
# These allow the build to proceed without actual credentials
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder_key
ENV SUPABASE_SERVICE_KEY=placeholder_service_key
ENV STRIPE_SECRET_KEY=sk_test_placeholder
ENV STRIPE_WEBHOOK_SECRET=whsec_placeholder
ENV OPENROUTER_API_KEY=placeholder_key

# Build the application
RUN npm run build

# Expose port
EXPOSE 3005

# Start the application (runtime env vars will override placeholders)
CMD ["npm", "start"]

