import { CONFIG } from '../../utils/CONFIG.JS';

export class Story {
    constructor() {
        this.texts = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.createUI();
    }

    createUI() {
        if (this.container) return;
        this.container = document.createElement('div');
        this.container.id = 'story-ui-container';

        const style = this.container.style;
        style.pointerEvents = 'none';
        style.whiteSpace = 'nowrap';
        style.position = 'absolute';
        style.top = '60px';
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        style.padding = '15px 40px';
        style.borderRadius = '18px';
        style.minWidth = '600px';
        style.background = 'rgba(0, 25, 45, 0.55)';
        style.backdropFilter = 'blur(6px)';
        style.border = '1.5px solid rgba(0, 255, 255, 0.35)';
        style.boxShadow = '0 0 12px rgba(0,255,255,0.25), inset 0 0 12px rgba(0,255,255,0.15)';
        style.color = '#c8f6ff';
        style.fontSize = '20px';
        style.fontWeight = '500';
        style.letterSpacing = '2px';
        style.textAlign = 'center';
        style.textShadow = '0 0 8px rgba(0,255,255,0.6)';
        style.fontFamily = 'Orbitron, Arial, sans-serif';
        style.opacity = '0';
        style.transition = 'opacity 0.5s ease';
        style.zIndex = '9999';

        document.body.appendChild(this.container);
    }

    /**
     * Chạy chuỗi hội thoại dựa trên key từ CONFIG.STORY
     */
    play(key, onComplete) {
        const storyData = CONFIG.STORY[key];
        if (!storyData) {
            console.error(`Story key not found: ${key}`);
            if (onComplete) onComplete();
            return;
        }

        this.isPlaying = true;
        this.onCompleteCallback = onComplete;
        this.currentIndex = 0;

        // Xử lý dữ liệu có thể là mảng text hoặc object chứa logic
        if (Array.isArray(storyData)) {
            this.texts = storyData;
        } else if (storyData.texts) {
            this.texts = storyData.texts;
        }

        this.showNext();
    }

    showNext() {
        if (this.currentIndex >= this.texts.length) {
            this.hide();
            this.isPlaying = false;
            if (this.onCompleteCallback) {
                this.onCompleteCallback();
                this.onCompleteCallback = null;
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

    // Shortcut cho các đoạn film cụ thể nếu cần
    playLevel3Transition(game, onComplete) {
        const data = CONFIG.STORY.LV2_TRANSITION;
        
        // Thực thi logic đi kèm từ CONFIG
        if (game) {
            if (game.uiManager?.startWarning) game.uiManager.startWarning(data.warning || 5);
            if (game.sceneController?.triggerShake) game.sceneController.triggerShake(data.shake.intensity, data.shake.duration);
        }

        this.play('LV2_TRANSITION', onComplete);
    }

    playVictoryEnding(onComplete) {
        this.play('VICTORY', onComplete);
    }
}