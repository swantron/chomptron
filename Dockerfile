# Use official Node.js runtime as base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port (Cloud Run will inject PORT env var)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
