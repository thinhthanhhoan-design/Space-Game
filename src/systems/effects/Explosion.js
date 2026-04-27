import * as THREE from "three";
import gsap from "gsap";

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
    // WARNING overlay (viền đỏ quanh màn hình bằng DOM)
    // ==============================
    this.warningDOM = null;
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
    this.warningDOM = document.getElementById("flash-red");
    if (!this.warningDOM) {
        this.warningDOM = document.createElement("div");
        this.warningDOM.id = "flash-red-combat";
        Object.assign(this.warningDOM.style, {
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "100%",
            background: "radial-gradient(circle, transparent 60%, rgba(255, 0, 0, 0.4) 100%)",
            boxShadow: "inset 0 0 150px rgba(255, 0, 0, 0.6)",
            opacity: 0,
            pointerEvents: "none",
            zIndex: 20
        });
        document.body.appendChild(this.warningDOM);
    }
  }

  startWarning(duration = 2.5) {
    this.warningActive = true;
    this.warningTime = 0;
    this.warningDuration = duration;
    if (!this.warningDOM) {
      this.warningDOM = document.getElementById("flash-red") || document.getElementById("flash-red-combat");
    }
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
    this.spawnHitFlash(position, 2.5); // Tăng kích thước flash
    this.spawnSparks(position, 60, 4.5); // Tăng số lượng và độ lan tỏa tia lửa
    this.spawnFireDust(position, 40);
    this.spawnSmoke(position, 30);
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
  // SHOCKWAVE (Vòng tròn sóng xung kích)
  // ====================================================
  spawnShockwave(position, color = 0x00ffff, scale = 10) {
    const geo = new THREE.RingGeometry(0.1, 0.2, 64);
    const mat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.position.copy(position);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);

    gsap.to(ring.scale, {
        x: scale,
        y: scale,
        duration: 0.8,
        ease: "power2.out"
    });
    gsap.to(mat, {
        opacity: 0,
        duration: 0.8,
        ease: "power2.in",
        onComplete: () => {
            this.scene.remove(ring);
            geo.dispose();
            mat.dispose();
        }
    });
  }

  // ====================================================
  // DEBRIS (Mảnh vỡ bay ra)
  // ====================================================
  spawnDebris(position, count = 15) {
    for (let i = 0; i < count; i++) {
        const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const mat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const debris = new THREE.Mesh(geo, mat);
        
        debris.position.copy(position);
        this.scene.add(debris);

        const target = new THREE.Vector3(
            position.x + (Math.random() - 0.5) * 20,
            position.y + (Math.random() - 0.5) * 20,
            position.z + (Math.random() - 0.5) * 20
        );

        gsap.to(debris.position, {
            x: target.x,
            y: target.y,
            z: target.z,
            duration: 1.5,
            ease: "power1.out"
        });
        gsap.to(debris.rotation, {
            x: Math.random() * 10,
            y: Math.random() * 10,
            duration: 1.5
        });
        gsap.to(mat, {
            opacity: 0,
            duration: 1.5,
            delay: 0.5,
            onComplete: () => {
                this.scene.remove(debris);
                geo.dispose();
                mat.dispose();
            }
        });
    }
  }

  // ====================================================
// ====================================================
// BOSS EXPLOSION EFFECT 
// - Radius rộng hơn
// - Điểm sáng nhiều gấp bội
// - Fade lâu hơn
// ====================================================
spawnBossExplosion(position) {
  // 1) Shockwave cực lớn (2 lớp)
  this.spawnShockwave(position, 0x00ffff, 60);
  this.spawnShockwave(position, 0xffffff, 35);

  // 2) Flash mạnh
  this.spawnHitFlash(position, 20.0);

  // 3) Nổ trung tâm cực mạnh (điểm sáng cực nhiều)
  // (tăng số lượng sparks + power)
  this.spawnSparks(position, 600, 14.0);
  this.spawnFireDust(position, 250);

  // 4) Daisy Chain - nhiều vụ nổ hơn + radius rộng hơn
  for (let i = 0; i < 14; i++) {
    setTimeout(() => {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 30,  // rộng hơn nhiều
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      );

      const p = position.clone().add(offset);

      this.spawnAsteroidImpact(p);

      // Sparks nhiều hơn + mạnh hơn
      this.spawnSparks(p, 180, 8.0);

      // FireDust nhiều hơn để tạo cảm giác cháy nổ kéo dài
      this.spawnFireDust(p, 120);

    }, i * 120); // nhanh hơn -> cảm giác dồn dập
  }

  // 5) Debris cực nhiều (mảnh vỡ)
  this.spawnDebris(position, 60);

  // 6) Final Explosion cực đại sau 1.6 giây (fade lâu hơn)
  setTimeout(() => {
    this.spawnHitFlash(position, 30.0);

    // shockwave cuối siêu lớn
    this.spawnShockwave(position, 0xffaa00, 100);

    // điểm sáng gấp bội
    this.spawnSparks(position, 1200, 20.0);

    // bụi lửa dày
    this.spawnFireDust(position, 500);

    // thêm debris lần nữa
    this.spawnDebris(position, 40);

    // camera shake mạnh
    if (this.camera) {
      gsap.to(this.camera.position, {
        x: "+=2.5",
        y: "+=2.0",
        duration: 0.08,
        repeat: 18,
        yoyo: true,
        ease: "power1.inOut"
      });
    }

  }, 1600);

  // 7) Bonus: dư chấn (aftershock) để kéo dài cảm giác nổ
  setTimeout(() => {
    this.spawnShockwave(position, 0xffffff, 50);
    this.spawnSparks(position, 300, 6.0);
  }, 2400);
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

      const blink = Math.sin(this.warningTime * 15) * 0.3 + 0.3; // Nhấp nháy rõ hơn
      if (this.warningDOM) {
          this.warningDOM.style.opacity = blink;
      }
 
      if (this.warningTime >= this.warningDuration) {
        this.warningActive = false;
        if (this.warningDOM) {
            gsap.to(this.warningDOM, { opacity: 0, duration: 0.5 });
        }
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
