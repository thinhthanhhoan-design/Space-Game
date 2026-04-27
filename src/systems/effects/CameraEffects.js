// src/systems/effects/CameraEffects.js
import * as THREE from "three";

export class CameraEffects {
  constructor(camera) {
    this.camera = camera;

    // Lưu trạng thái camera gốc để sau rung trả về đúng vị trí
    this.originalPosition = new THREE.Vector3();
    this.originalRotation = new THREE.Euler();

    // Trạng thái rung
    this.isShaking = false;
    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    // Tần số rung (cao = rung nhanh)
    this.frequency = 25;

    // Seed để mỗi lần rung khác nhau (tránh rung lặp y hệt)
    this.seed = Math.random() * 1000;
  }

  /**
   * Hàm gọi rung camera (gọi khi tàu trúng đạn)
   * @param {number} duration - thời gian rung (giây)
   * @param {number} intensity - độ mạnh rung
   * @param {number} frequency - tốc độ rung (tần số)
   */
  shake(duration = 0.25, intensity = 0.25, frequency = 25) {
    this.isShaking = true;
    this.shakeTime = 0;
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
    this.frequency = frequency;

    // Lưu camera gốc
    this.originalPosition.copy(this.camera.position);
    this.originalRotation.copy(this.camera.rotation);

    // Random seed mới mỗi lần rung
    this.seed = Math.random() * 1000;
  }

  /**
   * Update rung camera (gọi trong animate loop)
   * @param {number} delta - thời gian giữa 2 frame
   */
  update(delta) {
    if (!this.isShaking) return;

    this.shakeTime += delta;

    // Hết rung thì trả camera về trạng thái ban đầu
    if (this.shakeTime >= this.shakeDuration) {
      this.isShaking = false;
      this.camera.position.copy(this.originalPosition);
      this.camera.rotation.copy(this.originalRotation);
      return;
    }

    // Tính tiến trình rung để giảm dần theo thời gian (fade out)
    const progress = this.shakeTime / this.shakeDuration;

    // easing fade giúp rung mượt hơn
    const fade = 1 - progress * progress;

    // Thời gian rung nhân tần số
    const t = this.shakeTime * this.frequency;

    // Rung mượt bằng sin/cos (không giật random)
    const offsetX = Math.sin(t + this.seed) * this.shakeIntensity * fade;
    const offsetY = Math.cos(t * 1.3 + this.seed) * this.shakeIntensity * fade;
    const offsetZ = Math.sin(t * 0.7 + this.seed) * this.shakeIntensity * fade;

    // Áp dụng rung vào vị trí camera
    this.camera.position.set(
      this.originalPosition.x + offsetX,
      this.originalPosition.y + offsetY,
      this.originalPosition.z + offsetZ
    );

    // Áp dụng rung nhẹ vào rotation để tạo cảm giác thật hơn
    this.camera.rotation.set(
      this.originalRotation.x + offsetY * 0.04,
      this.originalRotation.y + offsetX * 0.04,
      this.originalRotation.z
    );
  }
}
