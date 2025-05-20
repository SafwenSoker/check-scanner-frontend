# Use an official Node.js runtime as a parent image for building
FROM node:20-alpine3.20 as build

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Install app dependencies
RUN npm install

# Copy the rest of your application code to the working directory
COPY . .

# Build the Angular app for production with the Angular CLI
RUN ng build

# Use Nginx as the production server
FROM nginx:alpine

# Copy the nginx configuration template
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built Angular app from the build stage to the nginx html directory
COPY --from=build /usr/src/app/dist/check-scanner /usr/share/nginx/html

# Expose port 80 for the Nginx server
EXPOSE 80

# Start Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]
