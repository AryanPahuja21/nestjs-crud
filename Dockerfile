# ----------------------
# 1️⃣ Build stage
# ----------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=development

COPY . .
RUN npm run build

# ----------------------
# 2️⃣ Run stage
# ----------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Copy only the build and necessary files
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Install only production dependencies and skip prepare script
RUN npm ci --omit=dev --ignore-scripts

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
    