# Use the latest version of node as the base image
FROM node:latest

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the app's dependencies
RUN yarn install

# Copy the app's source code to the container
COPY . .

# Build the app
RUN yarn build

# Set the port that the server will listen on
ENV PORT 3000

# Expose the port that the server will listen on
EXPOSE 3000

# Start the server
CMD ["yarn", "start"]
