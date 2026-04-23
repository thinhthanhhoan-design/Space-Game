import * as THREE from 'three'; // Nhập thư viện Three.js để xử lý đồ họa 3D

export class Background { // Khai báo lớp Background quản lý nền vũ trụ và các hiệu ứng môi trường
    constructor() { // Hàm khởi tạo của lớp Background
        this.scene = null; // Lưu trữ tham chiếu đến scene (cảnh 3D)
        this.group = null; // Nhóm chứa toàn bộ các vật thể nền (sao, mây, tinh vân)
        this.starsGlow = null; // Đối tượng Points chứa các điểm sao phát sáng
        this.whiteStars = null; // Đối tượng Points chứa các điểm sao trắng
        this.crossStars = null; // Đối tượng Points chứa các sao chữ thập
    } // Kết thúc constructor

    init(scene, texturePath = '/textures/background.png') { // Phương thức khởi tạo các thành phần nền
        this.scene = scene; // Lưu scene truyền vào
        scene.background = new THREE.Color(0x00142e); // Đặt màu nền mặc định cho scene là màu xanh đen rất đậm

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

        const createWhiteGlowPoint = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');

            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(canvas);
        };

        const createCrossStar = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            const cx = 64;
            const cy = 64;

            // Lõi sáng trắng
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(cx - 20, cy - 20, 40, 40);

            // Tia sáng chéo (màu trắng hơi ngả xanh dương nhạt cho đẹp)
            const flareColor = 'rgba(220, 240, 255, 0.9)';

            // Tia dọc
            const verticalGradient = ctx.createLinearGradient(cx, 0, cx, 128);
            verticalGradient.addColorStop(0, 'rgba(0,0,0,0)');
            verticalGradient.addColorStop(0.5, flareColor);
            verticalGradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = verticalGradient;
            ctx.fillRect(cx - 1.5, 0, 3, 128);

            // Tia ngang
            const horizontalGradient = ctx.createLinearGradient(0, cy, 128, cy);
            horizontalGradient.addColorStop(0, 'rgba(0,0,0,0)');
            horizontalGradient.addColorStop(0.5, flareColor);
            horizontalGradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = horizontalGradient;
            ctx.fillRect(0, cy - 1.5, 128, 3);

            return new THREE.CanvasTexture(canvas);
        };

        const pointsGeometry = new THREE.BufferGeometry(); // Tạo hình học chứa các điểm (vertex)
        const pointsMaterial = new THREE.PointsMaterial({ // Tạo vật liệu cho hệ thống điểm (sao xanh)
            size: 4.5, // Kích thước mỗi điểm sao là 4.5 đơn vị
            map: createGlowPoint(), // Gán kết cấu điểm sáng xanh
            transparent: true, // Bật tính năng trong suốt
            blending: THREE.AdditiveBlending, // Dùng chế độ cộng màu để các điểm sao xếp chồng lên nhau sẽ sáng rực lên
            depthWrite: false, // Tắt ghi độ sâu để tránh hiện tượng viền đen khi các hạt chồng lên nhau
        });

        const pointsCount = 1800; // Số lượng điểm sao xanh là 1200
        const pointsPosition = new Float32Array(pointsCount * 3); // Mảng chứa tọa độ (x, y, z) cho từng điểm sao xanh
        for (let i = 0; i < pointsCount * 3; i++) {
            pointsPosition[i] = (Math.random() - 0.5) * 800; // Rải ngẫu nhiên các điểm
        }
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointsPosition, 3)); // Gán mảng tọa độ vào thuộc tính position của hình học
        this.starsGlow = new THREE.Points(pointsGeometry, pointsMaterial); // Tạo đối tượng hệ thống điểm sao (Points)
        this.group.add(this.starsGlow); // Thêm hệ thống sao xanh vào nhóm nền

        // Thêm hệ thống sao trắng
        const whiteGeometry = new THREE.BufferGeometry();
        const whiteMaterial = new THREE.PointsMaterial({
            size: 3.5, // Sao trắng nhỏ hơn một chút
            map: createWhiteGlowPoint(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const whiteCount = 2000; // 2000 sao trắng
        const whitePosition = new Float32Array(whiteCount * 3);
        for (let i = 0; i < whiteCount * 3; i++) {
            whitePosition[i] = (Math.random() - 0.5) * 800;
        }
        whiteGeometry.setAttribute('position', new THREE.BufferAttribute(whitePosition, 3));
        this.whiteStars = new THREE.Points(whiteGeometry, whiteMaterial);
        this.group.add(this.whiteStars);

        // Thêm hệ thống sao hình chữ thập
        const crossGeometry = new THREE.BufferGeometry();
        const crossMaterial = new THREE.PointsMaterial({
            size: 15, // Kích thước lớn hơn sao thường để thấy rõ hình chữ thập
            map: createCrossStar(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const crossCount = 200; // 200 sao hình chữ thập
        const crossPosition = new Float32Array(crossCount * 3);
        for (let i = 0; i < crossCount * 3; i++) {
            crossPosition[i] = (Math.random() - 0.5) * 800;
        }
        crossGeometry.setAttribute('position', new THREE.BufferAttribute(crossPosition, 3));
        this.crossStars = new THREE.Points(crossGeometry, crossMaterial);
        this.group.add(this.crossStars);
    } // Kết thúc phương thức init

    update() { // Phương thức cập nhật chuyển động cho nền mỗi khung hình
        if (this.starsGlow) { // Nếu hệ thống sao tồn tại
            this.starsGlow.rotation.y += 0.00008; // Xoay nhẹ hệ sao quanh trục Y
            this.starsGlow.rotation.x -= 0.00004; // Xoay nhẹ theo trục X để tạo hiệu ứng không gian động
        }
        if (this.whiteStars) {
            this.whiteStars.rotation.y += 0.00010; // Xoay nhanh hơn chút để tạo parallax
            this.whiteStars.rotation.x -= 0.00005;
        }
        if (this.crossStars) {
            this.crossStars.rotation.y += 0.00006;
            this.crossStars.rotation.x -= 0.00003;
        }
    } // Kết thúc update

    setRoll(targetRoll, smoothness) { // Phương thức điều chỉnh độ nghiêng của toàn bộ nền (Hiệu ứng Horizon Banking)
        if (this.group) { // Nếu nhóm nền tồn tại
            // Dùng nội suy tuyến tính (Lerp) để xoay nền mượt mà tới góc mục tiêu
            this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, targetRoll, smoothness);
        }
    } // Kết thúc setRoll
} // Kết thúc lớp Background
