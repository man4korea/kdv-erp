/*
📁 js/main.js
KDV 시스템 - 메인 UI 컨트롤 로직
Create at 250525_1900 Ver1.02
*/

// UI 컨트롤러 및 로딩 매니저 모듈 import
import { MainUIController } from './ui-controller.js';
import { PageLoadingManager } from './loading-manager.js';
// 실시간 오류 추적 시스템 import
import { logger } from './logger.js';
import { errorTracker } from './error-tracker.js';
import { logDashboard } from './log-dashboard.js';

// 전역 인스턴스 변수
let mainUIController;
let pageLoadingManager;

/**
 * 메인 시스템 초기화
 * DOM 로드 완료 후 UI 컨트롤러와 로딩 매니저를 초기화합니다.
 */
function initializeMainSystem() {
    try {
        // 로그 시스템 초기화 확인
        logger.info('🚀 KDV 메인 시스템 초기화 시작');
        
        // UI 컨트롤러 초기화
        mainUIController = new MainUIController();
        logger.info('✅ MainUIController 초기화 완료');
        
        // 로딩 매니저 초기화
        pageLoadingManager = new PageLoadingManager();
        logger.info('✅ PageLoadingManager 초기화 완료');
        
        // 전역 객체로 등록 (하위 호환성 유지)
        window.mainUI = mainUIController;
        window.pageLoading = pageLoadingManager;
        
        // 레거시 호환을 위한 전역 변수도 설정
        window.mainUIController = mainUIController;
        window.pageLoadingManager = pageLoadingManager;
        
        // 성공 로그
        logger.info('🎨 메인 UI 시스템 초기화 완료', {
            mainUI: !!window.mainUI,
            pageLoading: !!window.pageLoading,
            errorTracking: !!window.errorTracker,
            logging: !!window.logger
        });
        
        // 전역 오류 핸들러 추가 (ErrorTracker 보완용)
        setupGlobalErrorHandlers();
        
    } catch (error) {
        // 오류 추적 시스템으로 오류 기록
        logger.error('❌ 메인 시스템 초기화 실패', {
            error: error.message,
            stack: error.stack
        }, error);
        
        // 사용자에게 알림
        if (typeof alert !== 'undefined') {
            alert('시스템 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        }
    }
}

/**
 * 전역 오류 핸들러 설정 (추가 보안)
 * ErrorTracker와 함께 작동하여 누락된 오류도 캐치
 */
function setupGlobalErrorHandlers() {
    // 처리되지 않은 오류를 위한 최종 안전망
    window.addEventListener('error', (event) => {
        logger.error('전역 오류 핸들러 - JavaScript 오류', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            type: 'global_fallback_error'
        });
    });
    
    // 처리되지 않은 Promise rejection을 위한 최종 안전망
    window.addEventListener('unhandledrejection', (event) => {
        logger.error('전역 오류 핸들러 - 처리되지 않은 Promise rejection', {
            reason: event.reason,
            type: 'global_fallback_promise_rejection'
        });
    });
    
    logger.info('🛡️ 전역 오류 핸들러 설정 완료');
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

// 오류 추적 관련 전역 함수
window.getErrorStats = () => errorTracker.getErrorStats();
window.getRecentErrors = (count) => errorTracker.getRecentErrors(count);
window.getLogStats = () => logger.getLogStats();

console.log('📄 main.js 모듈 로드 완료 - 오류 추적 통합 버전 v1.02');
