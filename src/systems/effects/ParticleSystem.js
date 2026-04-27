import * as THREE from "three";

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // ==========================
    // POOL CONFIG
    // ==========================
    this.maxPoolSize = 20; // tối đa 20 vụ nổ cùng lúc
    this.pool = [];        // pool chứa các Points có thể tái sử dụng
    this.active = [];      // danh sách effect đang chạy

    // ==========================
    // Particle Texture (glow tròn)
    // ==========================
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext("2d");
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);

    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    this.particleTexture = new THREE.CanvasTexture(canvas);

    // tạo sẵn pool ngay từ đầu
    this.initPool();
  }

  // ==================================================
  // Tạo sẵn các Points để tái sử dụng
  // ==================================================
  initPool() {
    for (let i = 0; i < this.maxPoolSize; i++) {
      const count = 200; // pool dùng tối đa 200 hạt

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.22,
        map: this.particleTexture,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const points = new THREE.Points(geometry, material);
      points.visible = false;

      this.scene.add(points);

      this.pool.push({
        points,
        velocities: new Float32Array(count * 3),
        maxCount: count,
      });
    }
  }

  // ==================================================
  // Lấy 1 object từ pool
  // ==================================================
  getFromPool() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return null; // hết pool thì bỏ qua không tạo nữa
  }

  // ==================================================
  // Trả object về pool
  // ==================================================
  returnToPool(item) {
    item.points.visible = false;
    item.points.material.opacity = 0;
    this.pool.push(item);
  }

  // ==================================================
  // Tạo vụ nổ hạt (dùng pooling)
  // ==================================================
  explodeAt(position, colorHex = 0xffffff, count = 150, spread = 3) {
    const item = this.getFromPool();
    if (!item) return; // nếu hết pool thì không spawn để tránh lag

    count = Math.min(count, item.maxCount); // không vượt quá maxCount

    const points = item.points;
    const geometry = points.geometry;
    const posAttr = geometry.attributes.position;
    const velocities = item.velocities;

    // set màu vụ nổ
    points.material.color.setHex(colorHex);
    points.material.opacity = 1;

    // reset positions và velocities
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] = position.x;
      posAttr.array[i * 3 + 1] = position.y;
      posAttr.array[i * 3 + 2] = position.z;

      velocities[i * 3] = (Math.random() - 0.5) * spread;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * spread;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }

    posAttr.needsUpdate = true;

    // bật object
    points.visible = true;

    // lưu effect vào active list
    this.active.push({
      item,
      count,
      time: 0,
      duration: 1.0,
    });
  }

  // ==================================================
  // Update (gọi trong game loop)
  // ==================================================
  update(delta) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const fx = this.active[i];
      fx.time += delta;

      const points = fx.item.points;
      const posAttr = points.geometry.attributes.position;
      const velocities = fx.item.velocities;

      // update particle positions
      for (let p = 0; p < fx.count * 3; p += 3) {
        posAttr.array[p] += velocities[p] * delta * 6;
        posAttr.array[p + 1] += velocities[p + 1] * delta * 6;
        posAttr.array[p + 2] += velocities[p + 2] * delta * 6;

        // gravity nhẹ
        velocities[p + 1] -= 1.5 * delta;
      }

      posAttr.needsUpdate = true;

      // fade dần theo thời gian
      const fade = 1 - fx.time / fx.duration;
      points.material.opacity = fade;

      // nếu hết duration -> trả về pool
      if (fx.time >= fx.duration) {
        this.returnToPool(fx.item);
        this.active.splice(i, 1);
      }
    }
  }
}