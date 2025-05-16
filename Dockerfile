# Use an official Node.js runtime as a parent image
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

# Use Node.js as a base image for serving the Angular app
FROM node:20-alpine3.20
LABEL description="fix: added the possibility to show dashboard from either grafana or streamlit in lms data retention search"

# Set the working directory in the container
WORKDIR /usr/src/app
# Copy built Angular app from the 'build' stage
COPY --from=build /usr/src/app/dist/check-scanner /usr/src/app/dist
# COPY --from=build /usr/src/app/.env /usr/src/app/.env/

# Install express server and json-server
RUN npm install express --save
RUN npm install -g json-server --save

# Copy custom server file and supervisord configuration

COPY supervisord.conf /etc/supervisord.conf

# Expose port 3000 for the Express server (frontend)
EXPOSE 3000

# Install supervisor
RUN apk add --no-cache supervisor

# Set the default command to run supervisord
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
