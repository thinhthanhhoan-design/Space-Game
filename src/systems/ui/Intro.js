import * as THREE from 'three';
import gsap from 'gsap';
import { GSA } from '../effects/GSA.js';
import { CONFIG } from '../../utils/CONFIG.JS';

export class Intro {
    constructor(sceneController) {
        // Lưu trữ bộ điều khiển bối cảnh (chứa scene, camera, renderer gốc)
        this.sceneController = sceneController;
        
        // Khởi tạo các biến chứa đối tượng 3D sẽ dùng trong Màn hình chờ
        this.logoMesh = null;        // Lưới 2D hiển thị ảnh Logo lúc chưa bấm Play
        this.particleSystem = null;  // Hệ thống hạt Particle (điểm sáng điểm ảnh)
        
        // Các mảng lưu trữ tọa độ để tạo hiệu ứng GSA chuyển động hạt
        this.originalPositions = null; // Vị trí gốc của từng hạt tạo thành hình Logo
        this.explosionTargets = null;  // Vị trí đích văng ra không gian của từng hạt (Tạo vụ nổ)
        this.particlesGeometry = null; // Hình học Buffer chứa các đỉnh và màu sắc
        
        // Cờ đánh dấu màn hình Intro đang chạy, nếu False thì game đã bắt đầu
        this.isIntroActive = true;
    }

    // Hàm khởi tạo và dựng hình Intro ban đầu (Chưa chuyển động)
    init(callback) {
        const scene = this.sceneController.scene;
        const camera = this.sceneController.camera;
        const startBtn = document.getElementById('start-btn');
        
        // Tạo một vân bề mặt (Texture) hình tròn gradient mờ ảo cho từng điểm hạt thêm lung linh
        const createCircleTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
            // Giảm opacity dần ra ngoài lề tạo viền mờ (Glow)
            gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(canvas);
        };
        const particleTexture = createCircleTexture();

        // Khởi tạo tiến trình tải Hình ảnh Logo 2D
        const loader = new THREE.TextureLoader();
        // Lấy đường dẫn an toàn bằng cú pháp URL mới của Vite theo import.meta.url
        const logoUrl = new URL('../../../public/textures/Logo.webp', import.meta.url).href;
        
        loader.load(logoUrl, (texture) => {
            // Lấy thông số điểm ảnh để tiến hành CẮT ảnh (Pixelation) thành Hạt
            const image = texture.image;
            const canvas = document.createElement('canvas'); // Tạo khung Canvas ẩn
            const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Bật cờ tăng tốc đọc ảnh
            
            // Canh tỷ lệ chuẩn màn hình
            const canvasWidth = 250; 
            const canvasHeight = (image.height / image.width) * canvasWidth;
            canvas.width = canvasWidth; canvas.height = canvasHeight;
            
            // Vẽ ảnh lên canvas ẩn để chuẩn bị chiết xuất từng mãng màu
            ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

            // Bắt đầu là hiện 1 tấm ảnh 2D mờ ảo chứa logo ở gốc màn hình
            const planeGeom = new THREE.PlaneGeometry(canvasWidth * 1.5, canvasHeight * 1.5);
            const planeMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false });
            this.logoMesh = new THREE.Mesh(planeGeom, planeMat);
            scene.add(this.logoMesh);

            // Rút trích dải điểm ảnh (Pixel Data) dưới dạng RGBA từ Canvas
            const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
            const positionsArr = []; // Chứa dải 0,0,0
            const colorsArr = []; 
            const targetsArr = [];
            
            const step = 0.5; 

            for (let y = 0; y < canvas.height; y += step) {
                for (let x = 0; x < canvas.width; x += step) {
                    const px = Math.floor(x);
                    const py = Math.floor(y);
                    const index = (py * canvas.width + px) * 4;

                    const alpha = imageData[index + 3];

                    if (alpha > 50) { 
                        // Nhân tỷ lệ khuếch đại 1.5 để logo to lớn hoành tráng (ko phải 0.15)
                        const pX = (x - canvasWidth / 2) * 1.5; 
                        const pY = -(y - canvasHeight / 2) * 1.5;
                        const pZ = (Math.random() - 0.5) * 5; 

                        positionsArr.push(pX, pY, pZ);

                        const r = imageData[index] / 255;
                        const g = imageData[index + 1] / 255;
                        const b = imageData[index + 2] / 255;
                        colorsArr.push(r, g, b); 

                        targetsArr.push(
                            pX * (Math.random() * 20 + 10),
                            pY * (Math.random() * 20 + 10),
                            pZ + (Math.random() - 0.5) * 800
                        );
                    }
                }
            }

            // Chuyển đối Buffer thành GPU Float32Array
            this.originalPositions = new Float32Array(positionsArr);
            this.explosionTargets = new Float32Array(targetsArr);

            // Nạp Buffer vào Three.JS
            this.particlesGeometry = new THREE.BufferGeometry();
            this.particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArr, 3));
            this.particlesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsArr, 3));

            // Cấu hình vật liệu
            const particlesMaterial = new THREE.PointsMaterial({
                size: 2.2, 
                map: particleTexture, 
                vertexColors: true, 
                transparent: true, 
                opacity: 0.9, 
                depthWrite: false, 
                blending: THREE.AdditiveBlending 
            });

            this.particleSystem = new THREE.Points(this.particlesGeometry, particlesMaterial);

            // Fade-in ảnh 2D mờ trong 2 giây đầu
            gsap.to(planeMat, { opacity: 1, duration: 2, ease: "power2.inOut" });
            
            // Xử lý hiện nút Start sau khoảng trễ ngắn
            if(startBtn) {
                gsap.to(startBtn, { opacity: 1, duration: 1.5, delay: 1.5, onComplete: () => {
                    startBtn.style.pointerEvents = 'auto'; // Cho phép click
                }});
            }
        });

        // Bắt sự kiện người dùng Click Start
        if(startBtn) {
            startBtn.addEventListener('click', () => {
                // Xóa sổ ngay lập tức giao diện UI và ảnh Plane Mesh ảo
                gsap.to(startBtn, { opacity: 0, scale: 0.8, duration: 0.4, onComplete: () => startBtn.style.display = 'none' });
                if (!this.particlesGeometry || !this.logoMesh) return;
                scene.remove(this.logoMesh);
                
                // MỘT SỰ ĐÁNH TRÁO: Thay mặt phẳng Plane 2D thành Hệ thống 100 ngàn điểm 3D ngay lập tức và khớp trùng khít!
                scene.add(this.particleSystem); 

                // Khai báo một Object trừu tượng để chạy Timeline cho Animation vụ nổ (Lerp CPU)
                const positionsAttribute = this.particlesGeometry.attributes.position;
                const currentPositions = positionsAttribute.array;
                const animObj = { progress: 0 };

                // Kế thừa PHẦN 1 & PHẦN 2 từ luồng làm việc mới của chúng ta
                const introTL = gsap.timeline({
                    onComplete: () => {
                        this.isIntroActive = false;
                        if (callback) callback(this.particleSystem); // Gửi cờ gọi Phần 3 (GSA Hội tụ)
                    }
                });

                // PHẦN 1: KÍCH NỔ LOGO UET
                // Sử dụng thời lượng từ CONFIG (ví dụ INTRO_DURATION hoặc giá trị mặc định)
                introTL.to(animObj, {
                    progress: 1, 
                    duration: 8.0, 
                    ease: "power3.out",
                    onUpdate: () => {
                        for (let i = 0; i < currentPositions.length; i++) {
                            currentPositions[i] = THREE.MathUtils.lerp(this.originalPositions[i], this.explosionTargets[i], animObj.progress);
                        }
                        positionsAttribute.needsUpdate = true;
                    }
                });

                // PHẦN 2: LIA CAMERA TỪ NGOÀI VÀO TRONG (Đến tọa độ Gameplay từ CONFIG)
                const camOffset = CONFIG.CAMERA.OFFSET;
                introTL.to(camera.position, {
                    x: camOffset.x, y: camOffset.y, z: camOffset.z, 
                    duration: 2.0, 
                    ease: "power2.inOut"
                });
            });
        }
    }

    // Vòng lặp cập nhật Game Loop Intro để logo nổi nhấp nhô
    update(elapsedTime) {
        if (!this.isIntroActive) return;
        const floatY = Math.sin(elapsedTime * 0.5) * 5; // Tính quỹ đạo bù Y hình sin
        const floatRotY = Math.sin(elapsedTime * 0.2) * 0.1;
        if (this.logoMesh) { this.logoMesh.position.y = floatY; this.logoMesh.rotation.y = floatRotY; }
        if (this.particleSystem) { this.particleSystem.position.y = floatY; this.particleSystem.rotation.y = floatRotY; }
    }

    // PHẦN 3: HIỆU ỨNG GSA (GEOMETRY SAMPLE & ANIMATE) -> Tụ Hạt vào lưới Tàu
    startTransition(logoParticles, playerModel, cam, onComplete) {
        if (!logoParticles || !playerModel) {
            if (onComplete) onComplete();
            return; // Lỗi thiếu hệ hạt trươc khi chạy
        }

        playerModel.updateMatrixWorld(true);
        // Quét siêu phân luồng mảng điểm Mesh của Tàu. Yêu cầu lấy đủ 100 ngàn điểm Target
        const targetPoints = GSA.getModelPoints(playerModel);
        
        const tl = gsap.timeline();
        
        // Gọi lệnh GPU Shader, gồng hạt bụi 4.1 giây cho tới khi gắn thẳng mặt boong tàu
        tl.add(GSA.animateToTarget(gsap, logoParticles, targetPoints, {
            duration: 3.5, 
            ease: "power2.out", 
        }), 0);

        // Đứng im tại trục Gameplay ngắm sự thành công 2 giây
        tl.to({}, { duration: 2.0 });

        tl.call(() => {
            // Đóng ánh sáng 3D ảo và thay bằng lưới Polygon xịn của phi thuyền
            logoParticles.visible = false;
            playerModel.visible = true;
            if (onComplete) onComplete();
        });
    }
}
