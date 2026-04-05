import * as THREE from 'three';
import gsap from 'gsap';

export class Intro {
    constructor(sceneController) {
        this.sceneController = sceneController;
        
        this.logoMesh = null;
        this.particleSystem = null;
        
        this.originalPositions = null;
        this.explosionTargets = null;
        this.particlesGeometry = null;
        
        this.isIntroActive = true;
    }

    init(callback) {
        const scene = this.sceneController.scene;
        const camera = this.sceneController.camera;
        const startBtn = document.getElementById('start-btn');
        
        const createCircleTexture = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
            gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
            return new THREE.CanvasTexture(canvas);
        };
        const particleTexture = createCircleTexture();

        const loader = new THREE.TextureLoader();
        // Load từ public/textures/Logo.webp linh hoạt bằng import.meta.url
        const logoUrl = new URL('../../../public/textures/Logo.webp', import.meta.url).href;
        loader.load(logoUrl, (texture) => {
            const image = texture.image;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            const canvasWidth = 250; 
            const canvasHeight = (image.height / image.width) * canvasWidth;
            canvas.width = canvasWidth; canvas.height = canvasHeight;
            ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);

            const planeGeom = new THREE.PlaneGeometry(canvasWidth * 1.5, canvasHeight * 1.5);
            const planeMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, depthWrite: false });
            this.logoMesh = new THREE.Mesh(planeGeom, planeMat);
            scene.add(this.logoMesh);

            const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
            const positionsArr = [];
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

            this.originalPositions = new Float32Array(positionsArr);
            this.explosionTargets = new Float32Array(targetsArr);

            this.particlesGeometry = new THREE.BufferGeometry();
            this.particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArr, 3));
            this.particlesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsArr, 3));

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

            gsap.to(planeMat, { opacity: 1, duration: 2, ease: "power2.inOut" });
            if(startBtn) {
                gsap.to(startBtn, { opacity: 1, duration: 1.5, delay: 1.5, onComplete: () => {
                    startBtn.style.pointerEvents = 'auto'; 
                }});
            }
        });

        if(startBtn) {
            startBtn.addEventListener('click', () => {
                gsap.to(startBtn, { opacity: 0, scale: 0.8, duration: 0.4, onComplete: () => startBtn.style.display = 'none' });
                if (!this.particlesGeometry || !this.logoMesh) return;
                scene.remove(this.logoMesh);
                scene.add(this.particleSystem); 

                const positionsAttribute = this.particlesGeometry.attributes.position;
                const currentPositions = positionsAttribute.array;
                const animObj = { progress: 0 };

                gsap.to(animObj, {
                    progress: 1, duration: 2.5, ease: "power3.inOut",
                    onUpdate: () => {
                        for (let i = 0; i < currentPositions.length; i++) {
                            currentPositions[i] = THREE.MathUtils.lerp(this.originalPositions[i], this.explosionTargets[i], animObj.progress);
                        }
                        positionsAttribute.needsUpdate = true;
                    }
                });

                gsap.to(camera.position, {
                    z: -60, duration: 3, ease: "power2.in",
                    onComplete: () => {
                        this.isIntroActive = false;
                        if (callback) callback(this.particleSystem);
                    }
                });
            });
        }
    }

    update(elapsedTime) {
        if (!this.isIntroActive) return;
        const floatY = Math.sin(elapsedTime * 0.5) * 5;
        const floatRotY = Math.sin(elapsedTime * 0.2) * 0.1;
        if (this.logoMesh) { this.logoMesh.position.y = floatY; this.logoMesh.rotation.y = floatRotY; }
        if (this.particleSystem) { this.particleSystem.position.y = floatY; this.particleSystem.rotation.y = floatRotY; }
    }

    startTransition(logoParticles, playerModel, cam, onComplete) {
        if (!logoParticles || !playerModel) {
            if (onComplete) onComplete();
            return;
        }

        const targetPositions = [];
        
        playerModel.updateMatrixWorld(true);
        playerModel.traverse((child) => {
            if (child.isMesh) {
                const positions = child.geometry.attributes.position.array;
                const matrix = child.matrixWorld; 
                
                for (let i = 0; i < positions.length; i += 3) {
                    const v = new THREE.Vector3(positions[i], positions[i+1], positions[i+2]);
                    v.applyMatrix4(matrix); 
                    targetPositions.push(v.x, v.y, v.z);
                }
            }
        });

        const positionsAttribute = logoParticles.geometry.attributes.position;
        const particlePositions = positionsAttribute.array;
        
        const explosionPositions = new Float32Array(particlePositions);
        const animObj = { progress: 0 };

        const tl = gsap.timeline();

        tl.to(animObj, {
            progress: 1,
            duration: 4.5,
            ease: "expo.inOut", 
            onUpdate: () => {
                for (let i = 0; i < particlePositions.length; i += 3) {
                    if (targetPositions.length === 0) break;
                    
                    const targetIdx = (i % targetPositions.length);
                    const validIdx = targetIdx - (targetIdx % 3);
                    
                    const tx = targetPositions[validIdx];
                    const ty = targetPositions[validIdx + 1];
                    const tz = targetPositions[validIdx + 2];

                    if(tx !== undefined) particlePositions[i] = THREE.MathUtils.lerp(explosionPositions[i], tx, animObj.progress);
                    if(ty !== undefined) particlePositions[i+1] = THREE.MathUtils.lerp(explosionPositions[i+1], ty, animObj.progress);
                    if(tz !== undefined) particlePositions[i+2] = THREE.MathUtils.lerp(explosionPositions[i+2], tz, animObj.progress);
                }
                positionsAttribute.needsUpdate = true;
            }
        });

        tl.to(cam.position, { z: -10, duration: 3.5, ease: "power2.inOut" }, "<");

        tl.call(() => {
            logoParticles.visible = false;
            playerModel.visible = true;
            
            gsap.to(cam.position, { x: 0, y: 2, z: 8, duration: 2, ease: "power2.out", onComplete: () => {
                if (onComplete) onComplete();
            }});
        });
    }
}
