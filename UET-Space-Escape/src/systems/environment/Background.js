import * as THREE from 'three';

export class Background {
    constructor() {
        this.scene = null;
        this.group = null;
        this.starsGlow = null;
        this.cloudsGroup = null;
    }
    
    init(scene, texturePath = '/textures/background.png') {
        this.scene = scene;
        scene.background = new THREE.Color(0x020205); 

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

        const pointsGeometry = new THREE.BufferGeometry();
        const pointsMaterial = new THREE.PointsMaterial({
            size: 4.5,
            map: createGlowPoint(),
            transparent: true,
            blending: THREE.AdditiveBlending, 
            depthWrite: false, 
        });

        const pointsCount = 1200;
        const pointsPosition = new Float32Array(pointsCount * 3);
        for(let i = 0; i < pointsCount * 3; i++) {
            pointsPosition[i] = (Math.random() - 0.5) * 600;
        }
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointsPosition, 3));
        this.starsGlow = new THREE.Points(pointsGeometry, pointsMaterial);
        this.group.add(this.starsGlow);

        const createCloudTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            gradient.addColorStop(0, 'rgba(120, 50, 255, 0.15)');
            gradient.addColorStop(0.5, 'rgba(50, 150, 255, 0.05)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 256);
            return new THREE.CanvasTexture(canvas);
        };

        const cloudTexture = createCloudTexture();
        const cloudGeo = new THREE.PlaneGeometry(150, 150);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false, 
            side: THREE.DoubleSide
        });

        this.cloudsGroup = new THREE.Group();
        this.group.add(this.cloudsGroup);

        for(let i = 0; i < 80; i++) {
            const cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
            
            const r = 80 + Math.random() * 200;
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.random() * Math.PI;
            cloud.position.x = r * Math.sin(phi) * Math.cos(theta);
            cloud.position.y = r * Math.sin(phi) * Math.sin(theta);
            cloud.position.z = r * Math.cos(phi);
            
            cloud.rotation.x = Math.random() * Math.PI;
            cloud.rotation.y = Math.random() * Math.PI;
            cloud.rotation.z = Math.random() * Math.PI;
            
            this.cloudsGroup.add(cloud);
        }
    }

    update() {
        if (this.starsGlow) {
            this.starsGlow.rotation.y += 0.00008;
            this.starsGlow.rotation.x -= 0.00004;
        }
        if (this.cloudsGroup) {
            this.cloudsGroup.rotation.y -= 0.0001;
            this.cloudsGroup.rotation.z += 0.00005;
            this.cloudsGroup.children.forEach(cloud => {
                cloud.rotation.z += 0.00015;
            });
        }
    }

    setRoll(targetRoll, smoothness) {
        if (this.group) {
            this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, targetRoll, smoothness);
        }
    }
}
