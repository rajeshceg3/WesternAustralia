// UI.js

class UI {
    constructor(scene, font) {
        this.scene = scene;
        this.font = font;
        this.elements = [];
    }

    createText(text, position, size, color) {
        const geometry = new THREE.TextGeometry(text, {
            font: this.font,
            size: size,
            height: 0.05,
        });
        const material = new THREE.MeshBasicMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        this.scene.add(mesh);
        this.elements.push(mesh);
        return mesh;
    }

    createButton(text, position, onClick) {
        // ...
    }
}

export default UI;
