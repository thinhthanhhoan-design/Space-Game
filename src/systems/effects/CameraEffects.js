import * as THREE from "three";

export class CameraEffects {
  constructor(camera) {
    this.camera = camera;

    // Trạng thái camera gốc để khôi phục sau khi rung
    this.originalPosition = new THREE.Vector3();
    this.originalRotation = new THREE.Euler();

    this.isShaking = false;
    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    // Tần số rung (càng cao rung càng nhanh)
    this.frequency = 25;

    // Seed ngẫu nhiên để tránh các lần rung bị lặp lại
    this.seed = Math.random() * 1000;
  }

  /**
   * Kích hoạt hiệu ứng rung camera
   * @param {number} duration - thời gian rung (giây)
   * @param {number} intensity - độ mạnh
   * @param {number} frequency - tần số
   */
  shake(duration = 0.25, intensity = 0.25, frequency = 25) {
    this.isShaking = true;
    this.shakeTime = 0;
    this.shakeDuration = duration;
    this.shakeIntensity = intensity;
    this.frequency = frequency;

    this.originalPosition.copy(this.camera.position);
    this.originalRotation.copy(this.camera.rotation);

    this.seed = Math.random() * 1000;
  }

  /**
   * Cập nhật hiệu ứng rung (gọi trong vòng lặp chính)
   */
  update(delta) {
    if (!this.isShaking) return;

    this.shakeTime += delta;

    if (this.shakeTime >= this.shakeDuration) {
      this.isShaking = false;
      this.camera.position.copy(this.originalPosition);
      this.camera.rotation.copy(this.originalRotation);
      return;
    }

    // Tính toán độ giảm rung theo thời gian (fade out)
    const progress = this.shakeTime / this.shakeDuration;
    const fade = 1 - progress * progress;
    const t = this.shakeTime * this.frequency;

    // Tính toán độ lệch vị trí mượt mà bằng hàm lượng giác
    const offsetX = Math.sin(t + this.seed) * this.shakeIntensity * fade;
    const offsetY = Math.cos(t * 1.3 + this.seed) * this.shakeIntensity * fade;
    const offsetZ = Math.sin(t * 0.7 + this.seed) * this.shakeIntensity * fade;

    this.camera.position.set(
      this.originalPosition.x + offsetX,
      this.originalPosition.y + offsetY,
      this.originalPosition.z + offsetZ
    );

    // Áp dụng rung nhẹ vào góc xoay để tăng tính chân thực
    this.camera.rotation.set(
      this.originalRotation.x + offsetY * 0.04,
      this.originalRotation.y + offsetX * 0.04,
      this.originalRotation.z
    );
  }
}
