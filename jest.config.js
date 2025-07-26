module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!three/.*)'
  ],
  moduleNameMapper: {
    '^three$': '<rootDir>/node_modules/three/build/three.module.js',
    'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js': '<rootDir>/__mocks__/tween.umd.js',
  },
};
