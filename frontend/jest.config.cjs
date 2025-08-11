module.exports = {
  setupFiles: ['<rootDir>/tests/setupTests.js'],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^components/(.*)$": "<rootDir>/src/components/$1",
    "^pages/(.*)$": "<rootDir>/src/pages/$1",
    "^helper/(.*)$": "<rootDir>/src/helper/$1",
    "^assets/(.*)$": "<rootDir>/src/assets/$1",
  },
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.test.jsx'],
};
