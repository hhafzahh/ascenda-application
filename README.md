
## Environment Setup

### Backend (MongoDB with Node.js) Environment Configuration

1. Navigate to the `backend` folder:
   - cd backend
   - npm install
   - touch .env
3. In the .env file, add in the following, replacing username and password:
   - MONGODB_CONNECTIONSTR=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hotelbookingdb?retryWrites=true&w=majority&appName=Cluster0

### Frontend (React with Vite) Environment Configuration 

1. Navigate to the `frontend` folder:
   - cd frontend
   - npm install

## Starting Server

### You must start both frontend and backend servers to run the full app.

1. Starting backend server:
   - cd backend
   - npm install
   - npm start

2. Starting frontend server:
   - cd frontend
   - npm install
   - npm start
