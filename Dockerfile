# Build stage for client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy server files
COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./

# Copy built client from build stage
COPY --from=client-build /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV CLIENT_DIST_PATH=/app/client/dist

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "src/index.js"]
