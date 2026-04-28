export class Story {
    constructor() {
        this.texts = [
            "Boss: KẺ HỦY DIỆT - V1 đã bị tiêu diệt...",
            "Nhưng vẫn tồn tại tín hiệu dị thường trong không gian.",
            "Phi công, hãy chuẩn bị!",
            "Một mối đe dọa mới đang thức tỉnh...",
        ];

        this.currentIndex = 0;
        this.isPlaying = false;

        this.createUI();
    }

    createUI() {
        if (this.container) return;
        this.container = document.createElement('div');

        // POSITION giống HUD
        this.container.style.pointerEvents = 'none'; // Player không bấm nhầm vào div này
        this.container.style.whiteSpace = 'nowrap';  // Tránh chữ bị nhảy dòng nếu quá dài
        this.container.style.position = 'absolute';
        this.container.style.top = '60px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';

        // SIZE + PADDING
        this.container.style.padding = '15px 40px';
        this.container.style.borderRadius = '18px';
        this.container.style.minWidth = '600px';

        // NỀN BLUR
        this.container.style.background = 'rgba(0, 25, 45, 0.55)';
        this.container.style.backdropFilter = 'blur(6px)';

        // VIỀN NEON
        this.container.style.border = '1.5px solid rgba(0, 255, 255, 0.35)';
        this.container.style.boxShadow = `
            0 0 12px rgba(0,255,255,0.25),
            inset 0 0 12px rgba(0,255,255,0.15)
        `;

        // TEXT STYLE
        this.container.style.color = '#c8f6ff';
        this.container.style.fontSize = '20px';
        this.container.style.fontWeight = '500';
        this.container.style.letterSpacing = '2px';
        this.container.style.textAlign = 'center';
        this.container.style.textShadow = '0 0 8px rgba(0,255,255,0.6)';

        // FONT SCI-FI
        this.container.style.fontFamily = 'Orbitron, Arial, sans-serif';

        // Animation
        this.container.style.opacity = '0';
        this.container.style.transition = 'opacity 0.5s ease';

        this.container.style.zIndex = '9999';

        document.body.appendChild(this.container);
    }

    // Thêm tham số onComplete vào hàm play
    play(onComplete) {
        this.isPlaying = true;
        this.onCompleteCallback = onComplete;
        this.currentIndex = 0;
        this.showNext();
    }

    showNext() {
        if (this.currentIndex >= this.texts.length) {
            this.hide();
            this.isPlaying = false;
            // Kiểm tra xem GameManager có dặn làm gì tiếp theo không
            if (this.onCompleteCallback) {
                this.onCompleteCallback(); // Kích hoạt hành động tiếp theo
                this.onCompleteCallback = null; // Xóa để tránh gọi lại lần sau
            }
            return;
        }

        this.container.innerText = this.texts[this.currentIndex];
        this.container.style.opacity = '1';

        setTimeout(() => {
            this.container.style.opacity = '0';

            setTimeout(() => {
                this.currentIndex++;
                this.showNext();
            }, 500);

        }, 2000);
    }

    hide() {
        this.container.style.opacity = '0';
    }

    // --- HAPPY ENDING CINEMATIC ---
    playVictoryEnding(onComplete) {
        this.isPlaying = true;
        const originalTexts = [...this.texts];

        // Nội dung chúc mừng chiến thắng
        this.texts = [
            "Lõi năng lượng của chúa tể bóng tối đã vỡ vụn...",
            "Hệ thống quét cho thấy không gian đang dần ổn định.",
            "Tín hiệu lạ đã biến mất.",
            "Chúc mừng phi công, bạn đã sống sót!",
            "Tàu UETE-3637 đang trở về căn cứ...",
        ];

        this.currentIndex = 0;
        
        // Gán callback để sau khi chạy hết text sẽ hiện EndingUI
        this.onCompleteCallback = () => {
            this.texts = originalTexts; // Trả lại text gốc
            if (onComplete) onComplete();
        };

        this.showNext();
    }

    // CUTSCENE LEVEL 3 
        playLevel3Intro(game) {
            this.isPlaying = true;

            console.log("Tiến vào LEVEL 3!");
            
            //  DỌN SẠCH MÀN
            game.enemyManager.clearAllEnemies();
            game.asteroidSystem.clearAll?.();

            //  HIỆU ỨNG CẢNH BÁO 
            game.explosionSystem.startWarning(5);
            game.sceneController.triggerShake(0.6, 2.5);

            // CHUYỂN LEVEL NGAY
            game.currentLevelKey = 'LEVEL_3';
            game.gamePlayState = 'WAVES';
            game.boss = null;

            game.enemyManager.resetAndStartWaveSystem(2, 3);

            game.cinematicEffects?.showText("LEVEL 3 - ĐỊA NGỤC", 3);

            // dùng lại UI sẵn có của Story
            const originalTexts = [...this.texts]; // clone mảng

            this.texts = [
                "⚠ CẢNH BÁO ⚠",
                "Boss: KẺ HỦY DIỆT - V2 đã bị tiêu diệt...",
                "Nhưng phát hiện dị thường trong không gian...",
                "Tín hiệu của thực thể tối thượng đang đến gần!"
        ];
            this.currentIndex = 0;
            // chạy text như bình thường
            this.showNext();

            // Tổng thời gian = 3 dòng * (2000 + 500)
            const totalTime = this.texts.length * (2000 + 500);

            setTimeout(() => {
                this.isPlaying = false;

                // Trả lại text cũ
                this.texts = originalTexts;
           
                game._bossHandled = false; // fix bug đứng game
               
            }, totalTime);
        }
}