import * as THREE from 'three';
import gsap from 'gsap';

export class CinematicEffects { // Lớp quản lý các hiệu ứng điện ảnh và chuyển cảnh
    constructor(scene, camera) { // Khởi tạo với scene và camera hiện tại
        this.scene = scene; // Lưu tham chiếu cảnh 3D
        this.camera = camera; // Lưu tham chiếu góc máy quay
        this.flash = null; // Biến DOM Div cho hiệu ứng chớp đỏ báo động
        this.whiteFlash = null; // Biến DOM Div cho hiệu ứng chớp trắng loá mắt
        this.textDiv = null; // Biến DOM Div cho hiệu ứng gõ chữ phụ đề kịch bản
        this.blackHole = null; // Biến Mesh chứa phần lõi đen 3D siêu khối
        this.blackGlow = null; // Biến Mesh chứa vầng hào quang viền quanh lõi đen
        
        this.initDOM(); // Gắn các thẻ HTML ảo dọn đường sẵn vào body
    }

    initDOM() { // Khởi tạo các lớp HTML đè lên trên Canvas 3D (Overlay)
        // Lớp chớp đỏ (Red Flash Overlay) dùng làm hiệu ứng cảnh báo rủi ro
        this.flash = document.createElement("div");
        this.flash.id = "flash-red";
        Object.assign(this.flash.style, {
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "100%", // Phủ kín màn hình
            background: "radial-gradient(circle, transparent 60%, rgba(255, 0, 0, 0.4) 100%)", // Đỏ viền
            boxShadow: "inset 0 0 150px rgba(255, 0, 0, 0.6)",
            opacity: 0, // Mặc định ẩn 100%
            pointerEvents: "none", // Xuyên thấu click chuột
            zIndex: 20 // Đè lên UI nhưng dưới một số lớp popup
        });
        document.body.appendChild(this.flash);

        // Lớp flash trắng xoá cường độ cao (White Flash Overlay) để che việc đổi Scene
        this.whiteFlash = document.createElement("div");
        this.whiteFlash.id = "flash-white";
        Object.assign(this.whiteFlash.style, {
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "100%",
            background: "white", opacity: 0, pointerEvents: "none", zIndex: 30 // Nằm cao hơn để che mọi thứ
        });
        document.body.appendChild(this.whiteFlash);

        // Khung chữ hiển thị các pha phụ đề phim điện ảnh (Cinematic Text)
        this.textDiv = document.createElement("div");
        this.textDiv.id = "cinematic-text";
        Object.assign(this.textDiv.style, {
            position: "absolute",
            top: "15%", left: "50%", transform: "translateX(-50%)", // Căn giữa viền trên
            color: "white", fontSize: "24px", fontFamily: "'Orbitron', sans-serif", // Dùng Font khoa học viễn tưởng
            textAlign: "center", 
            textShadow: "0 0 20px rgba(0, 255, 255, 0.8), 0 0 5px black", // Đổ bóng viền chữ nổi bật
            opacity: 0, zIndex: 100, // Ưu tiên trên cùng để text luôn dễ đọc
            width: "80%", maxWidth: "800px",
            padding: "20px",
            background: "rgba(0, 0, 0, 0.4)", // Kính mờ đen nhạt lót đáy chữ
            borderRadius: "10px",
            backdropFilter: "blur(5px)", // Làm nhoè background sau chữ để rõ text
            border: "1px solid rgba(0, 255, 255, 0.2)",
            letterSpacing: "2px",
            lineHeight: "1.5"
        });
        document.body.appendChild(this.textDiv);
    }

    showText(text, duration = 3) { // Hàm đánh chữ phụ đề từng ký tự như máy đánh chữ
        // Hủy bỏ các chuỗi lệnh dở dang trước đó nhắm tránh lỗi nhảy phông
        gsap.killTweensOf(this.textDiv);
        
        // Reset văn bản thành chuỗi rỗng
        this.textDiv.innerText = "";
        
        const tl = gsap.timeline();
        
        // Hiện khung nền lên nhanh nhẹn trong ngần 0.3s
        tl.to(this.textDiv, { 
            opacity: 1, 
            duration: 0.3, 
            ease: "power2.out" 
        });

        const textObj = { length: 0 }; // Obect đệm để Tween nội suy từ 0 đến n
        // Tính nhịp gõ chữ nhanh gọn (Chiếm 50% thời gian tối đa)
        const typeDuration = Math.min(duration * 0.5, text.length * 0.05); 
        
        tl.to(textObj, {
            length: text.length,
            duration: typeDuration,
            ease: "none", // Tốc độ tuyến tính không bị mượt đầu tắt dần đuôi
            onUpdate: () => {
                // Kết xuất và thêm con trỏ "_" y hệt máy tính
                this.textDiv.innerText = text.substring(0, Math.floor(textObj.length)) + "_";
            },
            onComplete: () => {
                this.textDiv.innerText = text; // Xóa sổ dấu nháy đi
            }
        });
        
        // Fade out xoá mờ nền text
        const holdDuration = duration - 0.3 - typeDuration - 0.5; // Giữ trên màn hình đủ lâu để đọc
        tl.to(this.textDiv, { 
            opacity: 0, 
            duration: 0.5, 
            delay: holdDuration > 0 ? holdDuration : 0, 
            ease: "power2.in" 
        });
        
        return tl;
    }

    warningEffect() { // Hiệu ứng cảnh báo: Chớp nháy màn hình tĩnh điện và camera giật liên khúc
        gsap.to(this.flash, { // Chớp khung HTML Flash đỏ
            opacity: 0.6,
            duration: 0.1,
            yoyo: true, // Về lại tình trạng cũ
            repeat: 5 // Liên tiếp 5 lần
        });

        gsap.to(this.camera.position, { // Rung lắc cụm góc quay để hoảng loạn
            x: "+=0.2",
            y: "+=0.2",
            duration: 0.05,
            repeat: 10,
            yoyo: true
        });
    }

    createBlackHole(positionZ = 0) { // Đúc ra vật lý Hố Đen bằng mã lướt WebGL
        // Tạo lõi đen thăm thẳm
        const geo = new THREE.CircleGeometry(2, 64);
        const mat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
        this.blackHole = new THREE.Mesh(geo, mat);
        this.blackHole.position.set(0, 0, positionZ); // Ghim tọa độ Z ở mức định sẵn
        this.scene.add(this.blackHole);

        // Tạo vòng luồng bụi khí sáng quắc viền qua miệng lỗ đổ
        const glowGeo = new THREE.RingGeometry(2.1, 3.5, 64); // Chừa phần giữa hổng 2.1
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x111111,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.blackGlow = new THREE.Mesh(glowGeo, glowMat);
        this.blackGlow.position.set(0, 0, positionZ - 0.05); // Lùi nhẹ để tránh lỗi chập hình (Z-fighting)
        this.scene.add(this.blackGlow);

        this.blackHole.scale.set(0.01, 0.01, 0.01); // Ban đầu nhỏ xíu như cắn kiến
        this.blackGlow.scale.set(0.01, 0.01, 0.01);
    }

    triggerBlackHole(targetMesh, onComplete) { // Bật rạp phim HỐ ĐEN NHÂN ĐẠO (The Black Hole Trap)
        // Vứt hố đen ở tít phương trời xa (-50) để tạo điểm nhấn hút cực sâu
        if (!this.blackHole) this.createBlackHole(-50);

        const tl = gsap.timeline();

        // 1. Phóng to kích thước hố đen từ muôn trùng khơi cho lớn tới mức uy hiếp
        tl.to([this.blackHole.scale, this.blackGlow.scale], {
            x: 5, y: 5, z: 5, 
            duration: 1.0,
            ease: "power2.out"
        });

        // Loop vòng mặt hào quang nhấp nhóa cho cảm giác Event Horizon đang bẻ cong ko gian
        gsap.to(this.blackGlow.rotation, { z: "+=6", duration: 3, repeat: -1, ease: "none" });

        // 2. Chuyển Camera lia dậm lại núp bóng sau màng cánh tàu. (Cinematic Frame)
        tl.to(this.camera.position, {
            x: 0, y: 0.6, z: 2.5, // Gần rạp người dòm ngắm
            duration: 1.5,
            ease: "power2.inOut"
        }, "-=0.5");

        // 3. Gia tốc lực hút dồn tàu phóng trôi dạt về tâm điểm của lỗ mảng hổng không gian
        tl.to(targetMesh.position, {
            x: 0, y: 0, z: -50,
            duration: 1.2,
            ease: "power3.in"
        }, "+=0.3");

        // 4. Shrinking! Teo tóp vật lý hình khối để minh họa sự nghiền nát khoảng cách của Singularity
        tl.to(targetMesh.scale, {
            x: 0.0001, y: 0.0001, z: 0.0001,
            duration: 1.2,
            ease: "power3.in"
        }, "<");

        // Bóp cháy bảng phim = màn chói sáng lóa
        tl.to(this.whiteFlash, {
            opacity: 1,
            duration: 0.2,
        }, "-=0.1");

        // Cắn Scene (Scene Culling). Chờ đỉnh sáng chói nhất thì xóa dấu vết rác của Hố Đen hiện tại.
        tl.call(() => {
            this.scene.remove(this.blackHole);
            this.scene.remove(this.blackGlow);
            // Phục hồi lại tàu chuẩn gốc rễ từ (0,0) vì ta sắp sang cảnh Tunnel tiếp ngay sau Flash
            targetMesh.scale.set(0.01, 0.01, 0.01);
            targetMesh.position.set(0, 0, 0);

            // Bật Cảnh Bước Đệm Đường Ống (Quantum Jump)
            if (onComplete) onComplete(); 
        });

        // Thụt lùi từ từ lớp Flash để khai mở thị giác đường ống Tunnel mượt mà
        tl.to(this.whiteFlash, {
            opacity: 0,
            duration: 1.5
        });
    }

    runShortFilm(shots, onComplete) { // Hàm đạo diễn điều phối chuỗi Animation kể Lời Thoại Intro (Short Film)
        if (!shots || shots.length === 0) { // Chống rỗng tham số
            if (onComplete) onComplete();
            return;
        }

        const tl = gsap.timeline({
            onComplete: () => { // Thả tay lái khi rạp cuốn xong
                if (onComplete) onComplete();
            }
        });

        // Giải mã lệnh kịch bản trong Config và thực thi lần lươt
        shots.forEach((shot, index) => {
            const duration = shot.end - shot.start;
            
            // Xúc tiến hành trình chuyển trục bay góc quay Camera điện ảnh
            tl.to(this.camera.position, {
                x: shot.camera.pos[0],
                y: shot.camera.pos[1],
                z: shot.camera.pos[2],
                duration: 1.5,
                ease: "power2.inOut",
                onStart: () => {
                    // Update FOV (Mắt thấu kính zoom hẹp lại)
                    gsap.to(this.camera, {
                        fov: shot.camera.fov || 75,
                        duration: 1.5,
                        onUpdate: () => this.camera.updateProjectionMatrix() // Bắt buộc báo WebGL tính lại khung hình
                    });
                    
                    // Nạp vector mục tiêu muốn Camera xoay vào
                    const targetLook = new THREE.Vector3(...shot.camera.lookAt);
                    this.camera.userData.targetLook = targetLook;
                }
            }, shot.start);

            // Thả Phụ đề lên màn hình cùng lúc
            tl.call(() => {
                this.showText(shot.text, duration - 0.5); // Gọi hàm đánh chữ phụ đề
                if (shot.shake) this.warningEffect(); // Mở rung nếu shot yêu cầu kịch tính
            }, null, shot.start);

            // Nghỉ neo một khoản Time bằng với shot duration
            tl.to({}, { duration: duration }, shot.start);
        });

        // Update nháy mắt lấy nét liên thanh. Ngăn ngừa Camera đi hụt góc Focus khi đang di chuyển chéo.
        const lookAtUpdater = () => {
            if (this.camera.userData.targetLook) {
                this.camera.lookAt(this.camera.userData.targetLook);
            }
            if (tl.isActive()) requestAnimationFrame(lookAtUpdater);
        };
        lookAtUpdater();
    }

    startSpeedLines() {
        const lineCount = 3000;
        const geo = new THREE.BufferGeometry();
        const posArr = new Float32Array(lineCount * 3);
        const sizeArr = new Float32Array(lineCount);

        for (let i = 0; i < lineCount; i++) {
            // Rải điểm rộng ra hai bên màn hình
            posArr[i * 3] = (Math.random() - 0.5) * 80;
            posArr[i * 3 + 1] = (Math.random() - 0.5) * 80;
            posArr[i * 3 + 2] = -Math.random() * 300; // Chiều sâu Z hút vào trong
            // Kích thước các hạt ngẫu nhiên (Scale sẽ tùy thuộc camera perspective)
            sizeArr[i] = Math.random() * 2; 
        }

        geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        
        const mat = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.2, // Kích thước cơ bản, do Perspective tạo cảm giác to nhỏ
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.speedLines = new THREE.Points(geo, mat);
        this.scene.add(this.speedLines);
        this.isSpeedLinesActive = true;
        this.animateSpeedLines();
    }

    animateSpeedLines() {
        if (!this.isSpeedLinesActive || !this.speedLines) return;
        requestAnimationFrame(() => this.animateSpeedLines());
        
        const positions = this.speedLines.geometry.attributes.position.array;
        for (let i = 0; i < 3000; i++) {
            positions[i * 3 + 2] += 3.5; // Tốc độ lao tới camera
            // Nếu hạt vượt quá màn hình (Z > 10) thì reset lại vị trí ở xa xăm
            if (positions[i * 3 + 2] > 10) {
                positions[i * 3] = (Math.random() - 0.5) * 80;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
                positions[i * 3 + 2] = -300;
            }
        }
        this.speedLines.geometry.attributes.position.needsUpdate = true;
    }

    stopSpeedLines() {
        this.isSpeedLinesActive = false;
        if (this.speedLines) {
            this.scene.remove(this.speedLines);
            this.speedLines.geometry.dispose();
            this.speedLines.material.dispose();
            this.speedLines = null;
        }
    }

    startTunnelEffect(targetMesh, onComplete) {
        this.isTunnelActive = true;
        this.targetMesh = targetMesh; 
        this.tunnelLength = 300; // Khởi tạo lại độ sâu để spawn tia chớp
        this.tunnelGroup = new THREE.Group();
        this.scene.add(this.tunnelGroup);
        
        this.tunnelBlocks = [];

        const tunnelColors = [
            0xff1100, 0xff4400, 0xff8800, 0xffbb00, 0xff0055, 
            0xff00aa, 0xaa00ff, 0x5500ff, 0x00ffcc, 0x00ff77, 
            0xccff00, 0x00ffff, 0xff00ff, 0x77ff00
        ];

        // Hàm nhiễu tạo rãnh lượn sóng cho đường hầm, lặp hoàn hảo sau mỗi 300 units Z
        const loopDistortion = (theta, zPos) => {
            const phi = (zPos / 300) * Math.PI * 2;
            return Math.sin(theta * 5 + phi * 3) * 1.5 + Math.sin(theta * 8 - phi * 5) * 0.8;
        };

        const createPipeBlock = () => {
            const block = new THREE.Group();
            const segments = 100;

            // 1. Phông lưới ngang DÀY ĐẶC (300 Vòng Tròn đan sít nhau)
            for (let i = 0; i < 300; i++) {
                const z = -(i / 300) * 300;
                const points = [];
                for (let j = 0; j < segments; j++) {
                    const theta = (j / segments) * Math.PI * 2;
                    const r = 18 + loopDistortion(theta, z);
                    points.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
                }
                const curve = new THREE.CatmullRomCurve3(points, true);
                const geom = new THREE.TubeGeometry(curve, segments, 0.3, 5, true); // Tăng độ dày (0.08 -> 0.3) để viền to ra
                const colorHex = tunnelColors[Math.floor(Math.random() * tunnelColors.length)];
                // Giảm opacity (0.9 -> 0.2) kết hợp depthWrite: false để hòa trộn ánh sáng mềm mại, xóa viền cứng (làm loè màu)
                const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false });
                block.add(new THREE.Mesh(geom, mat));
            }

            // 2. Các chạc dọc làm mật độ cao hơn (50 khung dọc)
            for (let i = 0; i < 50; i++) {
                const theta = (i / 50) * Math.PI * 2;
                const points = [];
                for (let j = 0; j <= segments; j++) {
                    const z = -(j / segments) * 300; 
                    const r = 18 + loopDistortion(theta, z);
                    points.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
                }
                const curve = new THREE.CatmullRomCurve3(points, false);
                const geom = new THREE.TubeGeometry(curve, segments, 0.25, 5, false); // Tăng độ dày ống dọc
                const colorHex = tunnelColors[i % tunnelColors.length]; 
                // Xoá viền sắc nét, tạo cảm giác loè mờ ảo
                const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false });
                block.add(new THREE.Mesh(geom, mat));
            }

            // 3. Vỏ đậy vách đen cản phông ngoài không gian (Radius 24)
            const wallGeom = new THREE.CylinderGeometry(24, 24, 300, 24, 1, true);
            wallGeom.rotateX(Math.PI / 2);
            // Dịch Cylinder để bao trọn từ 0 đến -300
            const wallMat = new THREE.MeshBasicMaterial({ color: 0x010006, side: THREE.BackSide, fog: true });
            const wallMesh = new THREE.Mesh(wallGeom, wallMat);
            wallMesh.position.z = -150;
            block.add(wallMesh);

            return block;
        };

        // Tạo 3 Blocks luân phiên dịch chuyển vô hạn (900 units)
        for(let k = 0; k < 3; k++) {
            const block = createPipeBlock();
            block.position.z = 300 - k * 300; 
            this.tunnelGroup.add(block);
            this.tunnelBlocks.push(block);
        }

        // Tạo các tia chớp màu xanh lam siêu sáng ngập tràn (Speed Lines 3D)
        this.streaks = [];
        this.streaksGroup = new THREE.Group();
        this.streaksGroup.visible = false; 
        this.tunnelGroup.add(this.streaksGroup);

        const streakCount = 400; // Số lượng giảm lại bù cho độ dày to hơn
        // Dùng MeshBasic thay cho LineBasic để có màu sắc rực rỡ và đắp đè vệt lóa
        const streakMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x55ffff, 
            transparent: true, 
            opacity: 1.0,
            blending: THREE.AdditiveBlending 
        });

        this.resetStreak = (mesh) => {
            const angle = Math.random() * Math.PI * 2;
            const r = 4 + Math.random() * 22; // Nổi lềnh bềnh cả trong lẫn giữa hầm
            mesh.position.x = Math.cos(angle) * r;
            mesh.position.y = Math.sin(angle) * r;
            mesh.position.z = 100 - this.tunnelLength; 
        };

        for (let i = 0; i < streakCount; i++) {
            const length = 20 + Math.random() * 70; // Tia laser dài gấp chục lần
            // CylinderGeometry cho một khối Laser thực sự cộm và phát sáng mạnh
            const geom = new THREE.CylinderGeometry(0.15, 0.15, length, 4);
            geom.rotateX(Math.PI / 2); // Nằm ngang dọc ra theo chiều Z

            const mesh = new THREE.Mesh(geom, streakMaterial);

            this.resetStreak(mesh);
            mesh.position.z = 100 - Math.random() * this.tunnelLength;
            mesh.userData.speed = 3 + Math.random() * 5; // Tia chớp lao qua cực kỳ nhanh

            this.streaksGroup.add(mesh);
            this.streaks.push(mesh);
        }

        // Bật dải sáng speed lines sau 3 giây delay
        gsap.delayedCall(3.0, () => {
            if (this.isTunnelActive) {
                this.streaksGroup.visible = true;
            }
        });

        this.tunnelClock = new THREE.Clock();
        
        // --- XỬ LÝ CAMERA LIA QUANH TRỤC TÀU ---
        if (this.targetMesh) {
            gsap.to(this.targetMesh.position, { x: 0, y: 0, z: 0, duration: 0.5 });
            gsap.to(this.targetMesh.rotation, { x: 0, y: 0, z: 0, duration: 0.5 }); 
        }

        // Camera khởi điểm từ mũi tàu (Z = -6) nhìn hất ngược lại
        this.camera.position.set(-2, 1.0, -6);
        const eyeTarget = new THREE.Vector3(0, 0, 0); // Ban đầu liên tục khóa vào thân tàu

        const tlCam = gsap.timeline();
        
        // 1. Quét camera vòng ra mặt hông sườn tàu
        tlCam.to(this.camera.position, {
            x: -4.5, y: 0.8, z: -1.0,
            duration: 2.0,
            ease: "sine.inOut"
        });
        
        // 2. Chuyển lùi dần về hướng vị trí chuẩn (đằng sau tàu)
        tlCam.to(this.camera.position, {
            x: 0, y: 1.2, z: 6.0,
            duration: 2.5,
            ease: "sine.out"
        });

        // Loop theo dõi tàu
        const updateLookAt = () => {
            if (this.isTunnelActive && this.camera) {
                this.camera.lookAt(eyeTarget);
                requestAnimationFrame(updateLookAt);
            }
        };
        updateLookAt();

        // 3. Đổi hướng nhìn để xoay chiều lại khung cảnh
        gsap.to(eyeTarget, {
            x: 0, y: 0, z: -300, 
            duration: 1.0,
            delay: 3.5, 
            ease: "power2.inOut"
        });

        this.animateTunnel();

        // 8 Giây: Ngừng cuộn vô tận loop vòng hầm. Cho phép mặt sau của ống hầm lộ ra.
        // Tăng vọt tốc độ kéo giật nguyên khối ống dạt lùi nhanh về phía sau mô phỏng tàu lao ra khỏi ống
        gsap.delayedCall(8, () => {
            this.isExitingTunnel = true; 
            gsap.to(this.tunnelGroup.position, {
                z: "+=2000", // Kéo tụt nguyên cả cái đường ống vượt qua camera (camera ở số dương) cực nhanh
                duration: 2.0,
                ease: "power2.in"
            });
        });

        // Kết thúc tunnel sau khi đã xé ống tụt ra không gian vũ trụ thực sự phía sau
        gsap.delayedCall(10, () => {
            // Vẫn cần 1 cú chớp nhẹ để hợp thức sự thay đổi từ Intro sang GameLoop (mở khoá UI)
            gsap.to(this.whiteFlash, { opacity: 0.9, duration: 0.2, onComplete: () => {
                this.stopTunnelEffect();
                if (onComplete) onComplete();
                gsap.to(this.whiteFlash, { opacity: 0, duration: 1.5 });
            }});
        });
    }

    animateTunnel() {
        if (!this.isTunnelActive) return;
        requestAnimationFrame(() => this.animateTunnel());
        
        const delta = Math.min(this.tunnelClock.getDelta(), 0.1); 
        const elapsedTime = this.tunnelClock.getElapsedTime();

        // Logic chuyển tốc độ (a.js)
        let currentSpeed = 60; 
        if (elapsedTime <= 3) {
            currentSpeed = 5;
        } else if (elapsedTime <= 6) {
            currentSpeed = 15;
        } else if (elapsedTime <= 10) {
            currentSpeed = 115;
        }

        // Cập nhật Tịnh tiến 3 Block đường hầm. Chỉ loop nếu chưa Exit.
        this.tunnelBlocks.forEach(block => {
            block.position.z += currentSpeed * delta;
            // Nếu chưa thoát hầm thì khi qua mốc 600 sẽ quay vòng tuần hoàn vô tận
            if (!this.isExitingTunnel && block.position.z > 600) {
                block.position.z -= 900; 
            }
        });

        // Cập nhật tia speed lines
        this.streaks.forEach(streak => {
            streak.position.z += streak.userData.speed * currentSpeed * 2 * delta;
            
            if (streak.position.z > 100) {
                this.resetStreak(streak);
            }
        });

        // Rung lắc tàu (turbulence)
        if (this.targetMesh) {
            this.targetMesh.position.x = (Math.random() - 0.5) * 0.08;
            this.targetMesh.position.y = (Math.random() - 0.5) * 0.08;
        }
    }

    stopTunnelEffect() {
        this.isTunnelActive = false;
        if (this.tunnelGroup) {
            this.scene.remove(this.tunnelGroup);
            this.tunnelGroup = null;
        }
        if (this.targetMesh) {
            this.targetMesh.position.set(0, 0, 0); // Đưa tàu về quỹ đạo chuẩn
        }
    }
}
