# node 20
FROM node:20

# Set environment variables
ENV PORT=3001

# Set the working directory in the container
WORKDIR /app

# Copy the package json file 
COPY package*.json ./

# Install dependecies
RUN npm install

# Copy the application code into the container
COPY . .

# Expose port 5000 to the outside world
EXPOSE 3001

# run node
CMD ["node", "index.js"]