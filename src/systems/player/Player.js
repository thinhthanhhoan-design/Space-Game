import * as THREE from 'three'; // Nhập thư viện Three.js để xử lý đồ họa và toán học 3D
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Nhập bộ tải mô hình 3D định dạng GLB/GLTF
import { CONFIG } from '../../utils/CONFIG.JS'; // Nhập file cấu hình chung để sử dụng các hằng số hệ thống

export class Player { // Định nghĩa lớp Player quản lý phi thuyền người chơi
    // Constructor khởi tạo thực thể Player, nhận vào scene để thêm mô hình vào không gian 3D
    constructor(scene) {
        this.scene = scene; // Lưu tham chiếu scene 3D
        this.mesh = null;   // Khởi tạo biến chứa mô hình 3D (ban đầu là null cho đến khi tải xong)

        const loader = new GLTFLoader(); // Khởi tạo đối tượng tải mô hình GLTF

        // Lấy đường dẫn mô hình tàu từ tập tin CONFIG.JS
        const modelUrl = CONFIG.ASSETS.MODELS.PLAYER_V1;

        // Thực hiện tải mô hình 3D máy bay từ đường dẫn chỉ định
        loader.load(
            modelUrl,
            (glb) => { // Hàm callback được gọi khi tải thành công
                this.mesh = glb.scene; // Lưu trữ đối tượng 3D (scene) từ file đã tải vào thuộc tính mesh
                this.mesh.scale.set(0.01, 0.01, 0.01); // Giảm kích thước mô hình xuống 100 lần để phù hợp với tỉ lệ thế giới game
                this.mesh.position.y = 0; // Thiết lập độ cao ban đầu của tàu là 0
                this.mesh.visible = false; // ẨN TÀU NGAY TỪ ĐẦU, chỉ hiện sau khi Intro Cinematic tụ điểm hoàn tất.
                this.scene.add(this.mesh); // Thêm mô hình tàu vào trong không gian 3D để hiển thị
                console.log("Đã tải xong máy bay!"); // Thông báo ra console khi hoàn tất tải tài nguyên
            },
            undefined, // Tham số onProgress (theo dõi tiến trình) không sử dụng
            (error) => { // Hàm callback xử lý nếu có lỗi xảy ra trong quá trình tải
                console.error('Lỗi khi tải mô hình máy bay .glb:', error); // In thông báo lỗi chi tiết ra console
            }
        );

        this.speed = CONFIG.ENGINE.FORWARD_SPEED; // Thiết lập tốc độ di chuyển của tàu từ cấu hình hệ thống
        this.hp = CONFIG.PLAYER.INITIAL_HP;
        // Đối tượng lưu trữ trạng thái các phím điều khiển (true là đang nhấn, false là đã nhả)
        this.keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false };

        // Đăng ký sự kiện lắng nghe bàn phím từ cửa sổ trình duyệt (window)
        window.addEventListener('keydown', (e) => this.onKeyDown(e)); // Khi nhấn phím
        window.addEventListener('keyup', (e) => this.onKeyUp(e)); // Khi nhả phím
    }

    takeDamage(amount) {
        this.hp -= amount;
        console.log(`Người chơi còn ${this.hp} HP`);
        if (this.hp <= 0) {
            console.warn("GAME OVER: Bạn đã bị hạ gục!");
        }
    }

    // Phương thức xử lý khi người dùng nhấn phím xuống
    onKeyDown(event) {
        // Kiểm tra nếu phím nhấn nằm trong danh sách các phím điều khiển đã định nghĩa
        if (this.keys.hasOwnProperty(event.code)) this.keys[event.code] = true; // Chuyển trạng thái phím sang true
    }

    // Phương thức xử lý khi người dùng nhả phím ra
    onKeyUp(event) {
        // Kiểm tra nếu phím nhả nằm trong danh sách các phím điều khiển đã định nghĩa
        if (this.keys.hasOwnProperty(event.code)) this.keys[event.code] = false; // Chuyển trạng thái phím sang false
    }

    // Phương thức cập nhật logic của tàu, được gọi liên tục bởi vòng lặp game chính (GameLoop)
    update() {
        if (!this.mesh) return; // Nếu mô hình 3D chưa tải xong thì thoát hàm để tránh lỗi

        // Biến lưu trữ lượng thay đổi vị trí trong khung hình hiện tại
        let dx = 0; // Thay đổi theo trục X (ngang)
        let dy = 0; // Thay đổi theo trục Y (dọc)

        // Kiểm tra trạng thái các phím để tính toán hướng di chuyển
        if (this.keys.KeyA) dx -= this.speed; // Sang trái (giảm X)
        if (this.keys.KeyD) dx += this.speed; // Sang phải (tăng X)
        if (this.keys.KeyW) dy += this.speed; // Bay lên (tăng Y)
        if (this.keys.KeyS) dy -= this.speed; // Bay xuống (giảm Y)

        // Cập nhật vị trí mới cho mô hình tàu dựa trên vận tốc tính toán được
        this.mesh.position.x += dx;
        this.mesh.position.y += dy;

        // Đối tượng lưu trữ phần đẩy camera (dùng cho hiệu ứng game mượt mà hơn)
        this.pushOffset = { x: 0, y: 0 };

        // --- XỬ LÝ CHẶN BIÊN CỨNG (Flight Envelope) ---
        // Sử dụng giá trị từ CONFIG để xác định giới hạn không gian bay
        const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
        const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;

        // Giới hạn biên ngang (X)
        if (this.mesh.position.x > envX) { // Vượt biên phải
            this.pushOffset.x = this.mesh.position.x - envX; // Tính toán phần dư
            this.mesh.position.x = envX; // Giữ tàu tại biên
        } else if (this.mesh.position.x < -envX) { // Vượt biên trái
            this.pushOffset.x = this.mesh.position.x + envX;
            this.mesh.position.x = -envX;
        }

        // Giới hạn biên dọc (Y)
        if (this.mesh.position.y > envY) { // Vượt biên trên
            this.pushOffset.y = this.mesh.position.y - envY;
            this.mesh.position.y = envY;
        } else if (this.mesh.position.y < -envY) { // Vượt biên dưới
            this.pushOffset.y = this.mesh.position.y + envY;
            this.mesh.position.y = -envY;
        }

        // --- TÍNH TOÁN HIỆU ỨNG XOAY NGHIÊNG (ROTATION) ---
        // Tính tỉ lệ vị trí hiện tại so với biên để tạo góc nghiêng tự nhiên
        let xRatio = this.mesh.position.x / envX;

        // Giới hạn tỉ lệ để tránh tàu bị nghiêng quá mức dẫn đến lộn nhào vô lý
        xRatio = THREE.MathUtils.clamp(xRatio, -1.8, 1.8);

        // I. Hiệu ứng Roll (Nghiêng cánh khi sang ngang)
        const targetShipRoll = -xRatio * CONFIG.ENGINE.ROTATION_LIMITS.ROLL; // Tính góc nghiêng dựa trên vị trí

        // Thêm độ nhạy tức thời khi người dùng nhấn phím rẽ
        let inputRoll = 0;
        if (this.keys.KeyA) inputRoll = CONFIG.ENGINE.ROTATION_LIMITS.ROLL * 0.4; // Nghiêng thêm khi nhấn A
        if (this.keys.KeyD) inputRoll = -CONFIG.ENGINE.ROTATION_LIMITS.ROLL * 0.4; // Nghiêng thêm khi nhấn D

        // Áp dụng phép nội suy Lerp để góc xoay thay đổi mượt mà theo thời gian
        this.mesh.rotation.z = THREE.MathUtils.lerp(
            this.mesh.rotation.z,
            targetShipRoll + inputRoll,
            CONFIG.ENGINE.ROTATION_LIMITS.LERP
        );

        // II. Hiệu ứng Pitch (Ngóc đầu/Chúi đầu khi lên xuống)
        let targetShipPitch = 0; // Biến lưu góc mục tiêu
        const pitchLimit = CONFIG.ENGINE.ROTATION_LIMITS.PITCH; // Lấy giới hạn tối đa từ cấu hình

        // Xác định hướng ngóc đầu dựa trên phím bấm W/S
        if (this.keys.KeyW) targetShipPitch = pitchLimit;  // Ngóc mũi lên trên
        if (this.keys.KeyS) targetShipPitch = -pitchLimit; // Chúi mũi xuống dưới

        // Thêm độ nghiêng phụ thuộc vào vị trí Y để tạo cảm giác máy bay luôn hướng về tâm màn hình
        const yRatio = this.mesh.position.y / envY;
        const positionPitch = yRatio * (pitchLimit * 0.3);

        // Tăng cường tốc độ phản xạ cho trục Pitch (nhân 1.8 lần tốc độ lerp tiêu chuẩn)
        const pitchLerpSpeed = CONFIG.ENGINE.ROTATION_LIMITS.LERP * 1.8;

        // Áp dụng góc xoay vào trục X của tàu thông qua Lerp
        this.mesh.rotation.x = THREE.MathUtils.lerp(
            this.mesh.rotation.x,
            targetShipPitch + positionPitch,
            pitchLerpSpeed
        );
    }
}
