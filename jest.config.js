module.exports = {
  testEnvironment: 'jest-environment-jsdom', // Use jsdom for tests needing a DOM
  // If we needed ES6 module transformations:
  // transform: {
  //   '^.+\.js$': 'babel-jest',
  // },
  // setupFilesAfterEnv: ['./jest.setup.js'], // For global test setup if needed later
  // moduleNameMapper: { // If we had path aliases
  //  '^@/(.*)$': '<rootDir>/src/$1',
  // },
  // verbose: true, // More detailed output
};
