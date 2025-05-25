/*
📁 js/error-tracker.js  
KDV ERP 시스템 - 실시간 오류 추적 시스템
Create at 250525_2030 Ver1.00
*/

import { logger } from './logger.js';

/**
 * 실시간 오류 추적 시스템
 * JavaScript 오류를 실시간으로 캐치하고 분석하는 시스템
 */
class ErrorTracker {
    constructor() {
        // 오류 추적 설정
        this.config = {
            enableGlobalErrorHandler: true,        // 전역 오류 핸들러 활성화
            enableUnhandledRejection: true,        // Promise rejection 추적
            enableConsoleOverride: true,           // console 메서드 오버라이드
            enablePerformanceTracking: true,      // 성능 지표 추적
            enableUserInteractionTracking: true,  // 사용자 상호작용 추적
            enableMemoryTracking: true,           // 메모리 사용량 추적
            maxErrorsPerSession: 100,             // 세션당 최대 오류 수
            alertThreshold: 5,                    // 연속 오류 알림 임계값
            sampleRate: 1.0                       // 오류 샘플링 비율 (1.0 = 100%)
        };

        // 오류 통계
        this.stats = {
            totalErrors: 0,
            sessionErrors: 0,
            consecutiveErrors: 0,
            lastErrorTime: null,
            errorTypes: {},
            performanceIssues: 0
        };

        // 오류 캐시 (중복 제거용)
        this.errorCache = new Map();
        this.cacheExpiryTime = 30000; // 30초

        // 성능 임계값
        this.performanceThresholds = {
            slowFunction: 100,      // 100ms 이상
            memoryUsage: 50,        // 50MB 이상  
            renderTime: 16          // 16ms 이상 (60fps 기준)
        };

        // 초기화
        this.init();
    }

    /**
     * 오류 추적 시스템 초기화
     */
    init() {
        // 전역 오류 핸들러 설정
        if (this.config.enableGlobalErrorHandler) {
            this.setupGlobalErrorHandler();
        }

        // Promise rejection 핸들러 설정
        if (this.config.enableUnhandledRejection) {
            this.setupUnhandledRejectionHandler();
        }

        // 콘솔 메서드 오버라이드
        if (this.config.enableConsoleOverride) {
            this.setupConsoleOverride();
        }

        // 성능 추적
        if (this.config.enablePerformanceTracking) {
            this.setupPerformanceTracking();
        }

        // 사용자 상호작용 추적
        if (this.config.enableUserInteractionTracking) {
            this.setupUserInteractionTracking();
        }

        // 메모리 추적
        if (this.config.enableMemoryTracking) {
            this.setupMemoryTracking();
        }

        // 정기적 정리 작업
        this.setupCleanupTasks();

        logger.info('🔍 ErrorTracker 초기화 완료', { config: this.config });
    }

    /**
     * 전역 오류 핸들러 설정
     */
    setupGlobalErrorHandler() {
        // JavaScript 오류 핸들러
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack
            });
        });

        // 리소스 로딩 오류 핸들러
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'resource_error',
                    message: `리소스 로딩 실패: ${event.target.tagName}`,
                    element: event.target.tagName,
                    src: event.target.src || event.target.href,
                    details: {
                        tagName: event.target.tagName,
                        src: event.target.src,
                        href: event.target.href
                    }
                });
            }
        }, true);
    }

    /**
     * Promise rejection 핸들러 설정
     */
    setupUnhandledRejectionHandler() {
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'unhandled_promise_rejection',
                message: event.reason?.message || '처리되지 않은 Promise rejection',
                reason: event.reason,
                stack: event.reason?.stack
            });
        });
    }

    /**
     * 콘솔 메서드 오버라이드
     */
    setupConsoleOverride() {
        const originalConsole = {
            error: console.error,
            warn: console.warn
        };

        // console.error 오버라이드
        console.error = (...args) => {
            originalConsole.error.apply(console, args);
            this.handleConsoleError('error', args);
        };

        // console.warn 오버라이드
        console.warn = (...args) => {
            originalConsole.warn.apply(console, args);
            this.handleConsoleError('warn', args);
        };

        // 원본 콘솔 참조 저장
        this.originalConsole = originalConsole;
    }

    /**
     * 성능 추적 설정
     */
    setupPerformanceTracking() {
        // 메모리 사용량 추적
        this.monitorMemoryUsage();
    }

    /**
     * 메모리 사용량 모니터링
     */
    monitorMemoryUsage() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = memory.usedJSHeapSize / 1048576; // MB 변환

                if (usedMB > this.performanceThresholds.memoryUsage) {
                    this.handlePerformanceIssue({
                        type: 'high_memory_usage',
                        usedMB,
                        totalMB: memory.totalJSHeapSize / 1048576,
                        limitMB: memory.jsHeapSizeLimit / 1048576
                    });
                }
            }, 30000); // 30초마다 체크
        }
    }

    /**
     * 사용자 상호작용 추적 설정
     */
    setupUserInteractionTracking() {
        ['click', 'keydown', 'submit'].forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.trackUserInteraction(eventType, event);
            });
        });
    }

    /**
     * 메모리 추적 설정
     */
    setupMemoryTracking() {
        // 메모리 누수 감지를 위한 주기적 체크
        setInterval(() => {
            this.checkMemoryLeaks();
        }, 60000); // 1분마다
    }

    /**
     * 오류 처리 메인 함수
     */
    handleError(errorData) {
        // 샘플링 적용
        if (Math.random() > this.config.sampleRate) {
            return;
        }

        // 세션당 최대 오류 수 확인
        if (this.stats.sessionErrors >= this.config.maxErrorsPerSession) {
            return;
        }

        // 중복 오류 체크
        const errorKey = this.generateErrorKey(errorData);
        if (this.isDuplicateError(errorKey)) {
            return;
        }

        // 오류 데이터 보강
        const enrichedError = this.enrichErrorData(errorData);

        // 로거로 오류 기록
        logger.error('시스템 오류 감지', {
            errorData: enrichedError,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        }, errorData.error);

        // 통계 업데이트
        this.updateErrorStats(errorData);

        // 실시간 알림 체크
        this.checkForAlerts();

        // 오류 캐시에 저장
        this.cacheError(errorKey, enrichedError);
    }

    /**
     * 콘솔 오류 처리
     */
    handleConsoleError(level, args) {
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');

        this.handleError({
            type: `console_${level}`,
            message,
            arguments: args,
            stack: new Error().stack
        });
    }

    /**
     * 성능 이슈 처리
     */
    handlePerformanceIssue(performanceData) {
        this.stats.performanceIssues++;

        logger.warn('성능 이슈 감지', {
            performanceData,
            timestamp: new Date().toISOString()
        });

        // 심각한 성능 이슈인 경우 오류로 취급
        if (performanceData.type === 'high_memory_usage' && 
            performanceData.usedMB > this.performanceThresholds.memoryUsage * 2) {
            this.handleError({
                type: 'critical_performance_issue',
                message: '심각한 메모리 사용량 초과',
                ...performanceData
            });
        }
    }

    /**
     * 사용자 상호작용 추적
     */
    trackUserInteraction(eventType, event) {
        // 오류 발생 직전의 사용자 행동 추적 (디버깅용)
        const interactionData = {
            type: eventType,
            target: event.target.tagName,
            timestamp: Date.now(),
            details: {
                id: event.target.id,
                className: event.target.className,
                path: this.getElementPath(event.target)
            }
        };

        // 최근 상호작용만 저장 (최대 10개)
        if (!this.recentInteractions) {
            this.recentInteractions = [];
        }

        this.recentInteractions.unshift(interactionData);
        if (this.recentInteractions.length > 10) {
            this.recentInteractions.pop();
        }
    }

    /**
     * 오류 데이터 보강
     */
    enrichErrorData(errorData) {
        return {
            ...errorData,
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId(),
            userId: this.getUserId(),
            deviceInfo: this.getDeviceInfo(),
            browserInfo: this.getBrowserInfo(),
            recentInteractions: this.recentInteractions?.slice(0, 5) || [],
            performanceMetrics: this.getPerformanceMetrics()
        };
    }

    /**
     * 통계 업데이트
     */
    updateErrorStats(errorData) {
        this.stats.totalErrors++;
        this.stats.sessionErrors++;
        
        const now = Date.now();
        
        // 연속 오류 카운트
        if (this.stats.lastErrorTime && (now - this.stats.lastErrorTime) < 10000) {
            this.stats.consecutiveErrors++;
        } else {
            this.stats.consecutiveErrors = 1;
        }
        
        this.stats.lastErrorTime = now;

        // 오류 타입별 통계
        const errorType = errorData.type;
        this.stats.errorTypes[errorType] = (this.stats.errorTypes[errorType] || 0) + 1;
    }

    /**
     * 실시간 알림 체크
     */
    checkForAlerts() {
        // 연속 오류 임계값 체크
        if (this.stats.consecutiveErrors >= this.config.alertThreshold) {
            this.sendAlert({
                type: 'consecutive_errors',
                count: this.stats.consecutiveErrors,
                message: `연속으로 ${this.stats.consecutiveErrors}개의 오류가 발생했습니다.`
            });
        }

        // 세션 오류 임계값 체크
        const uptime = Date.now() - performance.timing.navigationStart;
        const sessionErrorRate = this.stats.sessionErrors / (uptime / 60000); // 분당 오류율
        if (sessionErrorRate > 1) { // 분당 1개 이상
            this.sendAlert({
                type: 'high_error_rate',
                rate: sessionErrorRate,
                message: '높은 오류 발생률이 감지되었습니다.'
            });
        }
    }

    /**
     * 알림 전송
     */
    sendAlert(alertData) {
        logger.fatal('시스템 알림', { alertData });

        // 브라우저 알림 (권한이 있는 경우)
        if (Notification.permission === 'granted') {
            new Notification('KDV 시스템 알림', {
                body: alertData.message,
                icon: '/favicon.ico'
            });
        }

        // 콘솔에 눈에 띄는 알림
        console.warn(
            '%c🚨 KDV 시스템 알림 🚨',
            'background: red; color: white; font-size: 16px; padding: 10px;',
            alertData.message
        );
    }

    /**
     * 유틸리티 메서드들
     */
    generateErrorKey(errorData) {
        return `${errorData.type}_${errorData.message}_${errorData.filename || ''}_${errorData.lineno || ''}`;
    }

    generateErrorId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    isDuplicateError(errorKey) {
        const now = Date.now();
        const cached = this.errorCache.get(errorKey);
        
        if (cached && (now - cached.timestamp) < this.cacheExpiryTime) {
            cached.count++;
            return true;
        }
        
        return false;
    }

    cacheError(errorKey, errorData) {
        this.errorCache.set(errorKey, {
            errorData,
            timestamp: Date.now(),
            count: 1
        });
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('kdv_session_id');
        if (!sessionId) {
            sessionId = this.generateErrorId();
            sessionStorage.setItem('kdv_session_id', sessionId);
        }
        return sessionId;
    }

    getUserId() {
        // Firebase Auth 사용자 정보 가져오기 (있는 경우)
        try {
            const user = window.firebase?.auth?.currentUser;
            return user ? user.uid : 'anonymous';
        } catch (e) {
            return 'anonymous';
        }
    }

    getDeviceInfo() {
        return {
            screen: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            pixelRatio: window.devicePixelRatio,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };
    }

    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            vendor: navigator.vendor,
            appName: navigator.appName,
            appVersion: navigator.appVersion,
            hardwareConcurrency: navigator.hardwareConcurrency
        };
    }

    getElementPath(element) {
        const path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            if (element.id) {
                selector += '#' + element.id;
            } else if (element.className) {
                selector += '.' + element.className.split(' ').join('.');
            }
            path.unshift(selector);
            element = element.parentNode;
        }
        return path.join(' > ');
    }

    getPerformanceMetrics() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            const memory = performance.memory;
            
            return {
                loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : null,
                domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : null,
                memoryUsed: memory ? Math.round(memory.usedJSHeapSize / 1048576) : null,
                memoryTotal: memory ? Math.round(memory.totalJSHeapSize / 1048576) : null
            };
        }
        return null;
    }

    checkMemoryLeaks() {
        if ('memory' in performance) {
            const memory = performance.memory;
            const usedMB = memory.usedJSHeapSize / 1048576;
            const totalMB = memory.totalJSHeapSize / 1048576;
            
            // 메모리 사용률이 90% 이상이면 경고
            if (usedMB / totalMB > 0.9) {
                this.handleError({
                    type: 'memory_leak_warning',
                    message: '메모리 누수 의심',
                    usedMB,
                    totalMB,
                    usageRate: usedMB / totalMB
                });
            }
        }
    }

    /**
     * 정리 작업 설정
     */
    setupCleanupTasks() {
        // 5분마다 오류 캐시 정리
        setInterval(() => {
            this.cleanupErrorCache();
        }, 5 * 60 * 1000);

        // 10분마다 통계 리셋 (연속 오류 카운트)
        setInterval(() => {
            this.stats.consecutiveErrors = 0;
        }, 10 * 60 * 1000);
    }

    cleanupErrorCache() {
        const now = Date.now();
        for (const [key, value] of this.errorCache.entries()) {
            if (now - value.timestamp > this.cacheExpiryTime) {
                this.errorCache.delete(key);
            }
        }
    }

    /**
     * 공개 API 메서드들
     */
    
    // 수동으로 오류 보고
    reportError(message, metadata = {}) {
        this.handleError({
            type: 'manual_report',
            message,
            metadata,
            stack: new Error().stack
        });
    }

    // 함수 실행을 래핑하여 오류 추적
    wrapFunction(fn, functionName = 'anonymous') {
        return (...args) => {
            try {
                const startTime = performance.now();
                const result = fn.apply(this, args);
                const endTime = performance.now();
                
                // 실행 시간이 너무 긴 경우 성능 이슈로 보고
                if (endTime - startTime > this.performanceThresholds.slowFunction) {
                    this.handlePerformanceIssue({
                        type: 'slow_function',
                        functionName,
                        duration: endTime - startTime
                    });
                }
                
                return result;
            } catch (error) {
                this.handleError({
                    type: 'wrapped_function_error',
                    message: `함수 ${functionName}에서 오류 발생: ${error.message}`,
                    functionName,
                    error,
                    stack: error.stack
                });
                throw error; // 원래 오류를 다시 던짐
            }
        };
    }

    // Promise 래핑하여 오류 추적
    wrapPromise(promise, promiseName = 'anonymous') {
        return promise.catch(error => {
            this.handleError({
                type: 'wrapped_promise_error',
                message: `Promise ${promiseName}에서 오류 발생: ${error.message}`,
                promiseName,
                error,
                stack: error.stack
            });
            throw error; // 원래 오류를 다시 던짐
        });
    }

    // 오류 통계 조회
    getErrorStats() {
        return {
            ...this.stats,
            cacheSize: this.errorCache.size,
            uptime: Date.now() - performance.timing.navigationStart
        };
    }

    // 최근 오류 조회
    getRecentErrors(count = 10) {
        return logger.filterLogs({
            level: logger.LogLevel.ERROR
        }).slice(0, count);
    }

    // 설정 업데이트
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        logger.info('🔍 ErrorTracker 설정 업데이트', { config: this.config });
    }

    // 시스템 종료
    destroy() {
        // 원본 콘솔 복원
        if (this.originalConsole) {
            console.error = this.originalConsole.error;
            console.warn = this.originalConsole.warn;
        }
        
        logger.info('🔍 ErrorTracker 시스템 종료');
    }
}

// 전역 ErrorTracker 인스턴스 생성
const errorTracker = new ErrorTracker();

// 전역 export
window.ErrorTracker = ErrorTracker;
window.errorTracker = errorTracker;

// 편의 함수들을 전역에 등록
window.reportError = (message, metadata) => errorTracker.reportError(message, metadata);
window.wrapFunction = (fn, name) => errorTracker.wrapFunction(fn, name);
window.wrapPromise = (promise, name) => errorTracker.wrapPromise(promise, name);

export { ErrorTracker, errorTracker };

console.log('🔍 ErrorTracker 모듈 로드 완료');
