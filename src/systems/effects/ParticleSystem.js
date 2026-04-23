import * as THREE from 'three';
import gsap from 'gsap';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Tạo một texture hình tròn mờ ảo cho hạt
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        this.particleTexture = new THREE.CanvasTexture(canvas);
    }

    /**
     * Tạo vụ nổ hạt tại một vị trí cụ thể với màu sắc chỉ định.
     */
    explodeAt(position, colorHex = 0xffffff) {
        const count = 200; // Tối ưu: Chỉ dùng 100-200 hạt để tránh lag
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        
        const color = new THREE.Color(colorHex);

        for (let i = 0; i < count; i++) {
            // Tất cả hạt bắt đầu tại tâm vụ nổ
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            // Vận tốc văng ra (Tỏa tròn + lao về phía camera trục Z)
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2.0;
            
            velocities[i * 3] = Math.cos(angle) * speed;
            velocities[i * 3 + 1] = Math.sin(angle) * speed;
            velocities[i * 3 + 2] = (Math.random() - 0.2) * 5.0; // Ưu tiên bay về phía trước (Z+)
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: color,
            size: 0.25,
            map: this.particleTexture,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const points = new THREE.Points(geometry, material);
        this.scene.add(points);

        // Animation vụ nổ trong 1.0s bằng GSAP
        const animObj = { progress: 0 };
        gsap.to(animObj, {
            progress: 1,
            duration: 1.0,
            ease: "power1.out",
            onUpdate: () => {
                const posAttr = geometry.attributes.position;
                for (let i = 0; i < count; i++) {
                    posAttr.array[i * 3] += velocities[i * 3] * 0.1;
                    posAttr.array[i * 3 + 1] += velocities[i * 3 + 1] * 0.1;
                    posAttr.array[i * 3 + 2] += velocities[i * 3 + 2] * 0.1;
                }
                posAttr.needsUpdate = true;
                material.opacity = 1 - animObj.progress;
            },
            onComplete: () => {
                this.scene.remove(points);
                geometry.dispose();
                material.dispose();
            }
        });
    }
}
