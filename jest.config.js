module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  // With the new babel.config.js, this ignore pattern is now critical.
  // It tells Jest to process the 'three' module through Babel.
  transformIgnorePatterns: [
    'node_modules/(?!(three)/)',
  ],
  testEnvironment: 'jest-environment-jsdom',
  // This mapping is also necessary to ensure Jest finds the correct
  // ES module entry point for 'three'.
  moduleNameMapper: {
    '^three/examples/jsm/loaders/GLTFLoader.js$': '<rootDir>/node_modules/three/examples/jsm/loaders/GLTFLoader.js',
    '^three$': '<rootDir>/node_modules/three/build/three.module.js',
  },
};
