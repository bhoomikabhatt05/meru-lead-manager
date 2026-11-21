# Production Multi-Stage Dockerfile for Meru Lead Manager
# Stage 1: Build the React frontend
FROM node:24-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production runner
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001
ENV DB_PATH=/app/data/leads.db

# Install server production dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy server code
COPY server/ ./server/

# Copy compiled frontend from builder
COPY --from=client-builder /app/client/dist ./client/dist

# Create persistent data volume mount directory
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME ["/app/data"]

USER node
EXPOSE 5001

CMD ["node", "server/src/index.js"]
