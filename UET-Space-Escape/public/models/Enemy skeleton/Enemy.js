/**
 * Lớp Skeleton Enemy cơ sở (Base Class).
 * Trong tuần 1, chưa thực sự có thực thể quái vật nào xuất hiện trên màn hình,
 * nhưng chúng ta dựng sẵn bộ khung (Skeleton) này để định nghĩa cấu trúc chuẩn.
 * Các tuần sau, các loại quái (như Drone, Boss) chỉ cần `extends Enemy` 
 * và ghi đè (override) lại các hàm này là chạy được ngay.
 */
export class Enemy {
    constructor(scene, position = { x: 0, y: 0, z: 0 }) {
        this.scene = scene;         // Three.js scene để thêm/xóa model quái
        this.position = position;   // Vị trí tọa độ
        this.hp = 100;              // Máu cơ bản
        this.isDead = false;        // Trạng thái sống/chết
        this.mesh = null;           // Model 3D của quái, để trống cho class con tự gán
    }

    /**
     * Phương thức khởi tạo và hiển thị quái lên màn hình.
     * Cần được class con ghi đè.
     */
    spawn() {
        console.log("Hàm spawn() gốc: Quái vật đang được chuẩn bị để xuất hiện...");
        // Code gán model (.glb) vào this.mesh và add vào this.scene sẽ làm ở class con
    }

    /**
     * Phương thức cập nhật logic sinh tồn, di chuyển, bắn đạn của quái vật.
     * Được gọi liên tục ở mỗi khung hình (frame) trong vòng lặp animation.
     * Cần được class con ghi đè.
     * 
     * @param {number} deltaTime - Thời gian trôi qua giữa 2 khung hình
     */
    update(deltaTime) {
        if (this.isDead) return;
        // Ví dụ: this.mesh.position.z += speed * deltaTime;
    }

    /**
     * Xử lý nhận sát thương từ người chơi
     * @param {number} dmg - Lượng sát thương bị nhận
     */
    takeDamage(dmg) {
        if (this.isDead) return;
        
        this.hp -= dmg;
        if (this.hp <= 0) {
            this.die();
        }
    }

    /**
     * Xử lý khi quái vật hết HP (Hủy model, rớt item, báo điểm...)
     */
    die() {
        this.isDead = true;
        console.log("Enemy đã bị tiêu diệt!");

        // Dọn dẹp model 3D khỏi bộ nhớ RAM và màn hình để tránh giật lag
        if (this.mesh && this.scene) {
            this.scene.remove(this.mesh);
        }
    }
}