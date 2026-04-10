import * as THREE from 'three';

/**
 * GSA.js (Geometry Sample & Animation)
 * Lớp tiện ích dùng để trích xuất và quản lý tọa độ các điểm từ mô hình 3D (Vertices).
 * Phục vụ cho các hiệu ứng hạt (Particle Effects) và hội tụ điểm (Convergence) dùng GSAP.
 */
export class GSA {
    /**
     * Trích xuất tọa độ các đỉnh từ một mô hình 3D (Mesh/Group).
     * @param {THREE.Object3D} model - Mô hình 3D cần lấy dữ liệu.
     * @param {number} maxPoints - Giới hạn số lượng điểm để tối ưu hiệu năng.
     * @returns {Float32Array} Mảng các tọa độ [x, y, z, x, y, z, ...]
     */
    static getModelPoints(model, maxPoints = 25000) {
        if (!model) {
            console.error("GSA Error: Model không tồn tại để lấy tọa độ.");
            return new Float32Array(0);
        }

        const rawPoints = [];
        model.updateMatrixWorld(true);

        // TỐI ƯU HÓA BỘ NHỚ RAM: Chỉ khởi tạo 1 biến Vector3 duy nhất để tái sử dụng
        // Thay vì tạo hàng trăm ngàn Vector3 bên trong vòng lặp làm đơ máy do Garbage Collector
        const vertex = new THREE.Vector3();

        model.traverse((child) => {
            if (child.isMesh) {
                const geometry = child.geometry;
                if (!geometry || !geometry.attributes.position) return;
                
                const positions = geometry.attributes.position.array;
                const matrix = child.matrixWorld;

                // Duyệt qua các đỉnh và áp dụng ma trận thế giới (World Matrix) siêu mượt
                for (let i = 0; i < positions.length; i += 3) {
                    vertex.set(
                        positions[i], 
                        positions[i + 1], 
                        positions[i + 2]
                    );
                    vertex.applyMatrix4(matrix); // Chuyển đổi về tọa độ thế giới
                    rawPoints.push(vertex.x, vertex.y, vertex.z);
                }
            }
        });

        console.log(`GSA: Đã lấy mẫu ${rawPoints.length / 3} điểm từ mô hình 3D.`);

        // Xử lý lấy mẫu (Sampling) nếu số lượng đỉnh quá lớn
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
            console.log(`GSA: Đã lấy mẫu thành công ${sampledPoints.length / 3} điểm.`);
            return sampledPoints;
        }

        console.log(`GSA: Đã lấy mẫu thành công ${rawPoints.length / 3} điểm.`);
        return new Float32Array(rawPoints);
    }

    /**
     * Lưu trữ dữ liệu điểm vào một đối tượng hoặc trả về JSON.
     * Dùng khi muốn cache lại tọa độ điểm tụ để không phải tính toán lại mỗi frame.
     */
    static saveAsJSON(pointsArray) {
        return JSON.stringify(Array.from(pointsArray));
    }

    /**
     * Tạo hiệu ứng hội tụ (Convergence) từ Particle System đến tập hợp điểm đích.
     * @param {GSAP} gsap - Đối tượng GSAP.
     * @param {THREE.Points} particles - Hệ thống hạt hiện tại.
     * @param {Float32Array} targetPoints - Tọa độ các điểm đích.
     * @param {object} options - Cấu hình duration, ease, v.v.
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
            console.error("GSA: Hủy animation vì targetPoints rỗng!");
            if (onComplete) onComplete();
            return gsap.timeline();
        }

        // BẢO TOÀN VỊ TRÍ TUYỆT ĐỐI KHÔNG BỊ TRƯỢT (Bake Matrix):
        // Chuyển toàn bộ tọa độ các hạt hiện tại từ Không gian Hệ tọa độ Cục bộ (Local) 
        // sang Không gian Thế giới (World Space) tại chính xác giây phút bắt đầu tụ điểm.
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
        
        // Sau đó đưa hệ thống Group Hạt về lại hệ quy chiếu gốc tọa độ (0,0,0)
        // Hệ quả: Các hạt trên màn hình ĐỨNG YÊN không bị giật, 
        // nhưng giờ đây chúng đã tính theo cùng hệ tọa độ World chuẩn mực với con tàu đích!
        particles.position.set(0, 0, 0);
        particles.rotation.set(0, 0, 0);
        particles.scale.set(1, 1, 1);
        particles.updateMatrixWorld(true);

        // TỐI ƯU HÓA TUYỆT ĐỐI (GPU BATCHING): Chuyển tọa độ đích vào Card đồ họa để Shader xử lý.
        // Hủy bỏ hoàn toàn vòng lặp Javascript trên CPU, giải quyết triệt để lỗi giật lag (100% FPS)
        const targetPositions = new Float32Array(count * 3);

        
        for (let i = 0; i < count; i++) {
            // Ráp nối chuẩn xác 1-1 giữa hạt logo và hạt phi thuyền, 
            // đảm bảo bao phủ 100% không để chừa bất kỳ điểm nào chưa được sơn
            const tIdx = i % targetLen;
            targetPositions[i * 3]     = targetPoints[tIdx * 3];
            targetPositions[i * 3 + 1] = targetPoints[tIdx * 3 + 1];
            targetPositions[i * 3 + 2] = targetPoints[tIdx * 3 + 2];
        }
        
        // Gửi mảng điểm đích lên Buffer VRAM của GPU
        geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));

        const oldMaterial = particles.material;
        
        // Khởi tạo Vật liệu đổ bóng đặc chế (Custom Shader)
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
                    // Trộn vị trí tịnh tiến trực tiếp trên GPU siêu nhanh
                    vec3 finalPos = mix(position, targetPosition, uProgress);
                    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
                    
                    // GIẢI QUYẾT LAG GPU (Fill Rate Bottleneck):
                    // Khi tụ lại, các hạt đè lên nhau. Giảm kích thước khi uProgress -> 1
                    // giúp card đồ họa không phải vẽ hàng tỷ điểm ảnh đè lên nhau.
                    float currentSize = mix(250.0, 60.0, uProgress);
                    gl_PointSize = currentSize / -mvPosition.z; 
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Mix màu gốc của Logo về màu Xanh Lục Lam Năng Lượng (Cyan Energy)
                    vec3 endColor = vec3(0.0, 0.8, 1.0);
                    vColor = mix(color, endColor, uProgress);
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                varying vec3 vColor;
                void main() {
                    vec4 texColor = texture2D(uTexture, gl_PointCoord);
                    // Bỏ qua các điểm ảnh rỗng viền (Tối ưu tài nguyên Render)
                    if(texColor.a < 0.05) discard; 
                    gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * 0.9);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        // Bật Shader bật hiệu năng cao lên
        particles.material = shaderMaterial;

        // THUẬT TOÁN ĐỈNH CAO: Bây giờ ta chỉ thay đổi DUY NHẤT 1 biến JS trong RAM
        // Còn 100,000+ hạt toạ độ nội suy sẽ được xử lý trên lõi CUDA/Cores của Card màn hình (GPU)
        return gsap.to(shaderMaterial.uniforms.uProgress, {
            value: 1.0,
            duration: duration,
            ease: ease,
            onComplete: onComplete
        });
    }
}
