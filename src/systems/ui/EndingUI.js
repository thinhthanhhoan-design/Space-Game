export class EndingUI {
    constructor() {
        this.container = document.createElement("div");
        this.container.id = "ending-ui";
        this.setStyle();
        document.body.appendChild(this.container);
        this.hide();
    }

    setStyle() {
        Object.assign(this.container.style, {
            position: "fixed",
            top: "0", left: "0", width: "100%", height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.2)", 
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "3000",
            fontFamily: "'Orbitron', sans-serif",
            textAlign: "center",
            backdropFilter: "blur(4px)", 
            transition: "opacity 1s ease-in-out"
        });
    }

    show(type = 'GAME_OVER', score = 0) {
        const isWin = type === 'WIN';
        const title = isWin ? "HAPPY ENDING" : "GAME OVER";
        
        // Nội dung ending
        const message = isWin 
            ? "Tàu UETE-3637 thoát khỏi Vùng Tối, bạn nhận ra tín hiệu cầu cứu chính là do bạn trong tương lai gửi." 
            : "Tàu UETE-3637 bị mắc kẹt vĩnh viễn, trở thành “Tín hiệu ma” dụ các tàu khác tiến vào Vùng Tối...";
            
        const themeColor = isWin ? "#00ffcc" : "#ff3333";
        const shadowColor = isWin ? "rgba(0, 255, 204, 0.4)" : "rgba(255, 51, 51, 0.4)";

        // Dữ liệu Top 5 giả lập (tạm thôi tại vì chưa làm hệ thống tính điểm)
        const topScores = [15000, 12400, 9800, 7200, 5000];

        this.container.innerHTML = `
            <div id="ending-card" style="
                background: rgba(0, 20, 40, 0.7);
                backdrop-filter: blur(12px);
                padding: 25px 35px;
                border-radius: 15px;
                border: 1px solid ${themeColor}66;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
                width: 420px;
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: scale(0.9);
                transition: transform 0.5s ease-out;
            ">
                <h1 style="color: ${themeColor}; font-size: 26px; text-shadow: 0 0 15px ${themeColor}; margin: 0 0 10px 0;">
                    ${title}
                </h1>

                <p style="color: #ffffff; font-size: 13px; line-height: 1.5; margin-bottom: 20px; opacity: 0.7; font-family: 'Arial', sans-serif; max-width: 90%;">
                    ${message}
                </p>

                <div style="margin-bottom: 20px; text-align: center;">
                    <div style="color: #ffffff; font-size: 10px; letter-spacing: 2px; opacity: 0.5; margin-bottom: 5px;">YOUR SCORE</div>
                    <div style="color: #fff; font-size: 32px; font-weight: bold; text-shadow: 0 0 10px rgba(255,255,255,0.5);">
                        ${score.toLocaleString()}
                    </div>
                </div>

                <div style="width: 100%; background: rgba(0, 0, 0, 0.3); padding: 12px 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="color: ${themeColor}; font-size: 12px; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid ${themeColor}33; padding-bottom: 5px;">
                        TOP 5 HIGHEST SCORE
                    </div>
                    <div id="leaderboard" style="width: 100%;">
                        ${topScores.map((s, i) => `
                            <div style="display: flex; justify-content: space-between; color: #fff; font-size: 13px; margin: 4px 0; opacity: ${i === 0 ? 1 : 0.6}; font-family: monospace;">
                                <span>#${i + 1}</span>
                                <span>${s.toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <button id="restart-btn" style="
                    width: 100%;
                    padding: 12px;
                    font-size: 15px;
                    font-family: 'Orbitron', sans-serif;
                    background: rgba(255, 255, 255, 0.05);
                    color: ${themeColor};
                    border: 1px solid ${themeColor};
                    cursor: pointer;
                    border-radius: 4px;
                    transition: all 0.3s;
                    box-shadow: 0 0 10px ${shadowColor};
                    text-transform: uppercase;
                ">
                    Restart 
                </button>
            </div>
        `;

        const btn = this.container.querySelector("#restart-btn");
        btn.onmouseover = () => {
            btn.style.background = themeColor;
            btn.style.color = "#000";
            btn.style.boxShadow = `0 0 20px ${themeColor}`;
        };
        btn.onmouseout = () => {
            btn.style.background = "rgba(255, 255, 255, 0.05)";
            btn.style.color = themeColor;
            btn.style.boxShadow = `0 0 10px ${shadowColor}`;
        };

        btn.onclick = () => window.location.reload();

        this.container.style.display = "flex";
        requestAnimationFrame(() => {
            this.container.style.opacity = "1";
            this.container.querySelector("#ending-card").style.transform = "scale(1)";
        });
    }

    hide() {
        this.container.style.display = "none";
        this.container.style.opacity = "0";
    }
}