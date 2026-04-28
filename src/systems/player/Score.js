import { CONFIG } from '../../utils/CONFIG.JS';

export class ScoreSystem {
    constructor() {
        this.score = 0;
        this.playTime = 0;
        this.onScoreChange = null; // Callback để báo cho UI nếu cần
    }

    /**
     * Cộng hoặc trừ điểm số
     * @param {number} amount Số điểm cần thay đổi
     */
    addScore(amount) {
        this.score += amount;
        if (this.onScoreChange) {
            this.onScoreChange(this.score);
        }
    }

    /**
     * Cập nhật thời gian chơi
     * @param {number} delta Thời gian trôi qua giữa các khung hình (giây)
     */
    updateTime(delta) {
        this.playTime += delta;
    }

    /**
     * Lấy điểm số hiện tại
     */
    getScore() {
        return this.score;
    }

    /**
     * Lấy điểm số cuối cùng sau khi tính toán (score_final = score - score * 1/3)
     */
    getFinalScore() {
        return Math.floor(this.score * (2 / 3));
    }

    /**
     * Lấy thời gian chơi hiện tại
     */
    getTime() {
        return this.playTime;
    }

    /**
     * Đặt lại toàn bộ thông số (khi bắt đầu game mới)
     */
    reset() {
        this.score = 0;
        this.playTime = 0;
    }

    /**
     * Thiết lập callback khi điểm thay đổi
     */
    setCallback(callback) {
        this.onScoreChange = callback;
    }
}
