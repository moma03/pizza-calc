# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm ci

# Build the app
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine

# Copy static build output to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
