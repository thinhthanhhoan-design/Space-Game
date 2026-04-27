export class Story {
    constructor() {
        this.container = document.createElement("div");
        document.body.appendChild(this.container);

        this.container.style.position = "fixed";
        this.container.style.bottom = "40px";
        this.container.style.left = "50%";
        this.container.style.transform = "translateX(-50%)";
        this.container.style.width = "70%";
        this.container.style.padding = "20px";
        this.container.style.background = "rgba(0,0,0,0.5)";
        this.container.style.borderRadius = "12px";
        this.container.style.display = "none";
        this.container.style.color = "white";
        this.container.style.fontFamily = "monospace";
        this.container.style.fontSize = "18px";
        this.container.style.textAlign = "center";
        this.container.style.transition = "opacity 0.5s";

        // 🎨 Nhân vật dẫn chuyện (ảnh 2D)
        this.avatar = document.createElement("img");
        this.avatar.src = "/assets/narrator.png"; // 👉 bạn tự thêm ảnh vào đây
        this.avatar.style.position = "absolute";
        this.avatar.style.left = "-120px";
        this.avatar.style.bottom = "0";
        this.avatar.style.width = "100px";
        this.avatar.style.opacity = "0.9";

        this.text = document.createElement("div");

        this.container.appendChild(this.avatar);
        this.container.appendChild(this.text);

        // 🎬 Các đoạn thoại
        this.lines = [
            "Để sống sót, bạn phải né tránh các thiên thạch với mật độ ngày càng dày đặc...",
            "...và thu thập năng lượng rải rác để duy trì hệ thống, đồng thời giải mã tín hiệu bí ẩn.",
            "Con tàu tiếp tục trôi sâu hơn vào khu vực nguy hiểm..."
        ];

        this.currentLine = 0;
        this.timer = 0;
        this.isPlaying = false;
    }

    start() {
        this.container.style.display = "block";
        this.container.style.opacity = "1";
        this.currentLine = 0;
        this.timer = 0;
        this.isPlaying = true;

        this.showLine();
    }

    showLine() {
        this.text.innerText = this.lines[this.currentLine];
    }

    update(delta) {
        if (!this.isPlaying) return;

        this.timer += delta;

        // mỗi đoạn ~3.5s
        if (this.timer > 3.5) {
            this.timer = 0;
            this.currentLine++;

            if (this.currentLine >= this.lines.length) {
                this.end();
                return;
            }

            // 🎬 fade effect
            this.container.style.opacity = "0";

            setTimeout(() => {
                this.showLine();
                this.container.style.opacity = "1";
            }, 400);
        }
    }

    end() {
        this.isPlaying = false;

        this.container.style.opacity = "0";
        setTimeout(() => {
            this.container.style.display = "none";
        }, 500);
    }
}