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

# Build the application
RUN npm run build

# Expose port
EXPOSE 3005

# Start the application
CMD ["npm", "start"]

