/*
📁 js/ui-interactions.js
KDV 시스템 - UI 사용자 상호작용 로직
Create at 250525_2200 Ver1.00
*/

/**
 * UI 상호작용 믹스인 클래스
 * 알림, 접근성, 배지 등 사용자 상호작용 기능 담당
 */
export class UIInteractionsMixin {
    /**
     * 포커스 트랩 설정 (접근성)
     */
    setupFocusTrap() {
        if (!this.sidebar || this.isDesktop) return;
        
        const focusableElements = this.sidebar.querySelectorAll(
            'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // 첫 번째 요소에 포커스
        firstElement.focus();
        
        // Tab 키 처리
        this.trapFocusHandler = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };
        
        document.addEventListener('keydown', this.trapFocusHandler);
    }
    
    /**
     * 포커스 트랩 해제
     */
    removeFocusTrap() {
        if (this.trapFocusHandler) {
            document.removeEventListener('keydown', this.trapFocusHandler);
            this.trapFocusHandler = null;
        }
    }
    
    /**
     * 알림 표시
     * @param {string} message - 알림 메시지
     * @param {string} type - 알림 타입 (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        // 간단한 알림 구현 (추후 toast 라이브러리로 교체 가능)
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 스타일 적용
        Object.assign(notification.style, {
            position: 'fixed',
            top: '80px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        });
        
        // 타입별 배경색
        const colors = {
            success: '#22c55e',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // 애니메이션 시작
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 자동 제거
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * 메뉴 배지 업데이트
     * @param {string} menuSelector - 메뉴 선택자
     * @param {string|number} badgeText - 배지 텍스트
     */
    updateMenuBadge(menuSelector, badgeText) {
        const menuItem = document.querySelector(menuSelector);
        if (!menuItem) return;
        
        let badge = menuItem.querySelector('.menu-badge');
        
        if (badgeText) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'menu-badge';
                menuItem.appendChild(badge);
            }
            badge.textContent = badgeText;
        } else {
            if (badge) {
                badge.remove();
            }
        }
    }
    
    /**
     * 로딩 상태 표시
     * @param {boolean} show - 표시 여부
     * @param {string} message - 로딩 메시지
     */
    showLoading(show = true, message = '처리 중...') {
        let loadingOverlay = document.getElementById('loadingOverlay');
        
        if (show) {
            if (!loadingOverlay) {
                // 로딩 오버레이 생성
                loadingOverlay = document.createElement('div');
                loadingOverlay.id = 'loadingOverlay';
                loadingOverlay.innerHTML = `
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <div class="loading-message">${message}</div>
                    </div>
                `;
                
                // 스타일 적용
                Object.assign(loadingOverlay.style, {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: '99999'
                });
                
                const loadingContent = loadingOverlay.querySelector('.loading-content');
                Object.assign(loadingContent.style, {
                    textAlign: 'center',
                    color: 'white'
                });
                
                const spinner = loadingOverlay.querySelector('.loading-spinner');
                Object.assign(spinner.style, {
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '4px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                });
                
                document.body.appendChild(loadingOverlay);
            } else {
                loadingOverlay.style.display = 'flex';
                const messageEl = loadingOverlay.querySelector('.loading-message');
                if (messageEl) messageEl.textContent = message;
            }
        } else {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
    }
    
    /**
     * 확인 대화상자 표시
     * @param {string} message - 확인 메시지
     * @param {string} title - 제목
     * @returns {Promise<boolean>} 사용자 선택 결과
     */
    async showConfirm(message, title = '확인') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'confirm-modal';
            modal.innerHTML = `
                <div class="confirm-content">
                    <div class="confirm-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="confirm-body">
                        <p>${message}</p>
                    </div>
                    <div class="confirm-footer">
                        <button class="btn btn-secondary confirm-cancel">취소</button>
                        <button class="btn btn-primary confirm-ok">확인</button>
                    </div>
                </div>
            `;
            
            // 스타일 적용
            Object.assign(modal.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '99999'
            });
            
            const content = modal.querySelector('.confirm-content');
            Object.assign(content.style, {
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%'
            });
            
            document.body.appendChild(modal);
            
            // 이벤트 처리
            const handleResult = (result) => {
                document.body.removeChild(modal);
                resolve(result);
            };
            
            modal.querySelector('.confirm-ok').addEventListener('click', () => handleResult(true));
            modal.querySelector('.confirm-cancel').addEventListener('click', () => handleResult(false));
            modal.addEventListener('click', (e) => {
                if (e.target === modal) handleResult(false);
            });
        });
    }
    
    /**
     * 툴팁 표시
     * @param {HTMLElement} element - 대상 요소
     * @param {string} text - 툴팁 텍스트
     * @param {string} position - 위치 (top, bottom, left, right)
     */
    showTooltip(element, text, position = 'top') {
        const tooltip = document.createElement('div');
        tooltip.className = 'ui-tooltip';
        tooltip.textContent = text;
        
        Object.assign(tooltip.style, {
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: '10000',
            pointerEvents: 'none',
            opacity: '0',
            transition: 'opacity 0.2s'
        });
        
        document.body.appendChild(tooltip);
        
        // 위치 계산
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 8;
                break;
            default: // top
                top = rect.top - tooltipRect.height - 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.opacity = '1';
        
        // 자동 제거
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.style.opacity = '0';
                setTimeout(() => {
                    if (tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                }, 200);
            }
        }, 2000);
    }
}

console.log('💫 ui-interactions.js 모듈 로드 완료');