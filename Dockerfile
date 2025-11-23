# Use Railway's nixpacks base image
FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies without running scripts
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

