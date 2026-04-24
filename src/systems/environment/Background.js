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
        scene.background = new THREE.Color(0x00102a); //để nền có thể trở nên trong suốt

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

        // Hàm phụ trợ dùng chung để rải sao cố định ở cực kỳ xa và rộng
        const fillPositions = (array, count) => {
            for (let i = 0; i < count * 3; i += 3) {
                array[i] = (Math.random() - 0.5) * 1600;     // Vươn xa X ra 1600 để phủ kín tầm nhìn
                array[i + 1] = (Math.random() - 0.5) * 1600; // Vươn xa Y ra 1600
                array[i + 2] = -1000 + (Math.random() * 800); // 100% sao bị nhốt ở khu vực KHÔNG GIAN SÂU (Từ -1000 đến -200)
            }
        };

        const pointsGeometry = new THREE.BufferGeometry();
        const pointsMaterial = new THREE.PointsMaterial({
            size: 6.0,
            map: createGlowPoint(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const pointsCount = 6000; // Mật độ tăng gấp rưỡi (2500 -> 6000)
        const pointsPosition = new Float32Array(pointsCount * 3);
        fillPositions(pointsPosition, pointsCount);
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointsPosition, 3));
        this.starsGlow = new THREE.Points(pointsGeometry, pointsMaterial);
        this.group.add(this.starsGlow);

        // Thêm hệ thống sao trắng
        const whiteGeometry = new THREE.BufferGeometry();
        const whiteMaterial = new THREE.PointsMaterial({
            size: 3.5,
            map: createWhiteGlowPoint(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const whiteCount = 5000; // Tăng lượng sao trắng (2000 -> 5000)
        const whitePosition = new Float32Array(whiteCount * 3);
        fillPositions(whitePosition, whiteCount);
        whiteGeometry.setAttribute('position', new THREE.BufferAttribute(whitePosition, 3));
        this.whiteStars = new THREE.Points(whiteGeometry, whiteMaterial);
        this.group.add(this.whiteStars);

        // Thêm hệ thống sao hình chữ thập
        const crossGeometry = new THREE.BufferGeometry();
        const crossMaterial = new THREE.PointsMaterial({
            size: 15,
            map: createCrossStar(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const crossCount = 200;
        const crossPosition = new Float32Array(crossCount * 3);
        fillPositions(crossPosition, crossCount);
        crossGeometry.setAttribute('position', new THREE.BufferAttribute(crossPosition, 3));
        this.crossStars = new THREE.Points(crossGeometry, crossMaterial);
        this.group.add(this.crossStars);
    } // Kết thúc phương thức init

    update(delta = 0.016, targetPos = null) { // Nhận thêm targetPos để neo hệ sao
        if (targetPos && this.group) {
            // Khóa chặt vị trí trục ngang và dọc của hệ sao vào tàu để làm tâm xoay (Horizon Banking)
            this.group.position.x = targetPos.x;
            this.group.position.y = targetPos.y;

            // Bổ sung hiệu ứng Parallax (Trượt thị giác): Các vì sao sẽ trượt nhẹ ngược chiều di chuyển của tàu
            // Điều này giúp người chơi CẢM NHẬN ĐƯỢC CẢM GIÁC ĐANG BAY LÊN / BAY XUỐNG / SANG NGANG
            if (this.starsGlow) {
                this.starsGlow.position.x = -targetPos.x * 0.05;
                this.starsGlow.position.y = -targetPos.y * 0.05;
            }
            if (this.whiteStars) {
                this.whiteStars.position.x = -targetPos.x * 0.1;
                this.whiteStars.position.y = -targetPos.y * 0.1;
            }
            if (this.crossStars) {
                this.crossStars.position.x = -targetPos.x * 0.2;
                this.crossStars.position.y = -targetPos.y * 0.2;
            }
        }

        const moveStars = (points, speed) => {
            if (!points) return;

            // ĐÃ XÓA TÍNH NĂNG TỰ XOAY (points.rotation.x / y)
            // Việc tự xoay X, Y khiến rốn phát xạ (trục Z trôi) của sao bị lệch.
            // Khi kết hợp với việc nghiêng cánh tàu (quay trục Z), trục Z bị lệch này sẽ vặn vòng vèo 
            // gây ra hiện tượng sao đổi hướng loạn xạ. Xóa đi sẽ bắt sao chạy thẳng tắp 100%.

            // Bay về phía camera cực kỳ chậm để không bị trông giống "bão tuyết"
            const positions = points.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 2] += speed * delta * 60;
                if (positions[i + 2] > -200) { // Khi sao bay vừa chớm tới ngưỡng không gian sâu (-200)
                    positions[i + 2] -= 800; // Lặp vô cực lùi lại đúng 800 đơn vị (duy trì khoảng cách), KHÔNG BỊ TRỐNG ARRAY
                }
            }
            points.geometry.attributes.position.needsUpdate = true;
        };

        // Chỉnh trôi sao nhanh hơn theo yêu cầu
        moveStars(this.starsGlow, 0.8);
        moveStars(this.whiteStars, 1.5);
        moveStars(this.crossStars, 2.5);

        // Mây tinh vân trôi rải rác đằng sau với tốc độ siêu chậm
        const moveNebula = (points, speed) => {
            if (!points) return;
            const positions = points.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 2] += speed * delta * 60;
                if (positions[i + 2] > -1000) { // Chạm tới mốc -1000 thì đẩy lại vạch xuất phát
                    positions[i + 2] -= 800;
                }
            }
            points.geometry.attributes.position.needsUpdate = true;
        };
        moveNebula(this.nebulaClouds, 0.1);
    } // Kết thúc update

    setRoll(targetRoll, smoothness) { // Phương thức điều chỉnh độ nghiêng của toàn bộ nền (Hiệu ứng Horizon Banking)
        if (this.group) { // Nếu nhóm nền tồn tại
            // Dùng nội suy tuyến tính (Lerp) để xoay nền mượt mà tới góc mục tiêu
            this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, targetRoll, smoothness);
        }
    } // Kết thúc setRoll
} // Kết thúc lớp Background
