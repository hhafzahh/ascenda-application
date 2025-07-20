module.exports = {
  setupFiles: ['<rootDir>/tests/setupTests.js'],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.test.jsx'],
};