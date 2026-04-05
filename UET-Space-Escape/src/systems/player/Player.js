import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from '../../utils/CONFIG.JS';

export class Player {
    // Khởi tạo Player truyền vào scene của Three.js
    constructor(scene) {
        this.scene = scene; // Lưu lại scene để thêm model vào không gian 3D
        this.mesh = null;   // Biến lưu trữ model 3D của người chơi

        const loader = new GLTFLoader(); // Khởi tạo công cụ load file .glb (model 3D)
        
        // Cập nhật đường dẫn tuyệt đối cho Vite từ public folder an toàn với cả thẻ Script gốc
        const modelUrl = CONFIG.ASSETS.MODELS.PLAYER_V1; // Lấy model path từ file cấu hình chung (CONFIG.JS)
        
        // Tải mô hình 3D máy bay
        loader.load(
            modelUrl, 
            (glb) => {
                this.mesh = glb.scene; // Lấy scene 3D từ file đã tải
                this.mesh.scale.set(0.01, 0.01, 0.01); // Thu nhỏ mô hình máy bay hơn nữa cho hợp tỷ lệ map
                this.mesh.position.y = 0; // Đặt vị trí xuất phát theo trục Y là 0
                this.scene.add(this.mesh); // Thêm máy bay vào scene để hiển thị lên màn hình
                console.log("Đã tải xong máy bay!"); // Báo log thành công
            },
            undefined, // Bỏ qua hàm theo dõi tiến độ tải (onProgress)
            (error) => {
                console.error('Lỗi khi tải mô hình máy bay .glb:', error); // In ra lỗi nếu tải thất bại
            }
        );

        this.speed = CONFIG.ENGINE.FORWARD_SPEED; // Đồng bộ tốc độ bay từ cấu hình CONFIG.JS
        
        // Khởi tạo đối tượng lưu trạng thái 4 nút điều khiển (lên, xuống, trái, phải)
        this.keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };

        // Lắng nghe sự kiện "nhấn phím" và "nhả phím" trên bàn phím
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    // Hàm đánh dấu phím đang được nhấn xuống (kích hoạt thành true)
    onKeyDown(event) {
        // Chỉ xử lý các phím đã định nghĩa sẵn trong this.keys (A, S, D, W)
        if (this.keys.hasOwnProperty(event.code)) this.keys[event.code] = true;
    }

    // Hàm đánh dấu phím đã được nhả ra (ngưng kích hoạt thành false)
    onKeyUp(event) {
        if (this.keys.hasOwnProperty(event.code)) this.keys[event.code] = false;
    }

    // Hàm được gọi liên tục mỗi khung hình (frame) để cập nhật trạng thái player
    update() {
        if (!this.mesh) return; // Nếu mô hình chưa tải xong thì bỏ qua, không làm gì cả

        // --- 1 & 2. DI CHUYỂN DỌC (Y) VÀ NGANG (X) ---
        let dx = 0;
        let dy = 0;
        
        if (this.keys.KeyA) dx -= this.speed;
        if (this.keys.KeyD) dx += this.speed;
        if (this.keys.KeyW) dy += this.speed;
        if (this.keys.KeyS) dy -= this.speed;

        this.mesh.position.x += dx;
        this.mesh.position.y += dy;

        // Lưu trữ phần dư khi tàu vượt biên để truyền tín hiệu cho GameManager xoay map
        this.pushOffset = { x: 0, y: 0 };

        // Xử lý chặn biên cứng và tính toán khoảng dư
        const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
        if (this.mesh.position.x > envX) {
            this.pushOffset.x = this.mesh.position.x - envX;
            this.mesh.position.x = envX;
        } else if (this.mesh.position.x < -envX) {
            this.pushOffset.x = this.mesh.position.x + envX;
            this.mesh.position.x = -envX;
        }

        const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;
        if (this.mesh.position.y > envY) {
            this.pushOffset.y = this.mesh.position.y - envY;
            this.mesh.position.y = envY;
        } else if (this.mesh.position.y < -envY) {
            this.pushOffset.y = this.mesh.position.y + envY;
            this.mesh.position.y = -envY;
        }
        let xRatio = this.mesh.position.x / envX;
        
        // Chốt tỷ lệ không vượt quá một ngưỡng an toàn (ví dụ 1.8) để tàu không lật úp
        xRatio = THREE.MathUtils.clamp(xRatio, -1.8, 1.8); 

        // I. Nghiêng Model Tàu (Ship Roll) dựa trên công thức hàm phi
        // Kéo phi về cùng hệ trục bằng dấu (-)
        const targetShipRoll = -xRatio * CONFIG.ENGINE.ROTATION_LIMITS.ROLL;
        
        // Chút 'Gia vị' cho nhạy phím: Cộng hưởng thêm góc nghiêng lập tức mỗi khi nhấn phím
        let inputRoll = 0;
        if (this.keys.KeyA) inputRoll = CONFIG.ENGINE.ROTATION_LIMITS.ROLL * 0.4;
        if (this.keys.KeyD) inputRoll = -CONFIG.ENGINE.ROTATION_LIMITS.ROLL * 0.4;

        this.mesh.rotation.z = THREE.MathUtils.lerp(
            this.mesh.rotation.z, 
            targetShipRoll + inputRoll, 
            CONFIG.ENGINE.ROTATION_LIMITS.LERP
        );

        // II. Nghiêng Đầu Tàu (Ship Pitch) dựa trên di chuyển lên/xuống
        let targetShipPitch = 0;
        const pitchLimit = CONFIG.ENGINE.ROTATION_LIMITS.PITCH;
        
        if (this.keys.KeyW) targetShipPitch = pitchLimit;  // Ngóc đầu lên
        if (this.keys.KeyS) targetShipPitch = -pitchLimit; // Cắm đầu xuống
        
        // Kết hợp thêm tỷ lệ vị trí để tàu có góc nghiêng tự nhiên khi ở biên trên/dưới
        const yRatio = this.mesh.position.y / envY;
        const positionPitch = yRatio * (pitchLimit * 0.3);

        this.mesh.rotation.x = THREE.MathUtils.lerp(
            this.mesh.rotation.x,
            targetShipPitch + positionPitch,
            CONFIG.ENGINE.ROTATION_LIMITS.LERP
        );
    }
}
