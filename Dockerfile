# Multi-stage Dockerfile for Rosh Platform
# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:22-alpine
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0
ENV DB_PATH=/app/data/rosh.db
ENV UPLOADS_PATH=/app/data/uploads

# Install backend dependencies
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production --prefer-offline --no-audit
COPY backend/ ./

# Copy built frontend assets to backend public
COPY --from=frontend-builder /app/frontend/dist /app/backend/public

# Create data & upload directories
RUN mkdir -p /app/data/uploads/images /app/data/uploads/videos /app/data/uploads/homeworks /app/data/uploads/receipts

# Expose HTTP port
EXPOSE 5000

# Volume for database and persistent media
VOLUME ["/app/data"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

# Start production server
CMD ["node", "server.js"]
