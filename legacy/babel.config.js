// This is the correct way to configure Babel for a project that uses ES Modules
// but needs to run tests in a CommonJS environment like Jest.
module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                // Keep ES modules for the main build (e.g., for browsers)
                // This will be overridden for the 'test' environment below.
                modules: false,
                targets: {
                    node: 'current',
                },
            },
        ],
    ],
    // This 'env' block is the key to the solution.
    // It tells Babel to use a different configuration for the 'test' environment.
    env: {
        test: {
            presets: [
                [
                    '@babel/preset-env',
                    {
                        // Jest runs in Node, so we target the current Node version.
                        targets: {
                            node: 'current',
                        },
                        // This is the critical line: it forces Babel to transpile ES modules
                        // to CommonJS, which is what Jest expects.
                        modules: 'commonjs',
                    },
                ],
            ],
        },
    },
};
