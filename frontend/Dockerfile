# Use a Node.js image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy frontend files
COPY . /app

# Install dependencies
RUN npm install

# Build frontend assets (for React/Vue)
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Start the frontend (for React, use `npm start`)
CMD ["npm", "start"]
