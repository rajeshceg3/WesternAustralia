import SceneManager from '../../SceneManager.js';
import * as THREE from 'three';

// Mock Three.js
jest.mock('three', () => {
    return {
        Scene: jest.fn(() => ({
            add: jest.fn(),
            background: null,
            environment: null,
        })),
        Clock: jest.fn(() => ({
            getDelta: jest.fn(() => 0.016),
            getElapsedTime: jest.fn(() => 1.0),
        })),
        WebGLRenderer: jest.fn(() => ({
            setSize: jest.fn(),
            setPixelRatio: jest.fn(),
            domElement: { addEventListener: jest.fn() }, // Mock domElement
            shadowMap: { enabled: false },
            render: jest.fn(), // Only if using raw renderer, but we use composer
        })),
        PerspectiveCamera: jest.fn(() => ({
            position: { set: jest.fn() },
            lookAt: jest.fn(),
            updateProjectionMatrix: jest.fn(),
            aspect: 1,
        })),
        LoadingManager: jest.fn(),
        AmbientLight: jest.fn(),
        DirectionalLight: jest.fn(() => ({ position: { set: jest.fn() } })),
        Color: jest.fn(),
        EquirectangularReflectionMapping: 301,
    };
});

jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
    OrbitControls: jest.fn(() => ({
        enableDamping: true,
        update: jest.fn(),
        target: { to: jest.fn() }, // for tweening
    })),
}));

jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
    GLTFLoader: jest.fn(() => ({
        setDRACOLoader: jest.fn(),
    })),
}));

jest.mock('three/examples/jsm/loaders/DRACOLoader.js', () => ({
    DRACOLoader: jest.fn(() => ({
        setDecoderPath: jest.fn(),
    })),
}));

jest.mock('three/examples/jsm/loaders/RGBELoader.js', () => ({
    RGBELoader: jest.fn(() => ({
        load: jest.fn(),
    })),
}));

jest.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => ({
    EffectComposer: jest.fn(() => ({
        addPass: jest.fn(),
        setSize: jest.fn(),
        render: jest.fn(),
    })),
}));

jest.mock('three/examples/jsm/postprocessing/RenderPass.js', () => ({
    RenderPass: jest.fn(),
}));

jest.mock('three/examples/jsm/postprocessing/BloomPass.js', () => ({
    BloomPass: jest.fn(),
}));

jest.mock('three/examples/jsm/postprocessing/FilmPass.js', () => ({
    FilmPass: jest.fn(),
}));

jest.mock('@tweenjs/tween.js', () => ({
    Tween: jest.fn(() => ({
        to: jest.fn().mockReturnThis(),
        easing: jest.fn().mockReturnThis(),
        start: jest.fn().mockReturnThis(),
        stop: jest.fn(),
    })),
    Easing: { Quadratic: { InOut: jest.fn() } },
    update: jest.fn(),
}));

describe('SceneManager', () => {
    let canvas;
    let sceneManager;

    beforeEach(() => {
        canvas = document.createElement('canvas');
        sceneManager = new SceneManager(canvas);
    });

    test('initialization creates necessary components', () => {
        expect(THREE.WebGLRenderer).toHaveBeenCalled();
        expect(THREE.Scene).toHaveBeenCalled();
        expect(THREE.PerspectiveCamera).toHaveBeenCalled();
        // Check post-processing
        const { EffectComposer } = require('three/examples/jsm/postprocessing/EffectComposer.js');
        expect(EffectComposer).toHaveBeenCalled();
    });

    test('render loop updates components', () => {
        const updateCallback = jest.fn();

        // Hijack requestAnimationFrame to run once
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => null);

        sceneManager.render(updateCallback);

        expect(updateCallback).toHaveBeenCalled();
        expect(sceneManager.controls.update).toHaveBeenCalled();
        expect(sceneManager.composer.render).toHaveBeenCalled();
    });

    test('circuit breaker stops loop after too many errors', () => {
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => cb()); // Instant recursion? No, just run once.
        // We need to simulate multiple calls.

        // Mock render to throw
        sceneManager.composer.render.mockImplementation(() => {
            throw new Error('Render fail');
        });

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Call render 11 times
        for (let i = 0; i < 11; i++) {
            // We need to reset the recursive call manually or mock requestAnimationFrame differently to avoid infinite stack
            jest.spyOn(window, 'requestAnimationFrame').mockImplementationOnce((cb) => null);
            sceneManager.render();
        }

        expect(sceneManager.rendererStopped).toBe(true);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Too many consecutive render errors. Stopping render loop.');

        consoleErrorSpy.mockRestore();
    });

    test('restartRenderLoop resets error count', () => {
        sceneManager.rendererStopped = true;
        sceneManager.consecutiveErrors = 10;

        jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => null);

        sceneManager.restartRenderLoop();

        expect(sceneManager.rendererStopped).toBe(false);
        expect(sceneManager.consecutiveErrors).toBe(0);
    });
});
