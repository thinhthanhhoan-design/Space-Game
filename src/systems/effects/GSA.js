import * as THREE from 'three';

/**
 * GSA.js (Geometry Sample & Animation)
 * Tiện ích trích xuất và quản lý tọa độ đỉnh (Vertices) từ mô hình 3D.
 * Phục vụ cho các hiệu ứng hạt và hội tụ điểm.
 */
export class GSA {
    /**
     * Trích xuất tọa độ đỉnh từ mô hình 3D (Mesh/Group)
     * @param {THREE.Object3D} model - Mô hình nguồn
     * @param {number} maxPoints - Giới hạn số lượng điểm
     * @returns {Float32Array}
     */
    static getModelPoints(model, maxPoints = 25000) {
        if (!model) {
            console.error("GSA Error: Model không tồn tại.");
            return new Float32Array(0);
        }

        const rawPoints = [];
        model.updateMatrixWorld(true);

        const vertex = new THREE.Vector3();

        model.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                if (!geometry || !geometry.attributes.position) return;
                
                const positions = geometry.attributes.position.array;
                const matrix = child.matrixWorld;

                for (let i = 0; i < positions.length; i += 3) {
                    vertex.set(positions[i], positions[i + 1], positions[i + 2]);
                    vertex.applyMatrix4(matrix); 
                    rawPoints.push(vertex.x, vertex.y, vertex.z);
                }
            }
        });

        // Xử lý lấy mẫu (Sampling) nếu số lượng đỉnh vượt quá giới hạn
        if (rawPoints.length / 3 > maxPoints) {
            const sampledPoints = new Float32Array(maxPoints * 3);
            const totalVertices = rawPoints.length / 3;
            const step = totalVertices / maxPoints;

            for (let i = 0; i < maxPoints; i++) {
                const sourceIdx = Math.floor(i * step) * 3;
                sampledPoints[i * 3] = rawPoints[sourceIdx];
                sampledPoints[i * 3 + 1] = rawPoints[sourceIdx + 1];
                sampledPoints[i * 3 + 2] = rawPoints[sourceIdx + 2];
            }
            return sampledPoints;
        }

        return new Float32Array(rawPoints);
    }

    static saveAsJSON(pointsArray) {
        return JSON.stringify(Array.from(pointsArray));
    }

    /**
     * Tạo hiệu ứng hội tụ hạt đến tập hợp điểm đích sử dụng Shader
     */
    static animateToTarget(gsap, particles, targetPoints, options = {}) {
        const {
            duration = 2.5,
            ease = "power2.out",
            onComplete = null
        } = options;

        const geometry = particles.geometry;
        const count = geometry.attributes.position.count;
        const targetLen = targetPoints.length / 3;

        if (targetLen === 0) {
            console.error("GSA: targetPoints rỗng!");
            if (onComplete) onComplete();
            return gsap.timeline();
        }

        // Chuyển đổi tọa độ các hạt sang không gian thế giới (World Space)
        particles.updateMatrixWorld(true);
        const matrixWorld = particles.matrixWorld;
        const currentPos = geometry.attributes.position.array;
        const tempVec = new THREE.Vector3();
        
        for (let i = 0; i < count; i++) {
            tempVec.set(currentPos[i*3], currentPos[i*3+1], currentPos[i*3+2]);
            tempVec.applyMatrix4(matrixWorld);
            currentPos[i*3] = tempVec.x;
            currentPos[i*3+1] = tempVec.y;
            currentPos[i*3+2] = tempVec.z;
        }
        geometry.attributes.position.needsUpdate = true;
        
        particles.position.set(0, 0, 0);
        particles.rotation.set(0, 0, 0);
        particles.scale.set(1, 1, 1);
        particles.updateMatrixWorld(true);

        const targetPositions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const tIdx = i % targetLen;
            targetPositions[i * 3]     = targetPoints[tIdx * 3];
            targetPositions[i * 3 + 1] = targetPoints[tIdx * 3 + 1];
            targetPositions[i * 3 + 2] = targetPoints[tIdx * 3 + 2];
        }
        
        geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));

        const oldMaterial = particles.material;
        
        const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uProgress: { value: 0.0 },
                uTexture: { value: oldMaterial.map }
            },
            vertexShader: `
                uniform float uProgress;
                attribute vec3 targetPosition;
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vec3 finalPos = mix(position, targetPosition, uProgress);
                    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
                    
                    float currentSize = mix(250.0, 60.0, uProgress);
                    gl_PointSize = currentSize / -mvPosition.z; 
                    gl_Position = projectionMatrix * mvPosition;
                    
                    vec3 endColor = vec3(0.0, 0.8, 1.0);
                    vColor = mix(color, endColor, uProgress);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                varying vec3 vColor;
                void main() {
                    vec4 texColor = texture2D(uTexture, gl_PointCoord);
                    if(texColor.a < 0.05) discard; 
                    gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * 0.9);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        particles.material = shaderMaterial;

        // Nội suy progress trên GPU
        return gsap.to(shaderMaterial.uniforms.uProgress, {
            value: 1.0,
            duration: duration,
            ease: ease,
            onComplete: onComplete
        });
    }
}
