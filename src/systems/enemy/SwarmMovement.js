// src/systems/enemy/SwarmMovement.js
// ---------------------------------------------------------------
// Swarm / Tethered random movement for a group of enemies.
// ---------------------------------------------------------------
import * as THREE from 'three';
import { CONFIG } from '../../utils/CONFIG.JS';
import { MathUtils } from '../../utils/Math.js';

// -------------------------------------------------------------------
// CONFIGURATION (feel free to expose these in CONFIG.js later)
// -------------------------------------------------------------------
const MAX_LINK_DISTANCE = 10;      // Giảm khoảng cách tối đa để bầy quái co cụm hơn
const TETHER_STRENGTH = 0.1;     // Tăng lực kéo về tâm
const NOISE_INTERVAL_MS = 1200;    // Thay đổi hướng nhanh hơn một chút
const BOUNCE_DAMPING = 0.5;     // Giảm phản hồi nảy để quái di chuyển mượt khi chạm biên
const BOUNDS = {
  minX: -25, maxX: 25,              // Thu hẹp biên X để quái không bay quá sát mép màn hình
  minY: 5, maxY: 20,              // Quái bay ở tầm trên của người chơi
  // Tàu người chơi thường ở Z=0, camera ở Z=6. Quái phải ở vùng âm (Z < -15)
  minZ: -80, maxZ: -20              // Quái luôn ở cách tàu ít nhất 20 đơn vị
};

// -------------------------------------------------------------------
// Helper: small per‑enemy noise generator (simple timer + random vec)
// -------------------------------------------------------------------
function createNoiseGenerator() {
  let timer = 0;
  const vec = new THREE.Vector3();

  return (delta) => {
    timer += delta * 1000; // delta is seconds → convert to ms
    if (timer >= NOISE_INTERVAL_MS) {
      // pick a new tiny direction (unit sphere) and scale it
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

// -------------------------------------------------------------------
// SwarmMovement class – one instance lives in EnemyManager
// -------------------------------------------------------------------
export class SwarmMovement {
  constructor() {
    // each enemy gets its own noise fn & base speed
    this._noiseMap = new WeakMap();   // Enemy → noiseFn
    this._baseSpeed = 0.6;            // Giảm tốc độ cơ bản
  }

  // -------------------------------------------------------------
  // Call once when an Enemy is added to the manager
  // -------------------------------------------------------------
  register(enemy) {
    // Determine speed for this enemy (use config MOVE_SPEED if defined)
    let speed = CONFIG.ENEMIES[enemy.type]?.MOVE_SPEED || this._baseSpeed;
    
    // Áp dụng hệ số nhân tốc độ nếu có (dùng cho việc tăng độ khó theo Level)
    if (enemy.speedMultiplier) speed *= enemy.speedMultiplier;
    
    // Tạo vector hướng ngẫu nhiên nhưng có độ dài (magnitude) cố định = speed
    // Điều này đảm bảo tất cả quái bay đều nhau, không con nhanh con chậm
    const vel = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize().multiplyScalar(speed);
    // Store velocity directly on the enemy instance
    enemy.swarmVelocity = vel;
    this._noiseMap.set(enemy, createNoiseGenerator());
  }

  // -------------------------------------------------------------
  // Core update – called once per frame by EnemyManager
  // -------------------------------------------------------------
  // Cập nhật chuyển động cho toàn bộ enemy trong một khung
  update(enemyList, delta, playerPos) {
    // Tính centroid (trọng tâm) của các enemy hiện có
    const centroid = MathUtils.computeCentroid(enemyList);
    // Duyệt từng enemy, áp dụng jitter, tether, giới hạn và đảm bảo phía trước player
    enemyList.forEach(enemy => {
      // Bỏ qua quái đang làm lá chắn (vì chúng có logic di chuyển riêng trong Enemy.update)
      if (enemy.isOrbitalShield) return;
      
      // Đảm bảo vector vận tốc tồn tại
      if (!enemy.swarmVelocity) enemy.swarmVelocity = new THREE.Vector3();
      const vel = enemy.swarmVelocity;
      const noiseFn = this._noiseMap.get(enemy) || (() => new THREE.Vector3());
      // Thêm jitter (noise)
      MathUtils.applyNoise(vel, noiseFn(delta));
      // Kéo về centroid nếu quá xa
      MathUtils.applyTether(vel, enemy.mesh.position, centroid, MAX_LINK_DISTANCE, TETHER_STRENGTH);
      // Giới hạn vị trí trong bounds và bounce
      MathUtils.applyBounds(enemy.mesh.position, vel, BOUNDS, BOUNCE_DAMPING, delta);
      // Đảm bảo enemy luôn ở phía trước người chơi
      if (playerPos) MathUtils.ensureInFrontOfPlayer(enemy.mesh.position, vel, playerPos, BOUNDS, BOUNCE_DAMPING);
    });
  }

  // -------------------------------------------------------------
  // Clean up when an enemy is removed (optional – GC will collect)
  // -------------------------------------------------------------
  unregister(enemy) {
    this._noiseMap.delete(enemy);
  }
}
