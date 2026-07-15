# Step 1: Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install

# Copy source code files
COPY . .

# Build the client static assets & compile server.ts to dist/server.cjs
RUN npm run build

# Step 2: Runtime stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package config and compiled distribution files
COPY package*.json ./
COPY --from=builder /app/dist ./dist

# Install only production dependencies
RUN npm install --omit=dev

# Expose port (7860 is default for Hugging Face Spaces, can be overridden by process.env.PORT)
EXPOSE 7860

# Run the compiled backend server
CMD ["node", "dist/server.cjs"]
