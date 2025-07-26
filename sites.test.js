// Mock basic Three.js components used by the site creation functions
const mockGroup = {
    isGroup: true,
    children: [],
    add: jest.fn(function(child) { this.children.push(child); }),
    traverse: jest.fn(), // Keep it simple or mock behavior if needed for setGroupOpacity
    // position, rotation, scale if needed
};
const mockMesh = {
    isMesh: true,
    castShadow: false,
    receiveShadow: false,
    position: { y: 0, set: jest.fn() },
    rotation: { y: 0, x: 0 },
    scale: { set: jest.fn() },
    geometry: { type: 'UnknownGeometry' }, // Store type for assertion
    material: { type: 'UnknownMaterial' }  // Store type for assertion
};
const mockPoints = { isPoints: true, geometry: {}, material: {} };
const mockBufferGeometry = { setAttribute: jest.fn(), type: 'BufferGeometry' };
const mockFloat32BufferAttribute = jest.fn(); // Constructor
const mockPointsMaterial = { type: 'PointsMaterial' };
const mockStandardMaterial = { type: 'MeshStandardMaterial', color: 0x000000, roughness: 0, metalness: 0 };
const mockDodecahedronGeometry = { type: 'DodecahedronGeometry' };
const mockBoxGeometry = { type: 'BoxGeometry' };
const mockPlaneGeometry = { type: 'PlaneGeometry' };
const mockCylinderGeometry = { type: 'CylinderGeometry' };
const mockShape = { moveTo: jest.fn(), absarc: jest.fn(), lineTo: jest.fn() };
const mockExtrudeGeometry = { type: 'ExtrudeGeometry' };

// Make THREE global as it's used like that in main.js's AppContext site creation functions
global.THREE = {
    Group: jest.fn(() => ({ ...mockGroup, children: [], add: jest.fn(function(child) { this.children.push(child); }) })),
    Mesh: jest.fn((geometry, material) => ({
        ...mockMesh,
        geometry,
        material,
        position: {y:0, set:jest.fn()},
        rotation:{y:0,x:0},
        scale:{set:jest.fn()}
    })),
    Points: jest.fn((geometry, material) => ({ ...mockPoints, geometry, material })),
    BufferGeometry: jest.fn(() => ({...mockBufferGeometry, setAttribute: jest.fn()})), // ensure setAttribute is on the instance
    Float32BufferAttribute: mockFloat32BufferAttribute,
    PointsMaterial: jest.fn((props) => ({...mockPointsMaterial, ...props})),
    MeshStandardMaterial: jest.fn((props) => ({...mockStandardMaterial, ...props})),
    DodecahedronGeometry: jest.fn(() => ({...mockDodecahedronGeometry})),
    BoxGeometry: jest.fn(() => ({...mockBoxGeometry})),
    PlaneGeometry: jest.fn(() => ({...mockPlaneGeometry})),
    CylinderGeometry: jest.fn((...args) => ({...mockCylinderGeometry, args})), // Store args for inspection if needed
    Shape: jest.fn(() => ({...mockShape, moveTo: jest.fn(), absarc: jest.fn(), lineTo: jest.fn()})),
    ExtrudeGeometry: jest.fn(() => ({...mockExtrudeGeometry})),
    // Add any other THREE components used directly by site functions
};

import AppContext from './main.js';

jest.mock('three', () => ({
    Group: jest.fn(() => ({ isGroup: true, add: jest.fn(), traverse: jest.fn(), userData: {} })),
}));

import * as THREE from 'three';

global.THREE = THREE;

describe('AppContext Site Creation Functions', () => {
    test('createPlaceholderSite1 returns a THREE.Group object', () => {
        const siteGroup = AppContext.createPlaceholderSite1();
        expect(siteGroup.isGroup).toBe(true);
    });

    test('createPlaceholderSite2 returns a THREE.Group object', () => {
        const siteGroup = AppContext.createPlaceholderSite2();
        expect(siteGroup.isGroup).toBe(true);
    });

    test('createPlaceholderSite3 returns a THREE.Group object', () => {
        const siteGroup = AppContext.createPlaceholderSite3();
        expect(siteGroup.isGroup).toBe(true);
    });
});
