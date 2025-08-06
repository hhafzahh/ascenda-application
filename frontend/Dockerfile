# node 20
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy the package json file 
COPY package*.json ./

# Install dependecies
RUN npm install

# Copy the application code into the container
COPY . .

# Expose port 5173 to the outside world
EXPOSE 5173

# run node
CMD ["npm","run","dev"]