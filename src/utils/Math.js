export const MathUtils = {
    checkSphereCollisionSq: function(pos1, pos2, radSq1, radSq2) {
        if (!pos1 || !pos2) return false;
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        
        // Vì tham số truyền vào là r^2, ta cần lấy lại bán kính r để tính tổng bình phương khoảng cách
        const r1 = Math.sqrt(radSq1);
        const r2 = Math.sqrt(radSq2);
        const minDistanceSq = (r1 + r2) * (r1 + r2);
        
        return distSq <= minDistanceSq;
    },

    /**
     * Tính tọa độ điểm trên mặt cầu (Spherical to Cartesian)
     * @param {number} radius - Bán kính
     * @param {number} phi - Góc vĩ độ (0 -> PI)
     * @param {number} theta - Góc kinh độ (0 -> 2*PI)
     */
    getSphericalCoordinate: function(radius, phi, theta) {
        return {
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.sin(phi) * Math.sin(theta),
            z: radius * Math.cos(phi)
        };
    },

    /**
     * Nội suy tuyến tính (Linear Interpolation)
     */
    lerp: function(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Tính toán bán kính bao phủ tối ưu dựa trên các đỉnh của mô hình (Geometry vertices)
     * @param {THREE.Mesh} mesh - Mô hình cần tính toán
     * @returns {number} Bán kính bao phủ
     */
    calculateShieldRadius: function(mesh) {
        if (!mesh) return 100;
        
        let maxDistSq = 0;
        mesh.traverse((child) => {
            if (child.isMesh && child.geometry) {
                const posAttr = child.geometry.attributes.position;
                for (let i = 0; i < posAttr.count; i++) {
                    const x = posAttr.getX(i);
                    const y = posAttr.getY(i);
                    const z = posAttr.getZ(i);
                    const distSq = x * x + y * y + z * z;
                    if (distSq > maxDistSq) maxDistSq = distSq;
                }
            }
        });

        return Math.sqrt(maxDistSq) * 1.1; // Thêm 10% để bao quát thoải mái
    }
};
