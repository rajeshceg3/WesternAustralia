export default {
    root: './',
    base: './', // Relative base for GH Pages
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['three', '@tweenjs/tween.js'],
                },
            },
        },
    },
    server: {
        open: true
    }
};
