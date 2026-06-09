# Use official Node.js runtime as base image (matches package.json engines >=24)
FROM node:24-slim

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
