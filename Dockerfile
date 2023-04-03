# Use the official Node.js image as the base image
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .
RUN npm run build

# Expose the port that the application will run on (if applicable)
EXPOSE 3000

# Start the application by running server_pass.js
CMD ["npm", "start"]
