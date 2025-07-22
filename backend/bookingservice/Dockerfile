# node 20
FROM node:20

# Set environment variables
#ENV MONGODB_CONNECTIONSTR=include-here or comment it (add as params in command)
ENV PORT=3002

# Set the working directory in the container
WORKDIR /app

# Copy the package json file 
COPY package*.json ./

# Install dependecies
RUN npm install

# Copy the application code into the container
COPY . .

# Expose port 3002 to the outside world
EXPOSE 3002

# run node
CMD ["node", "index.js"]