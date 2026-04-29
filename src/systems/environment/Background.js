import * as THREE from 'three';

export class Background {
    constructor() {
        this.scene = null;
        this.group = null;
        this.starsGlow = null;
        this.whiteStars = null;
        this.crossStars = null;
        this.shootingStars = null;
    }

    init(scene, texturePath = '/textures/background.png') {
        this.scene = scene;
        scene.background = new THREE.Color(0x00102a);

        this.group = new THREE.Group();
        scene.add(this.group);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(texturePath, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.mapping = THREE.EquirectangularReflectionMapping;

            const bgGeometry = new THREE.SphereGeometry(600, 60, 40);
            bgGeometry.scale(-1, 1, 1);

            const bgMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                color: 0x222233,
                transparent: true,
                opacity: 0.4
            });

            const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
            this.group.add(bgMesh);
        });

        const createGlowPoint = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');

            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.15, 'rgba(0, 255, 255, 0.8)');
            gradient.addColorStop(0.4, 'rgba(0, 80, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(canvas);
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

            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(cx - 20, cy - 20, 40, 40);

            const flareColor = 'rgba(220, 240, 255, 0.9)';

            const verticalGradient = ctx.createLinearGradient(cx, 0, cx, 128);
            verticalGradient.addColorStop(0, 'rgba(0,0,0,0)');
            verticalGradient.addColorStop(0.5, flareColor);
            verticalGradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = verticalGradient;
            ctx.fillRect(cx - 1.5, 0, 3, 128);

            const horizontalGradient = ctx.createLinearGradient(0, cy, 128, cy);
            horizontalGradient.addColorStop(0, 'rgba(0,0,0,0)');
            horizontalGradient.addColorStop(0.5, flareColor);
            horizontalGradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = horizontalGradient;
            ctx.fillRect(0, cy - 1.5, 128, 3);

            return new THREE.CanvasTexture(canvas);
        };

        const fillPositions = (array, count) => {
            for (let i = 0; i < count * 3; i += 3) {
                array[i] = (Math.random() - 0.5) * 1600;
                array[i + 1] = (Math.random() - 0.5) * 1600;
                array[i + 2] = -1000 + (Math.random() * 800);
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

        const pointsCount = 6000;
        const pointsPosition = new Float32Array(pointsCount * 3);
        fillPositions(pointsPosition, pointsCount);
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointsPosition, 3));
        this.starsGlow = new THREE.Points(pointsGeometry, pointsMaterial);
        this.group.add(this.starsGlow);

        const whiteGeometry = new THREE.BufferGeometry();
        const whiteMaterial = new THREE.PointsMaterial({
            size: 3.5,
            map: createWhiteGlowPoint(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });

        const whiteCount = 5000;
        const whitePosition = new Float32Array(whiteCount * 3);
        fillPositions(whitePosition, whiteCount);
        whiteGeometry.setAttribute('position', new THREE.BufferAttribute(whitePosition, 3));
        this.whiteStars = new THREE.Points(whiteGeometry, whiteMaterial);
        this.group.add(this.whiteStars);

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

        const createShootingStarTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            const gradient = ctx.createLinearGradient(0, 0, 0, 256);
            gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.1, 'rgba(150, 255, 255, 1)');
            gradient.addColorStop(0.5, 'rgba(0, 100, 255, 0.4)');
            gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 16, 256);

            return new THREE.CanvasTexture(canvas);
        };
        const starTexture = createShootingStarTexture();

        this.shootingStars = [];
        for (let i = 0; i < 5; i++) {
            const geo = new THREE.CylinderGeometry(3.5, 0.1, 400, 8);
            geo.rotateX(Math.PI / 2);
            const mat = new THREE.MeshBasicMaterial({
                map: starTexture,
                color: 0xffffff, 
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide,
                fog: false
            });
            const star = new THREE.Mesh(geo, mat);
            star.visible = false;
            this.group.add(star);
            
            this.shootingStars.push({
                mesh: star,
                active: false,
                dir: new THREE.Vector3(),
                speed: 0
            });
        }
    }

    update(delta = 0.016, targetPos = null) {
        if (targetPos && this.group) {
            // Khóa vị trí nền vào tàu và áp dụng hiệu ứng Parallax
            this.group.position.x = targetPos.x;
            this.group.position.y = targetPos.y;

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
            const positions = points.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 2] += speed * delta * 60;
                if (positions[i + 2] > -200) {
                    positions[i + 2] -= 800;
                }
            }
            points.geometry.attributes.position.needsUpdate = true;
        };

        moveStars(this.starsGlow, 2.0);
        moveStars(this.whiteStars, 4.0);
        moveStars(this.crossStars, 6.5);

        if (Math.random() < 0.005 && this.shootingStars) {
            const inactiveStar = this.shootingStars.find(s => !s.active);
            if (inactiveStar) {
                inactiveStar.active = true;
                inactiveStar.mesh.visible = true;
                inactiveStar.mesh.material.opacity = 0.8 + Math.random() * 0.2;
                
                const signX = Math.random() > 0.5 ? 1 : -1;
                const signY = Math.random() > 0.5 ? 1 : -1;
                
                const startX = signX * (200 + Math.random() * 800); 
                const startY = signY * (150 + Math.random() * 650); 
                const startZ = -1500 - Math.random() * 1000;
                
                inactiveStar.mesh.position.set(startX, startY, startZ); 
                inactiveStar.dir.set(0, 0, 1); 
                inactiveStar.mesh.rotation.set(0, 0, 0);
                inactiveStar.speed = 3000 + Math.random() * 1500; 
            }
        }

        if (this.shootingStars) {
            this.shootingStars.forEach(star => {
                if (star.active) {
                    star.mesh.position.addScaledVector(star.dir, star.speed * delta);
                    star.mesh.material.opacity -= delta * 0.8;
                    
                    if (star.mesh.material.opacity <= 0 || 
                        star.mesh.position.z > 200 || 
                        Math.abs(star.mesh.position.x) > 2500 || 
                        Math.abs(star.mesh.position.y) > 2000) {
                        
                        star.active = false;
                        star.mesh.visible = false;
                    }
                }
            });
        }
    }

    setRoll(targetRoll, smoothness) {
        if (this.group) {
            this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, targetRoll, smoothness);
        }
    }
}
