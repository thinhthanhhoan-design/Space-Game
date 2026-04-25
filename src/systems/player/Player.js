import * as THREE from 'three'; // Nhập thư viện Three.js để xử lý đồ họa và toán học 3D
import gsap from 'gsap'; // Nhập thư viện GSAP cho hiệu ứng chuyển động
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Nhập bộ tải mô hình 3D định dạng GLB/GLTF
import { CONFIG } from '../../utils/CONFIG.JS'; // Nhập file cấu hình chung để sử dụng các hằng số hệ thống
import { Weapon } from './Weapon.js'; // Nhập hệ thống vũ khí (Quản lý bắn súng)
import { ItemSystem } from './ItemSystem.js'; // Tích hợp module quản lý túi đồ Item
import { Crosshair } from '../ui/Crosshair.js'; // Module giao diện ngắm bắn mục tiêu
import { MathUtils } from '../../utils/Math.js'; // Tiện ích toán học cho tọa độ cầu

export class Player { // Định nghĩa lớp Player quản lý phi thuyền người chơi
    // Constructor khởi tạo thực thể Player, nhận vào scene để thêm mô hình vào không gian 3D
    constructor(scene) {
        this.scene = scene; // Lưu tham chiếu scene 3D
        this.mesh = null;   // Khởi tạo biến chứa mô hình 3D (ban đầu là null cho đến khi tải xong)

        // --- QUẢN LÝ TÀI NGUYÊN (MÁU, ĐẠN, TRANG BỊ) ---
        this.hp = CONFIG.PLAYER.INITIAL_HP;
        this.ammo = CONFIG.PLAYER.WEAPONS.GUN_1.ammo; // Thiết lập số lượng đạn từ CONFIG (100 viên)
        this.maxAmmo = CONFIG.PLAYER.WEAPONS.GUN_1.ammo;

        // Ủy quyền quản lý túi đồ và hiệu ứng nhặt đồ cho ItemSystem
        //this.itemSystem = new ItemSystem(this);
        this.itemSystem = new ItemSystem(this, this.scene);
        // Khởi tạo vũ khí cho người chơi
        this.weapon = new Weapon(this.scene, this);

        // Khởi tạo tâm ngắm
        this.crosshair = new Crosshair(this.scene);

        const loader = new GLTFLoader(); // Khởi tạo đối tượng tải mô hình GLTF

        // Lấy đường dẫn mô hình tàu từ tập tin CONFIG.JS
        const modelUrl = CONFIG.ASSETS.MODELS.PLAYER_V1;
        this.modelKey = "PLAYER_V1"; // Key của mô hình lấy từ CONFIG

        // Thực hiện tải mô hình 3D máy bay từ đường dẫn chỉ định
        loader.load(
            modelUrl,
            (glb) => { // Hàm callback được gọi khi tải thành công
                // Đóng gói mô hình vào một Group riêng để tránh các hiệu ứng điện ảnh can thiệp xoay nhầm hướng
                this.mesh = new THREE.Group();
                const innerMesh = glb.scene;
                innerMesh.scale.set(1.0, 1.0, 1.0); // Tăng kích thước (scale) lên mức 1.0 vì mô hình Tau.glb rất bé
                innerMesh.rotation.y = Math.PI; // Xoay 180 độ để tàu chĩa đúng hướng về phía trước

                this.mesh.add(innerMesh); // Đưa phi thuyền vào trong Group
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
        this.slowMultiplier = 1.0; // Hệ số làm chậm (1.0 là bình thường)
        this.slowTimer = 0; // Bộ đếm thời gian hiệu ứng làm chậm
        this.jamTimer = 0; // Bộ đếm thời gian bị kẹt súng (không bắn được)
        this.bulletCount = 1; // Số lượng đạn bắn ra (Mặc định là 1)
        this.shieldTimer = 0; // Thời gian còn lại của khiên (ms)

        // Đối tượng lưu trữ trạng thái các phím điều khiển (true là đang nhấn, false là đã nhả)
        this.keys = { KeyW: false, KeyS: false, KeyA: false, KeyD: false, Space: false };
        this.velocity = { x: 0, y: 0 }; // Khởi tạo vận tốc

        // Đăng ký sự kiện lắng nghe bàn phím từ cửa sổ trình duyệt (window)
        window.addEventListener('keydown', (e) => this.onKeyDown(e)); // Khi nhấn phím
        window.addEventListener('keyup', (e) => this.onKeyUp(e)); // Khi nhả phím
        
        // Reset phím khi mất focus để tránh kẹt phím
        window.addEventListener('blur', () => {
            Object.keys(this.keys).forEach(key => this.keys[key] = false);
            this.velocity.x = 0;
            this.velocity.y = 0;
        });
    }

    takeDamage(amount) {
        // Kiểm tra giáp bảo vệ
        if (this.hasShield) {
            console.log("🛡️ Shield đã chặn sát thương!");
            return;
        }

        this.hp -= amount;
        console.log(`Bị tấn công! Người chơi còn ${this.hp} HP`);

        // Mất mọi nâng cấp súng khi bị trúng đạn (về lại 1 tia)
        if (this.bulletCount > 1) {
            this.bulletCount = 1;
            console.log("🔥 Bị thương! Vũ khí trở về trạng thái cơ bản (1 tia).");
        }

        if (this.hp <= 0) {
            console.warn("GAME OVER: Tàu vũ trụ đã bị phá hủy!");
        }
    }

    // Khởi tạo hiệu ứng vòng tròn bảo vệ (Sử dụng MathUtils để tạo lưới bảo vệ đặc biệt)
    initShield() {
        if (!this.mesh || this.shieldMesh) return;

        const shieldGroup = new THREE.Group();
        
        // --- Tự động tính toán bán kính dựa trên các đỉnh (Vertices) của tàu ---
        const radius = MathUtils.calculateShieldRadius(this.mesh);
        console.log(`🛡️ Shield radius calculated from model: ${radius}`);

        const segments = 18; 
        
        // --- 1. Tạo lớp giáp tinh thể (Crystal Grid) bằng MathUtils ---
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const phi = (i / segments) * Math.PI;
            for (let j = 0; j <= segments; j++) {
                const theta = (j / segments) * Math.PI * 2;
                
                // Sử dụng hàm nội suy tọa độ cầu từ Math.js
                const pos = MathUtils.getSphericalCoordinate(radius, phi, theta);
                points.push(new THREE.Vector3(pos.x, pos.y, pos.z * 1.3)); // 1.3 là hệ số kéo dài thân tàu
            }
        }

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 8, // Giảm kích thước hạt (cũ: 15)
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            map: new THREE.TextureLoader().load(CONFIG.ASSETS.TEXTURES.PARTICLE),
            depthWrite: false
        });

        this.shieldPoints = new THREE.Points(geo, mat);
        shieldGroup.add(this.shieldPoints);

        // --- 2. Thêm lớp màng năng lượng (Energy Membrane) ---
        const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
        const sphereMat = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        const membrane = new THREE.Mesh(sphereGeo, sphereMat);
        membrane.scale.set(1, 1, 1.3);
        shieldGroup.add(membrane);

        this.shieldMesh = shieldGroup;
        this.shieldMembraneMat = sphereMat;
        this.mesh.add(this.shieldMesh);
    }

    // Bật/Tắt giáp bảo vệ (Visual and logic state)
    setShield(active) {
        if (active === this.hasShield) return; // Tránh gọi lặp lại nếu trạng thái không đổi
        this.hasShield = active;
        if (!this.shieldMesh) this.initShield();

        if (active) {
            this.shieldMesh.visible = true;
            // Hiệu ứng hiện ra bằng cách nội suy Opacity
            gsap.to(this.shieldPoints.material, { opacity: 0.8, duration: 0.6 });
            gsap.to(this.shieldMembraneMat, { opacity: 0.1, duration: 0.6 }); // Giảm độ đậm của màng
            
            // Hiệu ứng xoay và đập nhịp nhàng (Pulse)
            this.shieldPulse = gsap.to(this.shieldMesh.scale, {
                x: 1.1, y: 1.1, z: 1.1,
                duration: 1.0,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
            
            // Xoay lưới điểm để tạo hiệu ứng năng lượng đang chạy
            this.shieldRotate = gsap.to(this.shieldPoints.rotation, {
                y: Math.PI * 2,
                duration: 5,
                repeat: -1,
                ease: "none"
            });
        } else {
            // Mờ dần rồi ẩn
            gsap.to(this.shieldPoints.material, { opacity: 0, duration: 0.5 });
            gsap.to(this.shieldMembraneMat, { 
                opacity: 0, 
                duration: 0.5, 
                onComplete: () => {
                    if (this.shieldMesh) this.shieldMesh.visible = false;
                }
            });
            if (this.shieldPulse) this.shieldPulse.kill();
            if (this.shieldRotate) this.shieldRotate.kill();
        }
    }

    addShieldTime(duration) {
        if (this.shieldTimer <= 0) {
            this.setShield(true);
        }
        this.shieldTimer += duration;
        console.log(`🛡️ Cộng thêm ${duration / 1000}s Khiên! Tổng cộng: ${Math.round(this.shieldTimer / 1000)}s`);
    }

    // Phương thức xử lý khi người dùng nhấn phím xuống
    onKeyDown(event) {
        const code = event.code;
        const key = event.key.toLowerCase();
        
        if (code === 'KeyW' || key === 'w') this.keys.KeyW = true;
        if (code === 'KeyS' || key === 's') this.keys.KeyS = true;
        if (code === 'KeyA' || key === 'a') this.keys.KeyA = true;
        if (code === 'KeyD' || key === 'd') this.keys.KeyD = true;
        if (code === 'Space' || key === ' ') this.keys.Space = true;
    }

    // Phương thức xử lý khi người dùng nhả phím ra
    onKeyUp(event) {
        const code = event.code;
        const key = event.key.toLowerCase();
        
        if (code === 'KeyW' || key === 'w') this.keys.KeyW = false;
        if (code === 'KeyS' || key === 's') this.keys.KeyS = false;
        if (code === 'KeyA' || key === 'a') this.keys.KeyA = false;
        if (code === 'KeyD' || key === 'd') this.keys.KeyD = false;
        if (code === 'Space' || key === ' ') this.keys.Space = false;
    }

    applySlow(duration, factor = 0.5) {
        this.slowMultiplier = factor;
        this.slowTimer = duration;
        console.log(`❄️ Bị làm chậm! Tốc độ còn ${factor * 100}% trong ${duration}s`);
    }

    applyJam(duration) {
        this.jamTimer = duration;
        if (this.weapon) this.weapon.isLocked = true;
        console.log(`🚫 Bị nhiễu sóng âm! Không thể bắn trong ${duration}s`);
    }

    activateDoubleFire() {
        if (this.bulletCount === 1) {
            this.bulletCount = 2; // Nếu đang bắn 1, nâng cấp lên 2
        } else {
            this.bulletCount = Math.min(this.bulletCount + 2, 6); // Cộng thêm 2, giới hạn tối đa 6
        }
        console.log(`🔥 Nâng cấp súng! Hiện tại bắn ${this.bulletCount} tia.`);
    }

    activateTripleFire() {
        if (this.bulletCount === 1) {
            this.bulletCount = 3; // Nếu đang bắn 1, nâng cấp lên 3
        } else {
            this.bulletCount = Math.min(this.bulletCount + 3, 6); // Cộng thêm 3, giới hạn tối đa 6
        }
        console.log(`⚡ Siêu cấp súng! Hiện tại bắn ${this.bulletCount} tia.`);
    }

    // Phương thức cập nhật logic của tàu, được gọi liên tục bởi vòng lặp game chính (GameLoop)
    update(delta, enemies = []) {
        if (!this.mesh) return; // Nếu mô hình 3D chưa tải xong thì thoát hàm để tránh lỗi

        // Kiểm tra cơ chế bắn súng bằng phím Space
        if (this.keys.Space) {
            this.weapon.fire();
        }

        // Cập nhật trạng thái đạn và tâm ngắm
        this.weapon.update(enemies);
        this.crosshair.update(this.mesh.position, enemies);
        this.itemSystem.update(delta);

        // --- Cập nhật hiệu ứng làm chậm ---
        if (this.slowTimer > 0) {
            this.slowTimer -= delta;
            if (this.slowTimer <= 0) {
                this.slowMultiplier = 1.0;
                console.log("🔥 Hiệu ứng làm chậm đã hết.");
            }
        }

        // --- Cập nhật Khiên bảo vệ ---
        if (this.shieldTimer > 0) {
            this.shieldTimer -= delta * 1000;
            if (this.shieldTimer <= 0) {
                this.shieldTimer = 0;
                this.setShield(false);
                console.log("🛡️ Khiên bảo vệ đã hết năng lượng.");
            }
        }

        // --- Cập nhật hiệu ứng kẹt súng ---
        if (this.jamTimer > 0) {
            this.jamTimer -= delta;
            if (this.jamTimer <= 0) {
                if (this.weapon) this.weapon.isLocked = false;
                console.log("🔫 Hệ thống vũ khí đã được mở khóa!");
            }
        }

        // --- XỬ LÝ DI CHUYỂN MƯỢT MÀ (VELOCITY-BASED) ---
        const currentSpeed = this.speed * this.slowMultiplier;
        const acceleration = currentSpeed * 0.45; // Tăng mạnh độ nhạy (cũ: 0.25)
        const friction = 0.82; // Dừng nhanh hơn để cảm giác "dính" phím tốt hơn (cũ: 0.9)
        
        // Tính toán hướng di chuyển mục tiêu
        let targetDx = 0;
        let targetDy = 0;
        if (this.keys.KeyA) targetDx -= currentSpeed;
        if (this.keys.KeyD) targetDx += currentSpeed;
        if (this.keys.KeyW) targetDy += currentSpeed;
        if (this.keys.KeyS) targetDy -= currentSpeed;

        // Cập nhật vận tốc với gia tốc và ma sát
        this.velocity.x = (this.velocity.x + targetDx * acceleration) * friction;
        this.velocity.y = (this.velocity.y + targetDy * acceleration) * friction;

        // Cập nhật vị trí mới dựa trên vận tốc và delta (ổn định khung hình)
        const frameSpeed = delta * 60; // Chuẩn hóa về 60 FPS
        this.mesh.position.x += this.velocity.x * frameSpeed;
        this.mesh.position.y += this.velocity.y * frameSpeed;

        // --- XỬ LÝ CHẶN BIÊN CỨNG (Flight Envelope) ---
        // Sử dụng giá trị từ CONFIG để xác định giới hạn không gian bay
        const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
        const envY = CONFIG.ENGINE.FLIGHT_ENVELOPE.Y;

        // Giới hạn biên ngang (X)
        if (this.mesh.position.x > envX) { // Vượt biên phải
            this.mesh.position.x = envX; // Giữ tàu tại biên
        } else if (this.mesh.position.x < -envX) { // Vượt biên trái
            this.mesh.position.x = -envX;
        }

        // Giới hạn biên dọc (Y)
        if (this.mesh.position.y > envY) { // Vượt biên trên
            this.mesh.position.y = envY;
        } else if (this.mesh.position.y < -envY) { // Vượt biên dưới
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
