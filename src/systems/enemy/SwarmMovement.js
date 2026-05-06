
import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';
import { MathUtils } from '../../utils/Math.js';

// Cấu hình di chuyển bầy đàn
const MAX_LINK_DISTANCE = 10;      // Khoảng cách tối đa để bầy quái co cụm hơn
const TETHER_STRENGTH = 0.1;       // Lực kéo về tâm
const NOISE_INTERVAL_MS = 1200;    // Tốc độ thay đổi hướng (ms)
const BOUNCE_DAMPING = 0.5;        // Giảm phản hồi nảy để quái di chuyển mượt khi chạm biên
const BOUNDS = {
  minX: -25, maxX: 25,              // Biên ngang
  minY: 5, maxY: 20,                // Biên dọc (bay phía trên người chơi)
  minZ: -80, maxZ: -20              // Biên sâu (cách tàu ít nhất 20 đơn vị)
};

// Bộ sinh nhiễu ngẫu nhiên cho từng enemy
function createNoiseGenerator() {
  let timer = 0;
  const vec = new THREE.Vector3();

  return (delta) => {
    timer += delta * 1000;
    if (timer >= NOISE_INTERVAL_MS) {
      vec.set(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4
      );
      timer = 0;
    }
    return vec;
  };
}

export class SwarmMovement {
  constructor() {
    this._noiseMap = new WeakMap();   // Ánh xạ Enemy -> noiseFn
    this._baseSpeed = 0.6;            // Tốc độ cơ bản
  }

  // Đăng ký enemy mới vào hệ thống di chuyển bầy đàn
  register(enemy) {
    let speed = CONFIG.ENEMIES[enemy.type]?.MOVE_SPEED || this._baseSpeed;
    
    if (enemy.speedMultiplier) speed *= enemy.speedMultiplier;
    
    // Khởi tạo vận tốc ngẫu nhiên với độ dài cố định bằng speed
    const vel = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize().multiplyScalar(speed);
    
    enemy.swarmVelocity = vel;
    this._noiseMap.set(enemy, createNoiseGenerator());
  }

  // Cập nhật vị trí cho toàn bộ danh sách enemy
  update(enemyList, delta, playerPos) {
    // Tính trọng tâm của cả bầy
    const centroid = MathUtils.computeCentroid(enemyList);
    
    enemyList.forEach(enemy => {
      if (enemy.isOrbitalShield || enemy.isTutorial) return;
      
      if (!enemy.swarmVelocity) enemy.swarmVelocity = new THREE.Vector3();
      const vel = enemy.swarmVelocity;
      const noiseFn = this._noiseMap.get(enemy) || (() => new THREE.Vector3());
      
      // Áp dụng các lực: nhiễu, kéo về tâm, giới hạn biên
      MathUtils.applyNoise(vel, noiseFn(delta));
      MathUtils.applyTether(vel, enemy.mesh.position, centroid, MAX_LINK_DISTANCE, TETHER_STRENGTH);
      MathUtils.applyBounds(enemy.mesh.position, vel, BOUNDS, BOUNCE_DAMPING, delta);
      
      // Đảm bảo enemy luôn ở phía trước người chơi
      if (playerPos) MathUtils.ensureInFrontOfPlayer(enemy.mesh.position, vel, playerPos, BOUNDS, BOUNCE_DAMPING);
    });
  }

  // Hủy đăng ký enemy khi bị tiêu diệt
  unregister(enemy) {
    this._noiseMap.delete(enemy);
  }
}
