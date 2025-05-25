/*
📁 js/main.js
KDV 시스템 - 메인 UI 컨트롤 로직
Create at 250525_1900 Ver1.01
*/

// UI 컨트롤러 및 로딩 매니저 모듈 import
import { MainUIController } from './ui-controller.js';
import { PageLoadingManager } from './loading-manager.js';

// 전역 인스턴스 변수
let mainUIController;
let pageLoadingManager;

/**
 * 메인 시스템 초기화
 * DOM 로드 완료 후 UI 컨트롤러와 로딩 매니저를 초기화합니다.
 */
function initializeMainSystem() {
    try {
        // UI 컨트롤러 초기화
        mainUIController = new MainUIController();
        
        // 로딩 매니저 초기화
        pageLoadingManager = new PageLoadingManager();
        
        // 전역 객체로 등록 (하위 호환성 유지)
        window.mainUI = mainUIController;
        window.pageLoading = pageLoadingManager;
        
        // 레거시 호환을 위한 전역 변수도 설정
        window.mainUIController = mainUIController;
        window.pageLoadingManager = pageLoadingManager;
        
        console.log('🎨 메인 UI 시스템 초기화 완료');
        console.log('🔧 사용 가능한 전역 객체:', {
            mainUI: window.mainUI,
            pageLoading: window.pageLoading,
            mainUIController: window.mainUIController,
            pageLoadingManager: window.pageLoadingManager
        });
        
    } catch (error) {
        console.error('❌ 메인 시스템 초기화 실패:', error);
        
        // 오류 발생 시 사용자에게 알림
        if (typeof alert !== 'undefined') {
            alert('시스템 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        }
    }
}

/**
 * DOM 로드 완료 시 초기화 실행
 */
document.addEventListener('DOMContentLoaded', initializeMainSystem);

/**
 * 모듈 export (ES6 모듈 시스템)
 */
export { 
    MainUIController, 
    PageLoadingManager,
    mainUIController,
    pageLoadingManager
};

/**
 * 전역 함수 - 레거시 호환성 유지
 */
window.getMainUI = () => mainUIController;
window.getPageLoading = () => pageLoadingManager;

console.log('📄 main.js 모듈 로드 완료 - 리팩토링 버전 v1.01');
