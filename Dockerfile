# Stage 1: Build the frontend
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve Backend and Frontend together
FROM node:20-slim
WORKDIR /usr/src/app

# Copy backend package files
COPY package*.json ./

# Install backend dependencies (production only for smaller image)
RUN npm install --only=production

# Copy backend source code
COPY . .

# Copy built frontend assets from Stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Command to run the app
CMD [ "npm", "start" ]
