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
     * Lấy điểm số cuối cùng sau khi tính toán khấu trừ thời gian (Time Penalty)
     * Cơ chế: 
     * - Dưới 3 phút: Không trừ (0%)
     * - 3 đến 5 phút: Trừ nhanh đạt mốc 1/3 (33.3%)
     * - Sau 5 phút: Trừ chậm (5% mỗi phút), giữ lại tối thiểu 10% điểm bảo hiểm.
     */
    getFinalScore() {
        const SAFE_ZONE = 180;      // 3 phút đầu: An toàn
        const PHASE_1_END = 300;    // 3 - 5 phút: Trừ nhanh đến 1/3
        
        if (this.playTime <= SAFE_ZONE) return Math.floor(this.score);
        
        let penaltyRate = 0;
        
        if (this.playTime <= PHASE_1_END) {
            // Giai đoạn 1: Từ 0% -> 33.3%
            const progress = (this.playTime - SAFE_ZONE) / (PHASE_1_END - SAFE_ZONE);
            penaltyRate = (1 / 3) * progress;
        } else {
            // Giai đoạn 2: Sau 5 phút, mỗi phút trừ thêm 5%
            const extraTime = this.playTime - PHASE_1_END;
            const extraPenalty = (extraTime / 60) * 0.05; 
            penaltyRate = (1 / 3) + extraPenalty;
        }
        
        // Giới hạn: Không trừ quá 90% điểm (luôn giữ lại ít nhất 10% bảo hiểm)
        penaltyRate = Math.min(0.9, penaltyRate);
        
        const finalScore = this.score * (1 - penaltyRate);
        return Math.max(0, Math.floor(finalScore));
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

