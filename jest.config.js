module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(three)/)',
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^three/examples/jsm/loaders/GLTFLoader.js$': '<rootDir>/node_modules/three/examples/jsm/loaders/GLTFLoader.js',
    '^three$': '<rootDir>/node_modules/three/build/three.module.js',
  },
};
