import * as THREE from 'three'; // Nhập thư viện Three.js để xử lý đồ họa 3D
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Nhập bộ tải mô hình GLTF từ thư viện Three.js mở rộng
import { CONFIG } from '../../utils/CONFIG.JS'; // Nhập hằng số cấu hình từ CONFIG.JS

export class AsteroidSystem { // Khai báo lớp AsteroidSystem quản lý việc tạo và cập nhật thiên thạch
    constructor(scene) { // Hàm khởi tạo, nhận vào scene 3D
        this.scene = scene; // Lưu tham chiếu đến scene
        this.asteroids = []; // Mảng chứa danh sách các thiên thạch đang hiện diện trong cảnh
        this.loader = new GLTFLoader(); // Khởi tạo bộ tải GLTF
        this.asteroidModel = null; // Biến lưu trữ mô hình thiên thạch gốc sau khi tải xong
        
        // Phương án dự phòng (Fallback): Tạo vật thể hình khối đa diện nếu không tải được file model .glb
        this.fallbackGeometry = new THREE.IcosahedronGeometry(1, 0); // Tạo hình khối 20 mặt (Icosahedron) để làm giả đá
        this.fallbackMaterial = new THREE.MeshPhongMaterial({ // Vật liệu có khả năng phản xạ ánh sáng (Phong)
            color: 0x888888, // Màu xám đá
            flatShading: true, // Bật đổ bóng phẳng để khối đá trông góc cạnh hơn
            shininess: 0 // Độ bóng bằng 0 để bề mặt đá trông thô ráp
        });

        // Kiểm tra đường dẫn tài sản trong CONFIG, nếu không phải "PROCEDURAL" thì mới tiến hành tải
        const assetPath = CONFIG.ASSETS.MODELS.ASTEROID;
        
        if (assetPath !== "PROCEDURAL") {
            this.loader.load( // Bắt đầu tải mô hình 3D
                assetPath, 
                (glb) => { // Hàm callback khi tải thành công
                    this.asteroidModel = glb.scene; // Lưu scene của mô hình vào biến asteroidModel
                    console.log("Đã tải xong model thiên thạch!"); // Log thông báo thành công
                },
                undefined, // Bỏ qua theo dõi tiến độ (onProgress)
                (err) => { // Hàm callback xử lý lỗi tải
                    console.warn("Lỗi khi tải model asteroid.glb. Đang sử dụng fallback."); // Cảnh báo lỗi
                }
            );
        } else { // Nếu cấu hình là Procedural (tự sinh bằng mã)
            console.log("Hệ thống: Đang sử dụng thiên thạch Procedural (Code-generated).");
        }

        this.spawnTimer = 0; // Bộ đếm thời gian để kiểm soát nhịp độ sinh thiên thạch
    } // Kết thúc constructor

    // Hàm tạo (spawn) một thiên thạch mới đưa vào cảnh
    spawn() {
        let asteroid; // Biến tạm lưu thiên thạch sắp được tạo
        
        if (this.asteroidModel) { // Nếu đã tải xong mô hình 3D từ file
            asteroid = this.asteroidModel.clone(); // Sao chép (clone) từ mô hình gốc
        } else { // Nếu chưa có mô hình (dùng fallback)
            // Tạo một Mesh mới từ hình dáng 20 mặt và vật liệu đá xám
            asteroid = new THREE.Mesh(this.fallbackGeometry, this.fallbackMaterial);
        }
        
        // Thiết lập vị trí xuất hiện dựa trên 'Flight Envelope' trong CONFIG
        const envX = window.innerWidth / 80;
        const envY = window.innerHeight / 80;
        
        // Đặt vị trí X và Y ngẫu nhiên trong khoảng rộng gấp 3 lần vùng bay để tạo mật độ bao phủ
        asteroid.position.x = (Math.random() - 0.5) * envX * 3;
        asteroid.position.y = (Math.random() - 0.5) * envY * 3;
        // Đặt vị trí Z ở xa (tầm -150) theo cấu hình SPAWN_DISTANCE_Z
        asteroid.position.z = CONFIG.WORLD.SPAWN_DISTANCE_Z;

        // Thiết lập kích thước tỉ lệ (scale) ngẫu nhiên để các thiên thạch to nhỏ khác nhau
        const scale = 0.4 + Math.random() * 2.0;
        asteroid.scale.set(scale, scale, scale);
        
        // Đặt góc xoay ban đầu ngẫu nhiên quanh các trục X và Y
        asteroid.rotation.x = Math.random() * Math.PI;
        asteroid.rotation.y = Math.random() * Math.PI;
        
        // Gán vận tốc xoay tự thân ngẫu nhiên để thiên thạch quay lộn nhào trong không gian
        asteroid.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.05,
            y: (Math.random() - 0.5) * 0.05
        };

        this.scene.add(asteroid); // Thêm thiên thạch vào scene chính để hiển thị
        this.asteroids.push(asteroid); // Lưu vào mảng quản lý để cập nhật logic sau này
    } // Kết thúc phương thức spawn

    update(delta) { // Phương thức cập nhật chuyển động của toàn bộ thiên thạch mỗi khung hình
        // 1. Quản lý thời điểm Sinh (Spawn)
        this.spawnTimer += delta; // Tăng dần bộ đếm theo thời gian delta
        const density = CONFIG.WORLD.LEVEL_1.asteroid_density || 10; // Lấy mật độ từ CONFIG
        const spawnInterval = 1 / density; // Tính toán khoảng cách thời gian giữa mỗi lần sinh
        
        if (this.spawnTimer > spawnInterval) { // Nếu bộ đếm vượt qua khoảng thời gian spawn
            this.spawn(); // Gọi hàm sinh thiên thạch mới
            this.spawnTimer = 0; // Đặt lại bộ đếm về 0
        }

        // 2. Cập nhật Vị trí và Xoay cho từng thiên thạch
        const speedMultiplier = 60; // Tốc độ di chuyển tiến về phía màn hình (di chuyển theo trục Z dương)
        
        for (let i = this.asteroids.length - 1; i >= 0; i--) { // Duyệt mảng từ dưới lên để an toàn khi xóa phần tử
            const asteroid = this.asteroids[i];
            
            asteroid.position.z += delta * speedMultiplier; // Di chuyển thiên thạch lao về phía camera
            
            // Cập nhật góc quay tự thân dựa trên vận tốc xoay đã lưu trong userData
            asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
            asteroid.rotation.y += asteroid.userData.rotationSpeed.y;

            // Kiểm tra nếu thiên thạch đã bay vượt quá giới hạn phía sau người chơi (Z dương)
            if (asteroid.position.z > CONFIG.WORLD.DESPAWN_DISTANCE_Z) {
                this.scene.remove(asteroid); // Gỡ bỏ khỏi scene 3D
                this.asteroids.splice(i, 1); // Xóa khỏi mảng quản lý để giải phóng bộ nhớ
            }
        }
    } // Kết thúc phương thức update

    checkCollisions(playerMesh, onCollide) { // Phương thức kiểm tra va chạm giữa người chơi và thiên thạch
        if (!playerMesh || this.asteroids.length === 0) return; // Bỏ qua nếu chưa có tàu hoặc chưa có thiên thạch

        const playerPos = playerMesh.position; // Lấy vị trí tâm của tàu người chơi
        // Thiết lập bán kính va chạm ảo của người chơi (vùng bao quanh tàu)
        const playerRadius = 0.3; 

        this.asteroids.forEach(asteroid => { // Duyệt qua từng thiên thạch
            const dist = playerPos.distanceTo(asteroid.position); // Tính khoảng cách Euclid giữa tâm tàu và tâm thiên thạch
            const asteroidRadius = asteroid.scale.x * 0.6; // Tính bán kính va chạm dựa trên tỉ lệ phóng to của thiên thạch

            // Nếu khoảng cách giữa hai vật thể nhỏ hơn tổng bán kính va chạm của chúng
            if (dist < (playerRadius + asteroidRadius)) {
                onCollide(asteroid); // Gọi hàm callback xử lý va chạm (ví dụ: trừ máu người chơi)
                // Đẩy thiên thạch đi xa ngay lập tức sau va chạm để tránh việc va chạm liên tục nhiều lần trong một mili giây
                asteroid.position.z = 100; 
            }
        }); // Kết thúc duyệt mảng
    } // Kết thúc phương thức checkCollisions
} // Kết thúc lớp AsteroidSystem
