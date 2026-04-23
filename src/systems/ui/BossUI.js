export class BossUI {
    constructor() {
        this.boss = null;
        this.maxHP = 0;
        this.currentHP = 0;

        this.isVisible = false;

        this.createUI();
    }

    createUI() {
        // Container
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '30px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.width = '600px';
        this.container.style.height = '30px';
        this.container.style.background = 'rgba(0,0,0,0.5)';
        this.container.style.border = '2px solid #ff0033';
        this.container.style.borderRadius = '15px';
        this.container.style.boxShadow = '0 0 20px rgba(255,0,50,0.7)';
        this.container.style.display = 'none';
        this.container.style.overflow = 'hidden';
        this.container.style.zIndex = '9999';

        // 🔥 TÊN BOSS (TÁCH RIÊNG - KHÔNG NẰM TRONG CONTAINER)
        this.nameText = document.createElement('div');
        this.nameText.innerText = 'BOSS_1';
        this.nameText.style.position = 'absolute';
        this.nameText.style.fontSize = '18px';
        this.nameText.style.fontWeight = 'bold';
        this.nameText.style.letterSpacing = '2px';
        this.nameText.style.textShadow = '0 0 10px red';
        this.nameText.style.zIndex = '10000';

        // gradient chữ
        this.nameText.style.background = 'linear-gradient(90deg, #ff0000, #ffaa00)';
        this.nameText.style.webkitBackgroundClip = 'text';
        this.nameText.style.webkitTextFillColor = 'transparent';

        // Ẩn ban đầu
        this.nameText.style.opacity = '0';

        // HP bar chính
        this.bar = document.createElement('div');
        this.bar.style.height = '100%';
        this.bar.style.width = '100%';
        this.bar.style.background = 'linear-gradient(90deg, #ff0033, #ff6666)';
        this.bar.style.boxShadow = '0 0 15px #ff0033';
        this.bar.style.transition = 'width 0.3s ease-out';

        // Bar mất máu (delay)
        this.damageBar = document.createElement('div');
        this.damageBar.style.position = 'absolute';
        this.damageBar.style.top = '0';
        this.damageBar.style.left = '0';
        this.damageBar.style.height = '100%';
        this.damageBar.style.width = '100%';
        this.damageBar.style.background = 'rgba(255,255,255,0.3)';
        this.damageBar.style.transition = 'width 0.6s ease-out';

        // append
        this.container.appendChild(this.damageBar);
        this.container.appendChild(this.bar);

        document.body.appendChild(this.container);
        document.body.appendChild(this.nameText); // 🔥 ADD: tách riêng
    }

    bindBoss(boss) {
        this.boss = boss;
        this.maxHP = boss.hp;
        this.currentHP = boss.hp;

        //  đảm bảo boss có model
        if (boss.type) {
            this.nameText.innerText = boss.type;
        }

        this.show();
    }

    show() {
        this.container.style.display = 'block';
        this.container.style.opacity = '0';
        this.container.style.transition = 'opacity 0.5s';

        setTimeout(() => {
            this.container.style.opacity = '1';
            this.nameText.style.opacity = '1'; // 🔥 hiện tên boss
        }, 50);

        this.isVisible = true;
    }

    hide() {
        this.container.style.opacity = '0';
        this.nameText.style.opacity = '0'; // 🔥 ẩn luôn tên

        setTimeout(() => {
            this.container.style.display = 'none';
        }, 500);

        this.isVisible = false;
    }

    update() {
        if (!this.boss || !this.isVisible) return;

        const hpPercent = Math.max(0, this.boss.hp / this.maxHP);

        // 🔥 FIX: cập nhật vị trí name theo container
        const rect = this.container.getBoundingClientRect();
        this.nameText.style.left = rect.left + rect.width / 2 + 'px';
        this.nameText.style.top = (rect.top - 25) + 'px';
        this.nameText.style.transform = 'translateX(-50%)';

        // Bar chính
        this.bar.style.width = (hpPercent * 100) + '%';

        // Delay damage effect
        setTimeout(() => {
            this.damageBar.style.width = (hpPercent * 100) + '%';
        }, 150);

        // Flash khi mất máu
        if (this.currentHP > this.boss.hp) {
            this.bar.style.filter = 'brightness(2)';
            setTimeout(() => {
                this.bar.style.filter = 'brightness(1)';
            }, 100);
        }
        this.currentHP = this.boss.hp;

        // Low HP glow
        if (hpPercent < 0.3) {
            this.container.style.boxShadow = '0 0 30px red';
            this.nameText.style.opacity = Math.random() > 0.5 ? '1' : '0.6';
        }

        // Boss chết
        if (this.boss.hp <= 0) {
            this.hide();
        }
    }
}