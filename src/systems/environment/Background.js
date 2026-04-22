import * as THREE from 'three'; // Nhập thư viện Three.js để xử lý đồ họa 3D

export class Background { // Khai báo lớp Background quản lý nền vũ trụ và các hiệu ứng môi trường
    constructor() { // Hàm khởi tạo của lớp Background
        this.scene = null; // Lưu trữ tham chiếu đến scene (cảnh 3D)
        this.group = null; // Nhóm chứa toàn bộ các vật thể nền (sao, mây, tinh vân)
        this.starsGlow = null; // Đối tượng Points chứa các điểm sao phát sáng
        this.cloudsGroup = null; // Nhóm chứa các tấm mặt phẳng giả lập mây tinh vân
    } // Kết thúc constructor
    
    init(scene, texturePath = '/textures/background.png') { // Phương thức khởi tạo các thành phần nền
        this.scene = scene; // Lưu scene truyền vào
        scene.background = new THREE.Color(0x020205); // Đặt màu nền mặc định cho scene là màu xanh đen rất đậm

        this.group = new THREE.Group(); // Khởi tạo một nhóm (Group) để dễ dàng quản lý xoay/di chuyển toàn bộ nền
        scene.add(this.group); // Thêm nhóm này vào scene chính

        const textureLoader = new THREE.TextureLoader(); // Khởi tạo bộ tải kết cấu (texture)
        textureLoader.load(texturePath, (texture) => { // Tải hình ảnh nền vũ trụ
            texture.colorSpace = THREE.SRGBColorSpace; // Đặt không gian màu chuẩn sRGB để hiển thị màu sắc chính xác
            texture.mapping = THREE.EquirectangularReflectionMapping; // Thiết lập kiểu ánh xạ hình ảnh bao quanh (equirectangular)

            const bgGeometry = new THREE.SphereGeometry(600, 60, 40); // Tạo một hình cầu khổng lồ với bán kính 600 bao quanh người chơi
            bgGeometry.scale(-1, 1, 1); // Đảo ngược hình cầu vào bên trong để ta nhìn thấy hình ảnh từ phía trong lòng cầu
            
            const bgMaterial = new THREE.MeshBasicMaterial({ // Tạo vật liệu cơ bản cho hình cầu nền
                map: texture, // Gán hình ảnh vừa tải vào vật liệu
                color: 0x222233, // Pha thêm chút màu xanh tím tối để làm nền trầm xuống
                transparent: true, // Cho phép vật liệu có độ trong suốt
                opacity: 0.4 // Độ mờ của nền là 40% để không làm lóa mắt người chơi
            });
            
            const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial); // Tạo lưới 3D từ hình cầu và vật liệu
            this.group.add(bgMesh); // Thêm lưới hình cầu nền vào nhóm quản lý chung
        }); // Kết thúc callback tải texture

        // Hàm tạo hình ảnh điểm sáng mờ (glow) bằng Canvas 2D
        const createGlowPoint = () => {
            const canvas = document.createElement('canvas'); // Tạo phần tử canvas tạm thời
            canvas.width = 64; // Độ rộng 64px
            canvas.height = 64; // Độ cao 64px
            const ctx = canvas.getContext('2d'); // Lấy ngữ cảnh vẽ 2D
            
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); // Tạo dải màu đồng tâm (gradient) từ tâm ra ngoài
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // Tại tâm là màu trắng đặc
            gradient.addColorStop(0.15, 'rgba(0, 255, 255, 0.8)'); // Tiếp theo là màu xanh lơ (cyan)
            gradient.addColorStop(0.4, 'rgba(0, 80, 255, 0.4)'); // Chuyển dần sang xanh dương nhạt
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Cuối cùng là trong suốt hoàn toàn ở rìa
            
            ctx.fillStyle = gradient; // Đặt dải màu vừa tạo làm kiểu tô
            ctx.fillRect(0, 0, 64, 64); // Tô màu lên toàn bộ canvas
            return new THREE.CanvasTexture(canvas); // Trả về kết cấu được tạo từ chính canvas này
        };

        const pointsGeometry = new THREE.BufferGeometry(); // Tạo hình học chứa các điểm (vertex)
        const pointsMaterial = new THREE.PointsMaterial({ // Tạo vật liệu cho hệ thống điểm (sao)
            size: 4.5, // Kích thước mỗi điểm sao là 4.5 đơn vị
            map: createGlowPoint(), // Gán kết cấu điểm sáng vừa tạo ở trên
            transparent: true, // Bật tính năng trong suốt
            blending: THREE.AdditiveBlending, // Dùng chế độ cộng màu để các điểm sao xếp chồng lên nhau sẽ sáng rực lên
            depthWrite: false, // Tắt ghi độ sâu để tránh hiện tượng viền đen khi các hạt chồng lên nhau
        });

        const pointsCount = 1200; // Số lượng điểm sao là 1200
        const pointsPosition = new Float32Array(pointsCount * 3); // Mảng chứa tọa độ (x, y, z) cho từng điểm sao
        for(let i = 0; i < pointsCount * 3; i++) {
            pointsPosition[i] = (Math.random() - 0.5) * 600; // Rải ngẫu nhiên các điểm trong phạm vi khối lập phương cạnh 600
        }
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointsPosition, 3)); // Gán mảng tọa độ vào thuộc tính position của hình học
        this.starsGlow = new THREE.Points(pointsGeometry, pointsMaterial); // Tạo đối tượng hệ thống điểm sao (Points)
        this.group.add(this.starsGlow); // Thêm hệ thống sao vào nhóm nền

        // Hàm tạo kết cấu giả lập mây tinh vân
        const createCloudTexture = () => {
            const canvas = document.createElement('canvas'); // Tạo canvas tạm thời
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128); // Chuyển tâm gradient ra giữa (128, 128) để mây không bị vỡ mép
            gradient.addColorStop(0, 'rgba(131, 75, 252, 0.15)'); // Màu tím nhạt ở trung tâm với độ mờ thấp
            gradient.addColorStop(0.5, 'rgba(50, 150, 255, 0.05)'); // Sang màu xanh dương mờ hơn
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Trong suốt ở rìa
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);
            return new THREE.CanvasTexture(canvas);
        };

        const cloudTexture = createCloudTexture(); // Tạo texture mây
        
        const baseCloudMaterial = new THREE.SpriteMaterial({ // Chuyển sang dùng vật liệu cho Sprite thay vì Mesh Basic
            map: cloudTexture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending, // Chế độ cộng sáng
            depthWrite: false
        });

        this.cloudsGroup = new THREE.Group(); // Tạo nhóm riêng để quản lý các đám mây
        this.group.add(this.cloudsGroup); // Thêm vào nhóm nền chung

        for(let i = 0; i < 80; i++) { // Sinh ra 80 đám mây ngẫu nhiên
            // Clone material để từng sprite mây có xoay (rotation) mượt mà độc lập
            const cloudMat = baseCloudMaterial.clone(); 
            cloudMat.rotation = Math.random() * Math.PI * 2;
            
            const cloud = new THREE.Sprite(cloudMat); // Sprite sẽ luôn xoay mặt về camera (billboard), ko lộ cạnh nghiêng nữa
            cloud.scale.set(150, 150, 1); // Sử dụng scale thay cho Geometry size
            
            const r = 80 + Math.random() * 200; // Khoảng cách ngẫu nhiên từ tâm (80 đến 280)
            const theta = Math.random() * 2 * Math.PI; // Góc xoay ngang ngẫu nhiên
            const phi = Math.random() * Math.PI; // Góc xoay dọc ngẫu nhiên
            // Tính toán vị trí x, y, z trên bề mặt hình cầu dựa theo hệ tọa độ cầu
            cloud.position.x = r * Math.sin(phi) * Math.cos(theta);
            cloud.position.y = r * Math.sin(phi) * Math.sin(theta);
            cloud.position.z = r * Math.cos(phi);
            
            this.cloudsGroup.add(cloud); // Thêm đám mây vào nhóm mây
        } // Kết thúc vòng lặp tạo mây
    } // Kết thúc phương thức init

    update() { // Phương thức cập nhật chuyển động cho nền mỗi khung hình
        if (this.starsGlow) { // Nếu hệ thống sao tồn tại
            this.starsGlow.rotation.y += 0.00008; // Xoay nhẹ hệ sao quanh trục Y
            this.starsGlow.rotation.x -= 0.00004; // Xoay nhẹ theo trục X để tạo hiệu ứng không gian động
        }
        if (this.cloudsGroup) { // Nếu có các đám mây
            this.cloudsGroup.rotation.y -= 0.0001; // Xoay chậm nhóm mây
            this.cloudsGroup.rotation.z += 0.00005; 
            this.cloudsGroup.children.forEach(cloud => { // Duyệt qua từng tấm mây con
                cloud.material.rotation += 0.00015; // Quay trên Sprite Material
            });
        }
    } // Kết thúc update

    setRoll(targetRoll, smoothness) { // Phương thức điều chỉnh độ nghiêng của toàn bộ nền (Hiệu ứng Horizon Banking)
        if (this.group) { // Nếu nhóm nền tồn tại
            // Dùng nội suy tuyến tính (Lerp) để xoay nền mượt mà tới góc mục tiêu
            this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, targetRoll, smoothness);
        }
    } // Kết thúc setRoll
} // Kết thúc lớp Background
