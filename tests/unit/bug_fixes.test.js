import SiteManager from '../../SiteManager.js';
import SceneManager from '../../SceneManager.js';
import * as THREE from 'three';

// Mock Three.js parts that cause issues in JSDOM or are heavy
jest.mock('three', () => {
    const originalModule = jest.requireActual('three');
    return {
        ...originalModule,
        WebGLRenderer: jest.fn().mockImplementation(() => ({
            setSize: jest.fn(),
            setPixelRatio: jest.fn(),
            render: jest.fn(),
            // Mock domElement as a simple object to avoid accessing document in factory
            domElement: { addEventListener: jest.fn() },
            shadowMap: { enabled: true },
        })),
        Scene: jest.fn().mockImplementation(() => ({
            add: jest.fn(),
            background: null,
            environment: null,
        })),
        Clock: jest.fn().mockImplementation(() => ({
            getDelta: jest.fn(() => 0.016),
            getElapsedTime: jest.fn(() => 1),
        })),
        Group: jest.fn().mockImplementation(() => ({
            add: jest.fn(),
            traverse: jest.fn(),
            userData: {},
        })),
    };
});

// Mock external loaders
jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
    OrbitControls: jest.fn().mockImplementation(() => ({
        enableDamping: true,
        update: jest.fn(),
    })),
}));
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
    GLTFLoader: jest.fn().mockImplementation(() => ({
        manager: {},
        load: jest.fn(),
        setDRACOLoader: jest.fn(),
    })),
}));
jest.mock('three/examples/jsm/loaders/DRACOLoader.js', () => ({
    DRACOLoader: jest.fn().mockImplementation(() => ({
        setDecoderPath: jest.fn(),
    })),
}));
jest.mock('three/examples/jsm/loaders/RGBELoader.js', () => ({
    RGBELoader: jest.fn().mockImplementation(() => ({
        load: jest.fn(),
    })),
}));
jest.mock('three/examples/jsm/postprocessing/EffectComposer.js', () => ({
    EffectComposer: jest.fn().mockImplementation(() => ({
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

describe('Bug Fixes Verification', () => {
    test('SceneManager should restart render loop', () => {
        const canvas = document.createElement('canvas');
        const sceneManager = new SceneManager(canvas);

        // Simulate stopped renderer
        sceneManager.rendererStopped = true;
        sceneManager.consecutiveErrors = 11;

        const updateCallback = jest.fn();

        // Mock render to prevent actual recursion/errors during test
        // We want to verify it calls render, so we mock it on the instance
        sceneManager.render = jest.fn();

        sceneManager.restartRenderLoop(updateCallback);

        expect(sceneManager.rendererStopped).toBe(false);
        expect(sceneManager.consecutiveErrors).toBe(0);
        expect(sceneManager.render).toHaveBeenCalledWith(updateCallback);
    });

    test('SiteManager should allow retry (force switch) to same index', () => {
        const mockScene = new THREE.Scene();
        const mockLoader = {
            load: jest.fn(),
            manager: {},
        };
        const siteManager = new SiteManager(mockScene, mockLoader, jest.fn());

        // Mock data to prevent createFunc errors
        siteManager.sitesData = [
            {
                name: 'Test',
                description: 'Desc',
                modelUrl: 'test.glb',
                createFunc: jest.fn().mockReturnValue(new THREE.Group()),
            },
        ];

        // Set current state
        siteManager.currentSiteIndex = 0;
        siteManager.isTransitioning = false;

        // Attempt switch to same index without force
        siteManager.switchSite(0, { getElapsedTime: () => 0 }, jest.fn(), false);
        expect(siteManager.sitesData[0].createFunc).not.toHaveBeenCalled();

        // Attempt switch to same index WITH force
        siteManager.switchSite(0, { getElapsedTime: () => 0 }, jest.fn(), true);
        expect(siteManager.sitesData[0].createFunc).toHaveBeenCalled();
        expect(siteManager.isTransitioning).toBe(true);
    });
});
