import * as THREE from 'three';
/**
 * Thư viện MathUtils – chứa các hàm toán học và xử lý chuyển động dùng chung trong
 * dự án Space‑Game. Tất cả các hàm đều có chú thích bằng tiếng Việt, giải thích mục
 * đích, cơ chế thực hiện và ví dụ cách gọi.
 */
export const MathUtils = {
  /**
   * Kiểm tra va chạm sphere‑sphere (phiên bản dùng bình phương bán kính để tối ưu).
   * @param {THREE.Vector3} posA - Vị trí tâm sphere A.
   * @param {THREE.Vector3} posB - Vị trí tâm sphere B.
   * @param {number} radSqA - Bán kính bình phương của sphere A.
   * @param {number} radSqB - Bán kính bình phương của sphere B.
   * @returns {boolean} true nếu giao nhau.
   * @usage MathUtils.checkSphereCollisionSq(pos1, pos2, r1Sq, r2Sq);
   */
  checkSphereCollisionSq(posA, posB, radSqA, radSqB) {
    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    const dz = posA.z - posB.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    const r1 = Math.sqrt(radSqA);
    const r2 = Math.sqrt(radSqB);
    const minDistSq = (r1 + r2) * (r1 + r2);
    return distSq <= minDistSq;
  },

  /**
   * Kiểm tra va chạm giữa hai hình cầu (sphere‑sphere) dùng bán kính trực tiếp.
   * @param {THREE.Vector3} posA - Vị trí tâm của sphere A.
   * @param {number} radA - Bán kính sphere A.
   * @param {THREE.Vector3} posB - Vị trí tâm của sphere B.
   * @param {number} radB - Bán kính sphere B.
   * @returns {boolean} true nếu hai sphere giao nhau.
   */
  collisionSphere(posA, radA, posB, radB) {
    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    const dz = posA.z - posB.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    const limit = (radA + radB) * (radA + radB);
    return distSq <= limit;
  },

  /**
   * Tính centroid (trọng tâm) của một dãy đối tượng (ví dụ: enemy).
   * @param {Array<Object>} list - Mảng các đối tượng có thuộc tính `mesh.position`.
   * @returns {THREE.Vector3} Vị trí centroid.
   */
  computeCentroid(list) {
    if (!list || list.length === 0) return new THREE.Vector3();
    const centroid = new THREE.Vector3();
    list.forEach(item => {
        if (item.mesh) centroid.add(item.mesh.position);
    });
    centroid.divideScalar(list.length);
    return centroid;
  },

  /**
   * Thêm jitter (nhiễu) vào vector vận tốc để tạo chuyển động ngẫu nhiên.
   * @param {THREE.Vector3} vel - Vector vận tốc (bị thay đổi trực tiếp).
   * @param {THREE.Vector3} noiseVec - Vector nhiễu.
   */
  applyNoise(vel, noiseVec) {
    if (noiseVec) vel.add(noiseVec);
  },

  /**
   * Tether – kéo đối tượng về phía centroid nếu khoảng cách vượt quá giới hạn.
   * @param {THREE.Vector3} vel - Vận tốc (bị thay đổi).
   * @param {THREE.Vector3} pos - Vị trí hiện tại.
   * @param {THREE.Vector3} centroid - Điểm trung tâm.
   * @param {number} maxDist - Khoảng cách tối đa cho phép.
   * @param {number} strength - Hệ số lực kéo.
   */
  applyTether(vel, pos, centroid, maxDist, strength) {
    const dist = pos.distanceTo(centroid);
    if (dist > maxDist) {
      const toCenter = new THREE.Vector3()
        .subVectors(centroid, pos)
        .normalize()
        .multiplyScalar(strength * (dist - maxDist));
      vel.add(toCenter);
    }
  },

  /**
   * Giới hạn vị trí trong không gian và phản hồi vận tốc khi chạm biên (bounce).
   * @param {THREE.Vector3} pos - Vị trí (bị thay đổi).
   * @param {THREE.Vector3} vel - Vận tốc (bị thay đổi).
   * @param {object} BOUNDS - {minX, maxX, minY, maxY, minZ, maxZ}.
   * @param {number} damping - Hệ số dập tắt lực nảy.
   * @param {number} delta - Thời gian sai khác giữa các khung hình.
   */
  applyBounds(pos, vel, BOUNDS, damping, delta) {
    const next = new THREE.Vector3().copy(pos).addScaledVector(vel, delta);
    if (next.x < BOUNDS.minX) { next.x = BOUNDS.minX; vel.x *= -damping; }
    else if (next.x > BOUNDS.maxX) { next.x = BOUNDS.maxX; vel.x *= -damping; }
    if (next.y < BOUNDS.minY) { next.y = BOUNDS.minY; vel.y *= -damping; }
    else if (next.y > BOUNDS.maxY) { next.y = BOUNDS.maxY; vel.y *= -damping; }
    if (next.z < BOUNDS.minZ) { next.z = BOUNDS.minZ; vel.z *= -damping; }
    else if (next.z > BOUNDS.maxZ) { next.z = BOUNDS.maxZ; vel.z *= -damping; }
    pos.copy(next);
  },

  /**
   * Đảm bảo đối tượng luôn nằm phía trước người chơi (trên trục Z).
   * @param {THREE.Vector3} pos - Vị trí đối tượng.
   * @param {THREE.Vector3} vel - Vận tốc đối tượng.
   * @param {THREE.Vector3} playerPos - Vị trí người chơi.
   * @param {object} BOUNDS - Giới hạn không gian.
   * @param {number} damping - Hệ số bounce.
   */
  ensureInFrontOfPlayer(pos, vel, playerPos, BOUNDS, damping) {
    const minZ = playerPos.z - 20; 
    if (pos.z > minZ) {
      pos.z = minZ;
      vel.z *= -damping;
    }
  },

  /**
   * Tính toán bán kính bao quanh mesh của tàu để tạo shield sphere chính xác.
   * @param {THREE.Mesh} mesh - Mesh cần tính toán.
   * @returns {number} Bán kính phù hợp.
   */
  calculateShieldRadius(mesh) {
    if (!mesh) return 100;
    let maxDistSq = 0;
    mesh.traverse(child => {
      if (child.isMesh && child.geometry) {
        const pos = child.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const d = pos.getX(i) ** 2 + pos.getY(i) ** 2 + pos.getZ(i) ** 2;
          if (d > maxDistSq) maxDistSq = d;
        }
      }
    });
    return Math.sqrt(maxDistSq) * 1.1;
  },

  /**
   * Mở rộng bán kính thu thập vật phẩm (Item Collection).
   * @param {number} baseRadius - Bán kính cơ bản.
   * @param {number} factor - Hệ số mở rộng (mặc định 1.25).
   * @returns {number} Bán kính mới.
   */
  scaleItemRadius(baseRadius, factor = 1.25) {
    return baseRadius * factor;
  },

  /** Nội suy tuyến tính */
  lerp(a, b, t) { return a + (b - a) * t; },

  /** Giới hạn đối tượng trong vùng bay an toàn quanh player */
  clampToPlayArea(pos, playerPos, envelope) {
    if (!pos || !playerPos || !envelope) return;
    const minX = playerPos.x - envelope.X;
    const maxX = playerPos.x + envelope.X;
    const minY = playerPos.y - envelope.Y;
    const maxY = playerPos.y + envelope.Y;
    pos.x = THREE.MathUtils.clamp(pos.x, minX, maxX);
    pos.y = THREE.MathUtils.clamp(pos.y, minY, maxY);
  },

  /** Duy trì khoảng cách tối thiểu so với player */
  enforceMinDistance(pos, playerPos, minDist) {
    if (!pos || !playerPos) return;
    const dx = pos.x - playerPos.x;
    const dy = pos.y - playerPos.y;
    const dz = pos.z - playerPos.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    const minDistSq = minDist * minDist;
    if (distSq < minDistSq) {
      const dist = Math.sqrt(distSq) || 0.001;
      const scale = (minDist - dist) / dist;
      pos.x += dx * scale;
      pos.y += dy * scale;
      pos.z += dz * scale;
    }
  },

  /**
   * Tính khoảng cách ngắn nhất từ một điểm (quái vật) đến một tia (đường đạn).
   * @param {THREE.Vector3} point - Vị trí quái vật.
   * @param {THREE.Vector3} rayOrigin - Vị trí bắn.
   * @param {THREE.Vector3} rayDir - Hướng đạn (đã chuẩn hóa).
   * @returns {number} Khoảng cách ngắn nhất.
   */
  getPointRayDistance(point, rayOrigin, rayDir) {
    const v = new THREE.Vector3().subVectors(point, rayOrigin);
    const dot = v.dot(rayDir);
    // Nếu quái ở phía sau hướng bắn, trả về khoảng cách đến gốc tia
    if (dot < 0) return rayOrigin.distanceTo(point);
    const projection = new THREE.Vector3().copy(rayDir).multiplyScalar(dot);
    const dist = v.sub(projection).length();
    return dist;
  }
};
