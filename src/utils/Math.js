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
    }
};
