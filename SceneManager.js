// SceneManager.js
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import TWEEN from '@tweenjs/tween.js';

export default class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.clock = new THREE.Clock();
        this.renderer = null;
        this.camera = null;
        this.controls = null;
        this.composer = null;
        this.gltfLoader = null;
        this.init();
    }

    init() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 0, 0);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        const manager = new THREE.LoadingManager();
        this.gltfLoader = new GLTFLoader(manager);

        const rgbeLoader = new RGBELoader(manager);
        rgbeLoader.load('https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
            this.scene.environment = texture;
        }, undefined, (error) => {
            console.error('An error occurred loading the HDR texture:', error);
            // Fallback to a simple color if HDR fails
            this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
            this.scene.environment = null;
        });

        // Lights
        // Boost ambient light slightly to compensate if HDR fails
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // Post-processing
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(new BloomPass(1, 15, 2, 512));
        this.composer.addPass(new FilmPass(0.35, 0.025, 648, false));

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    animateCameraToTarget(targetPosition, targetLookAt, duration = 1000) {
        if (this.cameraTween) this.cameraTween.stop();
        if (this.controlsTween) this.controlsTween.stop();

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const actualDuration = prefersReducedMotion ? 0 : duration;

        this.cameraTween = new TWEEN.Tween(this.camera.position)
            .to(targetPosition, actualDuration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        this.controlsTween = new TWEEN.Tween(this.controls.target)
            .to(targetLookAt, actualDuration)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    }

    render(updateCallback) {
        requestAnimationFrame(() => this.render(updateCallback));

        try {
            const delta = this.clock.getDelta();
            const elapsedTime = this.clock.getElapsedTime();

            this.controls.update();
            TWEEN.update();

            if (updateCallback) {
                updateCallback(delta, elapsedTime);
            }

            this.composer.render();
        } catch (error) {
            console.error("Error in render loop:", error);
            // Optionally stop the loop or show a user-facing error
            // For now, we log it. Since requestAnimationFrame is already called, it will retry.
            // If the error is persistent, it will spam the console.
            // Ideally we might want to pause if errors persist.
        }
    }
}
