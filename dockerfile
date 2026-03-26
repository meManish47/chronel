# Use Node LTS
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of app
COPY . .

# App runs on this port
EXPOSE 5000

# Start server
CMD ["node", "index.js"]