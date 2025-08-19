module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  // With the new babel.config.js, this ignore pattern is now critical.
  // It tells Jest to process the 'three' module through Babel.
  transformIgnorePatterns: [
    'node_modules/(?!(three|@tweenjs/tween.js)/)',
  ],
  testEnvironment: 'jest-environment-jsdom',
  // This mapping is also necessary to ensure Jest finds the correct
  // ES module entry point for 'three'.
  moduleNameMapper: {
    '^three/examples/jsm/(.*)$': '<rootDir>/node_modules/three/examples/jsm/$1',
    '^three$': '<rootDir>/node_modules/three/build/three.module.js',
    '^tween$': '<rootDir>/node_modules/@tweenjs/tween.js/dist/tween.esm.js',
  },
};
