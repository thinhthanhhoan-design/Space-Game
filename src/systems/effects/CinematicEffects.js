import * as THREE from 'three';
import gsap from 'gsap';

export class CinematicEffects { // Lớp quản lý các hiệu ứng điện ảnh và chuyển cảnh
    constructor(scene, camera) { // Khởi tạo với scene và camera hiện tại
        this.scene = scene; // Lưu tham chiếu cảnh 3D
        this.camera = camera; // Lưu tham chiếu góc máy quay
        this.flash = null; // Biến DOM Div cho hiệu ứng chớp đỏ báo động
        this.whiteFlash = null; // Biến DOM Div cho hiệu ứng chớp trắng loá mắt
        this.textDiv = null; // Biến DOM Div cho hiệu ứng gõ chữ phụ đề kịch bản
        this.blackHoleGroup = null; // Nhóm chứa toàn bộ thực thể hố đen

        this.initDOM(); // Gắn các thẻ HTML ảo dọn đường sẵn vào body
    }

    createGlowTexture(colorStr = 'rgba(255, 255, 255, 1)') {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, colorStr);
        grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.6)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
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

    createBlackHole() {
        if (this.blackHoleGroup) {
            this.scene.remove(this.blackHoleGroup);
        }

        const group = new THREE.Group();

        // 1. Lõi cầu đen đặc (Event Horizon)
        const coreGeo = new THREE.SphereGeometry(3.5, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        // 2. Hệ thống đốm trắng rực rỡ (Super Dense Star Field)
        // 20.000 hạt để tạo độ phủ dày đặc và sắc nét
        const particleCount = 20000;
        const geo = new THREE.BufferGeometry();
        const posArr = new Float32Array(particleCount * 3);
        const sizeArr = new Float32Array(particleCount);

        this.particleData = {
            pos: posArr,
            geo: geo,
            data: []
        };

        for (let i = 0; i < particleCount; i++) {
            // Phân bổ mật độ: Dày ở viền (3.5) và thưa dần ra ngoài
            const angle = Math.random() * Math.PI * 2;
            // Dùng hàm mũ để ép các hạt tập trung vào tâm
            const radius = 3.5 + Math.pow(Math.random(), 2.0) * 45;
            const z = (Math.random() - 0.5) * 2; // Độ dày mỏng của đĩa

            posArr[i * 3] = Math.cos(angle) * radius;
            posArr[i * 3 + 1] = Math.sin(angle) * radius;
            posArr[i * 3 + 2] = z;

            sizeArr[i] = 0.2 + Math.random() * 0.5;

            this.particleData.data.push({
                angle: angle,
                radius: radius,
                z: z,
                speed: 0.005 + (1 / radius) * 0.05, // Xoáy nhanh hơn khi ở gần tâm
                radialSpeed: 0.01 + Math.random() * 0.02
            });
        }

        geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizeArr, 1));

        const mat = new THREE.PointsMaterial({
            size: 0.6,
            map: this.createGlowTexture('rgba(255, 255, 255, 1)'),
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false, // Để hạt luôn hiện rõ trên nền đen
            sizeAttenuation: true
        });

        const particles = new THREE.Points(geo, mat);
        particles.frustumCulled = false; // Chống mất hạt khi xoay camera
        group.add(particles);

        this.blackHoleGroup = group;

        // Đặt hố đen ngay trước mắt camera (cách 60 đơn vị)
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        this.blackHoleGroup.position.copy(this.camera.position).add(camDir.multiplyScalar(60));
        this.blackHoleGroup.lookAt(this.camera.position);

        this.scene.add(this.blackHoleGroup);
        this.blackHoleGroup.scale.set(0.01, 0.01, 0.01);
    }

    triggerBlackHole(targetMesh, onComplete) {
        this.createBlackHole();
        const tl = gsap.timeline();

        // Hiệu ứng hạt xoáy vào tâm (Inward Suction)
        const animateVortex = () => {
            if (!this.blackHoleGroup) return;
            const { pos, data, geo } = this.particleData;
            for (let i = 0; i < data.length; i++) {
                const p = data[i];
                p.angle += p.speed;
                p.radius -= p.radialSpeed;

                // Khi hạt bị "nuốt" vào tâm, tái sinh ở ngoài xa
                if (p.radius < 3.5) {
                    p.radius = 40 + Math.random() * 10;
                    p.angle = Math.random() * Math.PI * 2;
                }

                pos[i * 3] = Math.cos(p.angle) * p.radius;
                pos[i * 3 + 1] = Math.sin(p.angle) * p.radius;
                pos[i * 3 + 2] = p.z;
            }
            geo.attributes.position.needsUpdate = true;
            if (this.blackHoleGroup) requestAnimationFrame(animateVortex);
        };
        animateVortex();

        // Phóng to hố đen và hút tàu
        tl.to(this.blackHoleGroup.scale, { x: 10, y: 10, z: 10, duration: 2.5, ease: "power2.out" });
        tl.to(targetMesh.position, {
            x: this.blackHoleGroup.position.x,
            y: this.blackHoleGroup.position.y,
            z: this.blackHoleGroup.position.z,
            duration: 2.0, ease: "power3.in"
        }, "+=0.5");
        tl.to(targetMesh.scale, { x: 0.0001, y: 0.0001, z: 0.0001, duration: 2.0, ease: "power3.in" }, "<");

        tl.to(this.whiteFlash, { opacity: 1, duration: 0.5 }, "-=0.3");
        tl.call(() => {
            if (this.blackHoleGroup) {
                this.scene.remove(this.blackHoleGroup);
                this.blackHoleGroup = null;
            }
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
        const mat = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.15, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
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
        grad.addColorStop(0, 'rgba(180, 230, 255, 0.6)'); // Softer center
        grad.addColorStop(0.2, 'rgba(50, 150, 255, 0.3)');
        grad.addColorStop(0.6, 'rgba(0, 50, 150, 0.1)');
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
            const cloudMat = new THREE.SpriteMaterial({
                map: glowTex,
                color: isBlue ? 0x0088ff : 0x00ccaa, // Less bright colors
                transparent: true,
                opacity: 0.02 + Math.random() * 0.04, // Lower opacity (0.05 -> 0.02)
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
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
                opacity: 0.8, // Sửa dấu chấm phẩy thành dấu phẩy ở đây
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
