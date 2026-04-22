// src/systems/effects/Explosion.js
import * as THREE from "three";

export class ExplosionSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // ==============================
    // Danh sách hiệu ứng
    // ==============================
    this.particles = [];         // sparks, smoke, fire dust, engine trail
    this.flashEffects = [];      // hit flash
    this.engineHeatEffects = []; // heat distortion engine

    // ==============================
    // Hit flash
    // ==============================
    this.flashGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    this.flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
    });

    // ==============================
    // WARNING overlay (plane đỏ trước camera)
    // ==============================
    this.warningMesh = null;
    this.warningTime = 0;
    this.warningDuration = 0;
    this.warningActive = false;
    this.createWarningOverlay();

    // ==============================
    // ENGINE TRAIL (tia lửa sau động cơ)
    // ==============================
    this.engineTrails = []; // lưu danh sách động cơ (có thể 1 hoặc nhiều)

    this.engineTrailMaterial = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.14,
      transparent: true,
      opacity: 1,
    });
  }

  // ====================================================
  // WARNING overlay
  // ====================================================
  createWarningOverlay() {
    const geo = new THREE.PlaneGeometry(10, 10);

    const mat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0,
      depthTest: false,
    });

    this.warningMesh = new THREE.Mesh(geo, mat);
    this.warningMesh.position.set(0, 0, -2);

    this.camera.add(this.warningMesh);
  }

  startWarning(duration = 2.5) {
    this.warningActive = true;
    this.warningTime = 0;
    this.warningDuration = duration;
  }

  // ====================================================
  // HIT FLASH
  // ====================================================
  spawnHitFlash(position, scale = 1) {
    const flash = new THREE.Mesh(this.flashGeometry, this.flashMaterial.clone());

    flash.position.copy(position);
    flash.scale.setScalar(scale);
    flash.material.opacity = 1;

    this.scene.add(flash);

    this.flashEffects.push({
      mesh: flash,
      time: 0,
      duration: 0.15,
    });
  }

  // ====================================================
  // SPARKS (tia lửa)
  // ====================================================
  spawnSparks(position, count = 30, spread = 1.5) {
    const geo = new THREE.BufferGeometry();

    const positions = [];
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions.push(position.x, position.y, position.z);

      velocities.push(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
      );
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.15,
      transparent: true,
      opacity: 1,
    });

    const sparks = new THREE.Points(geo, mat);
    this.scene.add(sparks);

    this.particles.push({
      type: "sparks",
      obj: sparks,
      velocities,
      time: 0,
      duration: 0.7,
    });
  }

  // ====================================================
  // FIRE DUST (bụi lửa)
  // ====================================================
  spawnFireDust(position, count = 20) {
    const geo = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions.push(
        position.x + (Math.random() - 0.5) * 0.5,
        position.y + (Math.random() - 0.5) * 0.5,
        position.z + (Math.random() - 0.5) * 0.5
      );

      velocities.push(
        (Math.random() - 0.5) * 0.4,
        Math.random() * 0.6,
        (Math.random() - 0.5) * 0.4
      );
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xff4400,
      size: 0.18,
      transparent: true,
      opacity: 1,
    });

    const dust = new THREE.Points(geo, mat);
    this.scene.add(dust);

    this.particles.push({
      type: "fireDust",
      obj: dust,
      velocities,
      time: 0,
      duration: 1.0,
    });
  }

  // ====================================================
  // SMOKE (khói)
  // ====================================================
  spawnSmoke(position, count = 18) {
    const geo = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions.push(
        position.x + (Math.random() - 0.5) * 0.5,
        position.y + (Math.random() - 0.5) * 0.5,
        position.z + (Math.random() - 0.5) * 0.5
      );

      velocities.push(
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.25,
        (Math.random() - 0.5) * 0.1
      );
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x444444,
      size: 0.45,
      transparent: true,
      opacity: 0.7,
    });

    const smoke = new THREE.Points(geo, mat);
    this.scene.add(smoke);

    this.particles.push({
      type: "smoke",
      obj: smoke,
      velocities,
      time: 0,
      duration: 2.8,
    });
  }

  // ====================================================
  // ASTEROID LEVEL_1 EFFECT
  // ====================================================
  spawnAsteroidImpact(position) {
    this.spawnHitFlash(position, 1.4);
    this.spawnSparks(position, 45, 2.8);
    this.spawnFireDust(position, 30);
    this.spawnSmoke(position, 20);
  }

  // ====================================================
  // SHIP HIT EFFECT
  // ====================================================
  spawnShipImpact(position) {
    this.spawnHitFlash(position, 0.8);
    this.spawnSparks(position, 20, 1.6);
    this.spawnSmoke(position, 25);
  }

  // ====================================================
  // HEAT DISTORTION
  // ====================================================
  attachEngineHeat(shipMesh, offset = new THREE.Vector3(0, 0, 1.8)) {
    const geo = new THREE.PlaneGeometry(1.2, 1.2);

    const mat = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });

    const heat = new THREE.Mesh(geo, mat);
    heat.rotation.x = Math.PI / 2;
    heat.position.copy(offset);

    shipMesh.add(heat);

    this.engineHeatEffects.push({
      mesh: heat,
      time: 0,
      baseOpacity: 0.15,
    });
  }

  // ====================================================
  // ENGINE TRAIL (tia lửa sau động cơ)
  // ====================================================
  addEngineTrail(shipMesh, offset = new THREE.Vector3(0, 0, 2)) {
    this.engineTrails.push({
      shipMesh,
      offset,
      spawnTimer: 0,
    });
  }

  spawnEngineTrailParticles(shipMesh, offset) {
    const engineWorldPos = new THREE.Vector3();
    engineWorldPos.copy(offset);

    // chuyển offset từ local ship -> world
    shipMesh.localToWorld(engineWorldPos);

    const geo = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    const count = 12;

    for (let i = 0; i < count; i++) {
      positions.push(
        engineWorldPos.x + (Math.random() - 0.5) * 0.1,
        engineWorldPos.y + (Math.random() - 0.5) * 0.1,
        engineWorldPos.z + (Math.random() - 0.5) * 0.1
      );

      // bay ra phía sau động cơ (tăng/giảm Z tuỳ hướng tàu)
      velocities.push(
        (Math.random() - 0.5) * 0.08,
        (Math.random() - 0.5) * 0.08,
        Math.random() * 1.5 + 1.0
      );
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const sparks = new THREE.Points(geo, this.engineTrailMaterial.clone());
    this.scene.add(sparks);

    this.particles.push({
      type: "engineTrail",
      obj: sparks,
      velocities,
      time: 0,
      duration: 0.45,
    });
  }

  // ====================================================
  // UPDATE ALL EFFECTS
  // ====================================================
  update(delta) {
    // ===========================
    // Update WARNING
    // ===========================
    if (this.warningActive) {
      this.warningTime += delta;

      const blink = Math.sin(this.warningTime * 20) > 0 ? 0.35 : 0.05;
      this.warningMesh.material.opacity = blink;

      if (this.warningTime >= this.warningDuration) {
        this.warningActive = false;
        this.warningMesh.material.opacity = 0;
      }
    }

    // ===========================
    // Update FLASH
    // ===========================
    for (let i = this.flashEffects.length - 1; i >= 0; i--) {
      const fx = this.flashEffects[i];
      fx.time += delta;

      const progress = fx.time / fx.duration;

      fx.mesh.material.opacity = 1 - progress;
      fx.mesh.scale.multiplyScalar(1 + delta * 6);

      if (fx.time >= fx.duration) {
        this.scene.remove(fx.mesh);
        fx.mesh.geometry.dispose();
        fx.mesh.material.dispose();
        this.flashEffects.splice(i, 1);
      }
    }

    // ===========================
    // Update ENGINE TRAIL spawn
    // ===========================
    for (let i = 0; i < this.engineTrails.length; i++) {
      const trail = this.engineTrails[i];

      trail.spawnTimer += delta;

      // spawn liên tục
      if (trail.spawnTimer >= 0.03) {
        this.spawnEngineTrailParticles(trail.shipMesh, trail.offset);
        trail.spawnTimer = 0;
      }
    }

    // ===========================
    // Update PARTICLES
    // ===========================
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const fx = this.particles[i];
      fx.time += delta;

      const positions = fx.obj.geometry.attributes.position.array;

      for (let p = 0; p < positions.length; p += 3) {
        positions[p] += fx.velocities[p] * delta;
        positions[p + 1] += fx.velocities[p + 1] * delta;
        positions[p + 2] += fx.velocities[p + 2] * delta;

        // sparks có trọng lực nhẹ
        if (fx.type === "sparks") {
          fx.velocities[p + 1] -= 1.8 * delta;
        }

        // engine trail giảm tốc dần
        if (fx.type === "engineTrail") {
          fx.velocities[p + 2] *= 0.97;
        }
      }

      fx.obj.geometry.attributes.position.needsUpdate = true;

      const fade = 1 - fx.time / fx.duration;
      fx.obj.material.opacity = fade;

      if (fx.time >= fx.duration) {
        this.scene.remove(fx.obj);
        fx.obj.geometry.dispose();
        fx.obj.material.dispose();
        this.particles.splice(i, 1);
      }
    }

    // ===========================
    // Update ENGINE HEAT
    // ===========================
    for (let i = 0; i < this.engineHeatEffects.length; i++) {
      const heatFx = this.engineHeatEffects[i];
      heatFx.time += delta;

      const wave = Math.sin(heatFx.time * 20) * 0.05;

      heatFx.mesh.scale.set(1 + wave, 1 + wave, 1);

      heatFx.mesh.material.opacity =
        heatFx.baseOpacity + Math.sin(heatFx.time * 15) * 0.03;
    }
  }
}
