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
        gsap.killTweensOf(this.textDiv);
        this.textDiv.innerText = "";
        const tl = gsap.timeline();
        tl.to(this.textDiv, { opacity: 1, duration: 0.3, ease: "power2.out" });
        const textObj = { length: 0 };
        const typeDuration = Math.min(duration * 0.5, text.length * 0.05);
        tl.to(textObj, {
            length: text.length,
            duration: typeDuration,
            ease: "none",
            onUpdate: () => {
                this.textDiv.innerText = text.substring(0, Math.floor(textObj.length)) + "_";
            },
            onComplete: () => {
                this.textDiv.innerText = text;
            }
        });
        const holdDuration = duration - 0.3 - typeDuration - 0.5;
        tl.to(this.textDiv, {
            opacity: 0,
            duration: 0.5,
            delay: holdDuration > 0 ? holdDuration : 0,
            ease: "power2.in"
        });
        return tl;
    }

    warningEffect() {
        gsap.to(this.flash, { opacity: 0.6, duration: 0.1, yoyo: true, repeat: 5 });
        gsap.to(this.camera.position, { x: "+=0.2", y: "+=0.2", duration: 0.05, repeat: 10, yoyo: true });
    }

    createBlackHole(positionZ = 0) {
        const geo = new THREE.CircleGeometry(2, 64);
        const mat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
        this.blackHole = new THREE.Mesh(geo, mat);
        this.blackHole.position.set(0, 0, positionZ);
        this.scene.add(this.blackHole);

        const glowGeo = new THREE.RingGeometry(2.1, 3.5, 64);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
        this.blackGlow = new THREE.Mesh(glowGeo, glowMat);
        this.blackGlow.position.set(0, 0, positionZ - 0.05);
        this.scene.add(this.blackGlow);

        this.blackHole.scale.set(0.01, 0.01, 0.01);
        this.blackGlow.scale.set(0.01, 0.01, 0.01);
    }

    triggerBlackHole(targetMesh, onComplete) {
        if (!this.blackHole) this.createBlackHole(-50);
        const tl = gsap.timeline();
        tl.to([this.blackHole.scale, this.blackGlow.scale], { x: 5, y: 5, z: 5, duration: 1.0, ease: "power2.out" });
        gsap.to(this.blackGlow.rotation, { z: "+=6", duration: 3, repeat: -1, ease: "none" });
        tl.to(this.camera.position, { x: 0, y: 3, z: 10, duration: 1, ease: "power2.inOut" }, "-=0.5");
        tl.to(targetMesh.position, { x: 0, y: 0, z: -50, duration: 1.2, ease: "power3.in" }, "+=0.3");
        tl.to(targetMesh.scale, { x: 0.0001, y: 0.0001, z: 0.0001, duration: 1.2, ease: "power3.in" }, "<");
        tl.to(this.whiteFlash, { opacity: 1, duration: 0.2 }, "-=0.1");
        tl.call(() => {
            this.scene.remove(this.blackHole);
            this.scene.remove(this.blackGlow);
            targetMesh.scale.set(0.01, 0.01, 0.01);
            targetMesh.position.set(0, 0, 0);
            if (onComplete) onComplete();
        });
        tl.to(this.whiteFlash, { opacity: 0, duration: 1.5 });
    }

    runShortFilm(shots, onComplete) {
        if (!shots || shots.length === 0) {
            if (onComplete) onComplete();
            return;
        }
        const tl = gsap.timeline({ onComplete: () => { if (onComplete) onComplete(); } });
        shots.forEach((shot) => {
            const duration = shot.end - shot.start;
            tl.to(this.camera.position, {
                x: shot.camera.pos[0], y: shot.camera.pos[1], z: shot.camera.pos[2],
                duration: 1.5, ease: "power2.inOut",
                onStart: () => {
                    gsap.to(this.camera, { fov: shot.camera.fov || 75, duration: 1.5, onUpdate: () => this.camera.updateProjectionMatrix() });
                    this.camera.userData.targetLook = new THREE.Vector3(...shot.camera.lookAt);
                }
            }, shot.start);
            tl.call(() => {
                this.showText(shot.text, duration - 0.5);
                if (shot.shake) this.warningEffect();
            }, null, shot.start);
            tl.to({}, { duration: duration }, shot.start);
        });
        const lookAtUpdater = () => {
            if (this.camera.userData.targetLook) this.camera.lookAt(this.camera.userData.targetLook);
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
            posArr[i * 3] = (Math.random() - 0.5) * 80;
            posArr[i * 3 + 1] = (Math.random() - 0.5) * 80;
            posArr[i * 3 + 2] = -Math.random() * 300;
            sizeArr[i] = Math.random() * 2;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        const mat = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.2, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
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
            positions[i * 3 + 2] += 3.5;
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
        this.tunnelGroup = new THREE.Group();
        this.scene.add(this.tunnelGroup);

        // 1. Tạo texture phát sáng
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.1, 'rgba(100, 255, 255, 0.8)');
        grad.addColorStop(0.3, 'rgba(0, 100, 255, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        const glowTex = new THREE.CanvasTexture(canvas);

        // 2. Lõi trung tâm
        const coreMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xccffff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
        this.warpCore = new THREE.Sprite(coreMat);
        this.warpCore.scale.set(30, 30, 1); // Tiếp tục thu nhỏ lõi (45 -> 30) và giảm opacity (0.8 -> 0.4)
        this.warpCore.position.z = -250;
        this.tunnelGroup.add(this.warpCore);

        // 3. Mây tinh vân
        this.warpClouds = new THREE.Group();
        this.tunnelGroup.add(this.warpClouds);
        for (let i = 0; i < 30; i++) { // Giảm số lượng tinh vân (40 -> 30)
            const isBlue = Math.random() > 0.5;
            const cloudMat = new THREE.SpriteMaterial({ map: glowTex, color: isBlue ? 0x00aaff : 0x00ffcc, transparent: true, opacity: 0.05 + Math.random() * 0.05, blending: THREE.AdditiveBlending, depthWrite: false });
            const cloud = new THREE.Sprite(cloudMat);
            cloud.scale.set(40 + Math.random() * 60, 40 + Math.random() * 60, 1);
            cloud.userData = { angle: Math.random() * Math.PI * 2, radius: 10 + Math.random() * 40, z: -Math.random() * 400, speed: 0.5 + Math.random() * 1.5, rotSpeed: (Math.random() - 0.5) * 0.02 };
            this.warpClouds.add(cloud);
        }

        // 4. Vệt sáng (Streaks)
        const streakCount = 1200; // Tăng thêm số lượng tia sáng
        // Dùng OctahedronGeometry (hình bát diện) và scale dài ra sẽ được hình kim nhọn 2 đầu
        const streakGeo = new THREE.OctahedronGeometry(0.5, 0); 
        const streakColors = [0xffffff, 0xffffff, 0xffffff, 0xffffff, 0x00ffff, 0x00aaff]; // Tăng tỷ lệ tia trắng (4 trắng : 2 xanh)
        this.warpStreaksGroups = []; 
        this.streakData = []; 
        streakColors.forEach((colorHex) => {
            // Tăng opacity lên 0.9 để tia sáng cực kỳ chói lọi
            const isWhite = colorHex === 0xffffff;
            const mat = new THREE.MeshBasicMaterial({ 
                color: colorHex, 
                transparent: true, 
                opacity: isWhite ? 1.0 : 0.8, // Tia trắng để tối đa 1.0 cho cực sáng
                blending: THREE.AdditiveBlending, 
                depthWrite: false 
            }); 
            const instMesh = new THREE.InstancedMesh(streakGeo, mat, Math.floor(streakCount / streakColors.length));
            this.tunnelGroup.add(instMesh);
            this.warpStreaksGroups.push(instMesh);
        });
        const dummy = new THREE.Object3D();
        this.warpStreaksGroups.forEach((instMesh, gIdx) => {
            for (let i = 0; i < instMesh.count; i++) {
                const radius = 3 + Math.random() * 60;
                const angle = Math.random() * Math.PI * 2;
                const z = -Math.random() * 300;
                dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
                
                // Scale hình kim: hẹp ngang (0.1) và rất dài theo chiều Z (15-40) để nhọn 2 đầu
                const lengthScale = 15 + Math.random() * 25; 
                dummy.scale.set(0.12, 0.12, lengthScale);
                dummy.updateMatrix();
                instMesh.setMatrixAt(i, dummy.matrix);
                this.streakData.push({ meshIndex: i, groupIndex: gIdx, radius, angle, z, speed: 5 + Math.random() * 8, lengthScale });
            }
            instMesh.instanceMatrix.needsUpdate = true;
        });

        if (this.targetMesh) {
            gsap.to(this.targetMesh.position, { x: 0, y: -0.5, z: 2, duration: 1.0, ease: "power2.out" });
            gsap.to(this.targetMesh.rotation, { x: 0.1, y: 0, z: 0, duration: 1.0 });
        }
        this.camera.position.set(0, 1.5, 7);
        this.warpCameraTarget = new THREE.Vector3(0, 0, -250);
        this.warpSpeedMultiplier = 0;
        gsap.to(this, { warpSpeedMultiplier: 4, duration: 3, delay: 0.5, ease: "power3.in" });
        this.shakeAmp = 0;
        gsap.to(this, { shakeAmp: 0.12, duration: 3, delay: 1, ease: "power2.in" });

        this.animateTunnel();

        gsap.delayedCall(7, () => {
            gsap.to(this, { warpSpeedMultiplier: 0.1, duration: 1.5, shakeAmp: 0, ease: "power2.out" });
            gsap.to(this.whiteFlash, {
                opacity: 1, duration: 0.5, delay: 1.0, onComplete: () => {
                    this.stopTunnelEffect();
                    if (onComplete) onComplete();
                    gsap.to(this.whiteFlash, { opacity: 0, duration: 1.5 });
                }
            });
        });
    }

    animateTunnel() {
        if (!this.isTunnelActive) return;
        requestAnimationFrame(() => this.animateTunnel());
        const dummy = new THREE.Object3D();
        this.streakData.forEach((data) => {
            data.z += data.speed * this.warpSpeedMultiplier;
            data.angle += 0.01 * this.warpSpeedMultiplier;
            if (data.z > 20) { data.z = -300 - Math.random() * 50; data.radius = 3 + Math.random() * 60; }
            dummy.position.set(Math.cos(data.angle) * data.radius, Math.sin(data.angle) * data.radius, data.z);
            // Tia trắng và cyan (groupIndex < 3) sẽ to hơn một chút để trông sáng hơn
            const sizeScale = data.groupIndex < 3 ? 0.16 : 0.12; 
            dummy.scale.set(
                sizeScale * Math.max(0.5, 1 - this.warpSpeedMultiplier * 0.1),
                sizeScale * Math.max(0.5, 1 - this.warpSpeedMultiplier * 0.1),
                data.lengthScale * (1 + this.warpSpeedMultiplier * 0.5)
            );
            dummy.updateMatrix();
            this.warpStreaksGroups[data.groupIndex].setMatrixAt(data.meshIndex, dummy.matrix);
        });
        this.warpStreaksGroups.forEach(mesh => mesh.instanceMatrix.needsUpdate = true);
        this.warpClouds.children.forEach(cloud => {
            cloud.userData.z += cloud.userData.speed * this.warpSpeedMultiplier;
            cloud.material.rotation += cloud.userData.rotSpeed;
            if (cloud.userData.z > 20) { cloud.userData.z = -250 - Math.random() * 100; cloud.userData.radius = 10 + Math.random() * 40; cloud.userData.angle = Math.random() * Math.PI * 2; }
            cloud.position.set(Math.cos(cloud.userData.angle) * cloud.userData.radius, Math.sin(cloud.userData.angle) * cloud.userData.radius, cloud.userData.z);
            cloud.scale.y = cloud.scale.x * (1 + this.warpSpeedMultiplier * 0.1);
        });
        if (this.warpCore) {
            this.warpCore.material.rotation -= 0.005;
            const corePulse = 80 + Math.random() * 15 * this.warpSpeedMultiplier;
            this.warpCore.scale.set(corePulse, corePulse, 1);
        }
        if (this.camera && this.shakeAmp > 0) {
            this.camera.position.x += ((Math.random() - 0.5) * this.shakeAmp - this.camera.position.x) * 0.5;
            this.camera.position.y += (1.5 + (Math.random() - 0.5) * this.shakeAmp - this.camera.position.y) * 0.5;
        }
        if (this.targetMesh && this.shakeAmp > 0) {
            this.targetMesh.position.x = (Math.random() - 0.5) * this.shakeAmp * 0.5;
            this.targetMesh.position.y = -0.5 + (Math.random() - 0.5) * this.shakeAmp * 0.5;
        }
        this.camera.lookAt(this.warpCameraTarget);
    }

    stopTunnelEffect() {
        this.isTunnelActive = false;
        if (this.tunnelGroup) {
            this.warpStreaksGroups.forEach(mesh => { mesh.geometry.dispose(); mesh.material.dispose(); });
            this.scene.remove(this.tunnelGroup);
            this.tunnelGroup = null;
        }
        if (this.targetMesh) { this.targetMesh.position.set(0, 0, 0); this.targetMesh.rotation.set(0, 0, 0); }
    }
}
