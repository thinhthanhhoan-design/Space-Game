import gsap from 'gsap';

export class Splash {
    constructor(onLaunch) {
        this.onLaunch = onLaunch;
        this.dom = null;
        this.createDOM();
    }

    createDOM() {
        this.dom = document.createElement('div');
        this.dom.id = 'splash-screen';
        Object.assign(this.dom.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            cursor: 'pointer',
            fontFamily: "'Orbitron', sans-serif",
            color: '#00ffff',
            userSelect: 'none'
        });

        const title = document.createElement('h1');
        title.innerText = 'UET SPACE GAME - NHÓM 10';
        Object.assign(title.style, {
            fontSize: '3rem',
            letterSpacing: '10px',
            marginBottom: '20px',
            textShadow: '0 0 20px #00ffff'
        });

        const subtitle = document.createElement('p');
        subtitle.innerText = 'CLICK TO LAUNCH';
        Object.assign(subtitle.style, {
            fontSize: '1.2rem',
            letterSpacing: '4px',
            opacity: 0.8
        });

        this.dom.appendChild(title);
        this.dom.appendChild(subtitle);
        document.body.appendChild(this.dom);

        // Hiệu ứng nhấp nháy cho subtitle
        gsap.to(subtitle, {
            opacity: 0.2,
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut"
        });

        // Sự kiện Click để bắt đầu
        this.dom.addEventListener('click', () => this.launch());
    }

    launch() {
        if (this.onLaunch) this.onLaunch();
        
        gsap.to(this.dom, {
            opacity: 0,
            duration: 1.5,
            ease: "power2.out",
            onComplete: () => {
                if (this.dom.parentNode) {
                    this.dom.parentNode.removeChild(this.dom);
                }
            }
        });
    }
}
