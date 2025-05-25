/*
📁 js/loading-manager.js
KDV 시스템 - 로딩 상태 관리 모듈
Create at 250525_1900 Ver1.00
*/

/**
 * 페이지 로딩 상태 관리 클래스
 * 전역 로딩 오버레이 제어 및 로딩 카운터 관리
 */
export class PageLoadingManager {
    constructor() {
        this.loadingCount = 0;
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        console.log('⏳ PageLoadingManager 초기화 완료');
    }
    
    /**
     * 로딩 시작
     * @param {string} message - 로딩 메시지 (선택적)
     */
    show(message = null) {
        this.loadingCount++;
        
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('show');
            
            if (message) {
                let messageEl = this.loadingOverlay.querySelector('.loading-message');
                if (!messageEl) {
                    messageEl = document.createElement('div');
                    messageEl.className = 'loading-message';
                    messageEl.style.marginTop = '20px';
                    messageEl.style.fontSize = '14px';
                    messageEl.style.color = '#666';
                    this.loadingOverlay.appendChild(messageEl);
                }
                messageEl.textContent = message;
            }
            
            console.log('⌛ 로딩 시작:', message || '기본 로딩', `(카운트: ${this.loadingCount})`);
        }
    }
    
    /**
     * 로딩 종료
     */
    hide() {
        this.loadingCount = Math.max(0, this.loadingCount - 1);
        
        if (this.loadingCount === 0 && this.loadingOverlay) {
            this.loadingOverlay.classList.remove('show');
            
            // 메시지 요소 제거
            const messageEl = this.loadingOverlay.querySelector('.loading-message');
            if (messageEl) {
                messageEl.remove();
            }
            
            console.log('✅ 로딩 완료');
        } else {
            console.log('⏸️ 로딩 대기중:', `남은 카운트: ${this.loadingCount}`);
        }
    }
    
    /**
     * 모든 로딩 강제 종료
     * 비정상적인 상황에서 로딩이 계속 표시될 때 사용
     */
    forceHide() {
        this.loadingCount = 0;
        
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('show');
            
            // 메시지 요소 제거
            const messageEl = this.loadingOverlay.querySelector('.loading-message');
            if (messageEl) {
                messageEl.remove();
            }
            
            console.log('🚫 로딩 강제 종료');
        }
    }
    
    /**
     * 현재 로딩 상태 확인
     * @returns {boolean} 로딩 중 여부
     */
    isLoading() {
        return this.loadingCount > 0;
    }
    
    /**
     * 현재 로딩 카운트 반환
     * @returns {number} 현재 로딩 카운트
     */
    getLoadingCount() {
        return this.loadingCount;
    }
    
    /**
     * 비동기 작업을 로딩과 함께 실행
     * @param {Promise} promise - 실행할 Promise
     * @param {string} message - 로딩 메시지
     * @returns {Promise} 결과 Promise
     */
    async withLoading(promise, message = null) {
        this.show(message);
        
        try {
            const result = await promise;
            this.hide();
            return result;
        } catch (error) {
            this.hide();
            throw error;
        }
    }
    
    /**
     * 타이머와 함께 로딩 표시 (최소 표시 시간 보장)
     * @param {Promise} promise - 실행할 Promise
     * @param {string} message - 로딩 메시지
     * @param {number} minTime - 최소 표시 시간 (ms)
     * @returns {Promise} 결과 Promise
     */
    async withMinLoading(promise, message = null, minTime = 500) {
        const startTime = Date.now();
        this.show(message);
        
        try {
            const result = await promise;
            
            // 최소 시간 보장
            const elapsed = Date.now() - startTime;
            if (elapsed < minTime) {
                await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
            }
            
            this.hide();
            return result;
        } catch (error) {
            // 에러 발생 시에도 최소 시간 보장
            const elapsed = Date.now() - startTime;
            if (elapsed < minTime) {
                await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
            }
            
            this.hide();
            throw error;
        }
    }
}

console.log('📄 loading-manager.js 모듈 로드 완료');