# Use Node.js 20 LTS as base
FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (only production for smaller image)
RUN npm install --only=production

# Copy app source
COPY . .

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Command to run the app
CMD [ "npm", "start" ]
