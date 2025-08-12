module.exports = {
  setupFiles: ['<rootDir>/tests/setupTests.js'],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.test.jsx'],
  transformIgnorePatterns: [
    "/node_modules/(?!(react-leaflet|@react-leaflet|leaflet)/)"
  ],
};
