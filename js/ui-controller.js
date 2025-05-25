/*
📁 js/ui-controller.js
KDV 시스템 - UI 컨트롤러 통합 모듈 (모듈화 버전)
Create at 250525_2200 Ver2.01
*/

import { UICoreController } from './ui-core-controller.js';
import { UIInteractionsMixin } from './ui-interactions.js';

/**
 * 통합 UI 컨트롤러 클래스 (기존 MainUIController 대체)
 * 핵심 제어와 상호작용 기능을 조합하여 완전한 기능 제공
 */
export class MainUIController {
    constructor() {
        // UICoreController 인스턴스 생성
        this.coreController = new UICoreController();
        
        // 핵심 컨트롤러의 모든 속성과 메서드를 현재 인스턴스에 복사
        Object.assign(this, this.coreController);
        
        // 포커스 트랩 핸들러 초기화
        this.trapFocusHandler = null;
        
        // 초기화 실행 (이제 this.init()이 올바르게 작동)
        this.init();
        
        console.log('🎨 MainUIController (통합 버전) 초기화 완료');
    }
    
    /**
     * 사이드바 열기 (포커스 트랩 추가)
     * @param {boolean} animate - 애니메이션 여부
     */
    openSidebar(animate = true) {
        // 핵심 사이드바 열기 로직
        UICoreController.prototype.openSidebar.call(this, animate);
        
        // 포커스 트랩 설정 (상호작용 기능)
        if (UIInteractionsMixin.prototype.setupFocusTrap) {
            UIInteractionsMixin.prototype.setupFocusTrap.call(this);
        }
    }
    
    /**
     * 사이드바 닫기 (포커스 트랩 해제)
     * @param {boolean} animate - 애니메이션 여부
     */
    closeSidebar(animate = true) {
        // 포커스 트랩 해제 (상호작용 기능)
        if (UIInteractionsMixin.prototype.removeFocusTrap) {
            UIInteractionsMixin.prototype.removeFocusTrap.call(this);
        }
        
        // 핵심 사이드바 닫기 로직
        UICoreController.prototype.closeSidebar.call(this, animate);
    }
}

// 상호작용 믹스인 메서드들을 MainUIController 프로토타입에 추가
if (UIInteractionsMixin && UIInteractionsMixin.prototype) {
    Object.assign(MainUIController.prototype, UIInteractionsMixin.prototype);
}

// 전역 UI 컨트롤러 인스턴스 (기존 호환성 유지)
let mainUIController = null;

/**
 * UI 컨트롤러 인스턴스 초기화
 */
export function initUIController() {
    if (!mainUIController) {
        mainUIController = new MainUIController();
    }
    return mainUIController;
}

/**
 * UI 컨트롤러 인스턴스 반환
 */
export function getUIController() {
    return mainUIController;
}

// 전역 액세스를 위한 window 객체 설정 (기존 코드 호환성)
if (typeof window !== 'undefined') {
    // 페이지 로드 시 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initUIController();
        });
    } else {
        initUIController();
    }
    
    // 전역 함수들 (기존 호환성)
    window.toggleSidebar = () => {
        if (mainUIController) {
            mainUIController.toggleSidebar();
        }
    };
    
    window.showNotification = (message, type = 'info') => {
        if (mainUIController) {
            mainUIController.showNotification(message, type);
        }
    };
    
    window.setActiveMenu = (pagePath) => {
        if (mainUIController) {
            mainUIController.setActiveMenu(pagePath);
        }
    };
    
    window.updateMenuBadge = (menuSelector, badgeText) => {
        if (mainUIController) {
            mainUIController.updateMenuBadge(menuSelector, badgeText);
        }
    };
    
    window.showLoading = (show = true, message = '처리 중...') => {
        if (mainUIController) {
            mainUIController.showLoading(show, message);
        }
    };
    
    window.showConfirm = async (message, title = '확인') => {
        if (mainUIController) {
            return await mainUIController.showConfirm(message, title);
        }
        return confirm(message); // 폴백
    };
}

console.log('📄 ui-controller.js (통합 모듈) 로드 완료');
