import * as THREE from 'three';

export const Patterns = {
    // Wave 1: Formation (e.g., an inverted V or Grid)
    FORMATION_WAVE_1: (index, total) => {
        const spacing = 4;
        const rowSize = 5;
        const x = (index % rowSize - (rowSize - 1) / 2) * spacing;
        const y = (Math.floor(index / rowSize) - 0.5) * spacing + 5;
        return new THREE.Vector3(x, y, -150);
    },

    // Wave 2: Random movement in top 1/3
    getRandomTopPosition: () => {
        return new THREE.Vector3(
            (Math.random() - 0.5) * 30,
            5 + Math.random() * 5,
            -150
        );
    },

    // Update logic for random movement
    updateRandomMovement: (position, delta, speed) => {
        // Simple erratic movement
        position.x += Math.sin(Date.now() * 0.001) * delta * speed;
        position.y += Math.cos(Date.now() * 0.001) * delta * speed;
    }
};
