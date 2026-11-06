# Backend Service - FindIt Node.js / Express API
FROM node:20-alpine

WORKDIR /app

# Install curl for container health check
RUN apk add --no-cache curl

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production || npm install --production

# Copy application source
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose backend port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
