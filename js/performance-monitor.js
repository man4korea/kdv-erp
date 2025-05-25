/* 📁 js/performance-monitor.js */
/* 성능 모니터링 모듈 - KDV ERP 시스템 */
/* Create at 250525_1330 Ver1.00 */

/**
 * 실시간 성능 모니터링 클래스
 * Web Vitals, API 응답시간, 메모리 사용량 등을 추적
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            vitals: { fcp: 0, lcp: 0, cls: 0, fid: 0 },
            apiCalls: [],
            memory: { used: 0, total: 0, limit: 0 },
            pageLoads: [],
            errors: []
        };
        this.observers = new Map();
        this.isMonitoring = false;
        this.callbacks = new Map();
        
        // 성능 임계값 설정
        this.thresholds = {
            fcp: 1800, // First Contentful Paint (1.8초)
            lcp: 2500, // Largest Contentful Paint (2.5초)
            cls: 0.1,  // Cumulative Layout Shift (0.1)
            fid: 100,  // First Input Delay (100ms)
            apiResponseTime: 2000, // API 응답시간 (2초)
            memoryUsage: 0.8 // 메모리 사용률 (80%)
        };
    }

    /**
     * 성능 모니터링 시작
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🚀 성능 모니터링 시작');
        
        // Core Web Vitals 측정
        this.measureWebVitals();
        
        // 메모리 사용량 모니터링
        this.monitorMemoryUsage();
        
        // API 호출 추적
        this.monitorAPIResponses();
        
        // 페이지 로딩 성능 추적
        this.measurePageLoadPerformance();
        
        // 정기적 메트릭 업데이트 (5초마다)
        this.metricsInterval = setInterval(() => {
            this.updateMetrics();
        }, 5000);
        
        return true;
    }

    /**
     * 성능 모니터링 중지
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        console.log('⏹️ 성능 모니터링 중지');
        
        // 인터벌 정리
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        
        // 옵저버 정리
        this.observers.forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers.clear();
    }

    /**
     * Core Web Vitals 측정
     */
    measureWebVitals() {
        // First Contentful Paint (FCP)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.name === 'first-contentful-paint') {
                    this.metrics.vitals.fcp = Math.round(entry.startTime);
                    this.checkThreshold('fcp', this.metrics.vitals.fcp);
                }
            });
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint (LCP)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.vitals.lcp = Math.round(lastEntry.startTime);
            this.checkThreshold('lcp', this.metrics.vitals.lcp);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            this.metrics.vitals.cls = Math.round(clsValue * 1000) / 1000;
            this.checkThreshold('cls', this.metrics.vitals.cls);
        }).observe({ entryTypes: ['layout-shift'] });

        // First Input Delay (FID) - 사용자 상호작용 감지
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.metrics.vitals.fid = Math.round(entry.processingStart - entry.startTime);
                this.checkThreshold('fid', this.metrics.vitals.fid);
            }
        }).observe({ entryTypes: ['first-input'] });
    }

    /**
     * 메모리 사용량 모니터링
     */
    monitorMemoryUsage() {
        if (!performance.memory) {
            console.warn('⚠️ 메모리 모니터링은 Chrome에서만 지원됩니다');
            return;
        }

        const updateMemory = () => {
            const memory = performance.memory;
            this.metrics.memory = {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
            };
            
            const usageRatio = this.metrics.memory.used / this.metrics.memory.limit;
            this.checkThreshold('memoryUsage', usageRatio);
        };

        updateMemory();
        setInterval(updateMemory, 3000); // 3초마다 업데이트
    }

    /**
     * API 응답시간 모니터링
     */
    monitorAPIResponses() {
        // XMLHttpRequest 오버라이드
        const originalXHR = window.XMLHttpRequest;
        const self = this;
        
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;
            
            let startTime, url, method;
            
            xhr.open = function(methodParam, urlParam, ...args) {
                method = methodParam;
                url = urlParam;
                return originalOpen.apply(this, [methodParam, urlParam, ...args]);
            };
            
            xhr.send = function(...args) {
                startTime = performance.now();
                
                xhr.addEventListener('loadend', () => {
                    const endTime = performance.now();
                    const responseTime = Math.round(endTime - startTime);
                    
                    self.recordAPICall({
                        url,
                        method,
                        responseTime,
                        status: xhr.status,
                        timestamp: new Date().toISOString()
                    });
                });
                
                return originalSend.apply(this, args);
            };
            
            return xhr;
        };

        // Fetch API 오버라이드
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            const startTime = performance.now();
            
            return originalFetch.apply(this, arguments).then(response => {
                const endTime = performance.now();
                const responseTime = Math.round(endTime - startTime);
                
                self.recordAPICall({
                    url: url.toString(),
                    method: options.method || 'GET',
                    responseTime,
                    status: response.status,
                    timestamp: new Date().toISOString()
                });
                
                return response;
            });
        };
    }

    /**
     * API 호출 기록
     */
    recordAPICall(callData) {
        this.metrics.apiCalls.push(callData);
        
        // 최근 50개 호출만 유지
        if (this.metrics.apiCalls.length > 50) {
            this.metrics.apiCalls.shift();
        }
        
        this.checkThreshold('apiResponseTime', callData.responseTime);
        
        // 콜백 실행
        this.executeCallbacks('apiCall', callData);
    }

    /**
     * 페이지 로딩 성능 측정
     */
    measurePageLoadPerformance() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            const loadData = {
                dnsLookup: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
                tcpConnection: Math.round(navigation.connectEnd - navigation.connectStart),
                serverResponse: Math.round(navigation.responseEnd - navigation.requestStart),
                domLoad: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart),
                fullLoad: Math.round(navigation.loadEventEnd - navigation.navigationStart),
                timestamp: new Date().toISOString()
            };
            
            this.metrics.pageLoads.push(loadData);
        }
    }

    /**
     * 성능 임계값 확인 및 경고
     */
    checkThreshold(metric, value) {
        const threshold = this.thresholds[metric];
        if (!threshold) return;
        
        let isExceeded = false;
        let message = '';
        
        switch (metric) {
            case 'fcp':
            case 'lcp':
            case 'fid':
            case 'apiResponseTime':
                isExceeded = value > threshold;
                message = `${metric.toUpperCase()}: ${value}ms (임계값: ${threshold}ms)`;
                break;
            case 'cls':
                isExceeded = value > threshold;
                message = `CLS: ${value} (임계값: ${threshold})`;
                break;
            case 'memoryUsage':
                isExceeded = value > threshold;
                message = `메모리 사용률: ${Math.round(value * 100)}% (임계값: ${Math.round(threshold * 100)}%)`;
                break;
        }
        
        if (isExceeded) {
            console.warn(`⚠️ 성능 경고: ${message}`);
            this.recordPerformanceWarning(metric, value, message);
        }
    }

    /**
     * 성능 경고 기록
     */
    recordPerformanceWarning(metric, value, message) {
        const warning = {
            metric,
            value,
            message,
            timestamp: new Date().toISOString(),
            severity: this.getWarningSeverity(metric, value)
        };
        
        this.metrics.errors.push(warning);
        
        // 최근 20개 경고만 유지
        if (this.metrics.errors.length > 20) {
            this.metrics.errors.shift();
        }
        
        // 콜백 실행
        this.executeCallbacks('performanceWarning', warning);
    }

    /**
     * 경고 심각도 계산
     */
    getWarningSeverity(metric, value) {
        const threshold = this.thresholds[metric];
        const ratio = value / threshold;
        
        if (ratio < 1.2) return 'low';
        if (ratio < 1.5) return 'medium';
        if (ratio < 2.0) return 'high';
        return 'critical';
    }

    /**
     * 메트릭 업데이트
     */
    updateMetrics() {
        // 최근 API 응답시간 평균 계산
        const recentAPICalls = this.metrics.apiCalls.slice(-10);
        if (recentAPICalls.length > 0) {
            const avgResponseTime = recentAPICalls.reduce((sum, call) => sum + call.responseTime, 0) / recentAPICalls.length;
            this.metrics.avgApiResponseTime = Math.round(avgResponseTime);
        }
        
        // 콜백 실행
        this.executeCallbacks('metricsUpdate', this.metrics);
    }

    /**
     * 현재 성능 메트릭 반환
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * 성능 요약 정보 반환
     */
    getPerformanceSummary() {
        const recentErrors = this.metrics.errors.filter(error => {
            const errorTime = new Date(error.timestamp);
            const now = new Date();
            return (now - errorTime) < 3600000; // 최근 1시간
        });
        
        return {
            webVitals: this.metrics.vitals,
            apiPerformance: {
                totalCalls: this.metrics.apiCalls.length,
                avgResponseTime: this.metrics.avgApiResponseTime || 0,
                slowCalls: this.metrics.apiCalls.filter(call => call.responseTime > this.thresholds.apiResponseTime).length
            },
            memoryUsage: this.metrics.memory,
            warnings: {
                total: this.metrics.errors.length,
                recent: recentErrors.length,
                critical: recentErrors.filter(e => e.severity === 'critical').length
            }
        };
    }

    /**
     * 성능 데이터 내보내기 (JSON)
     */
    exportMetrics() {
        return JSON.stringify(this.metrics, null, 2);
    }

    /**
     * 콜백 등록
     */
    onMetricsUpdate(callback) {
        if (!this.callbacks.has('metricsUpdate')) {
            this.callbacks.set('metricsUpdate', []);
        }
        this.callbacks.get('metricsUpdate').push(callback);
    }

    onPerformanceWarning(callback) {
        if (!this.callbacks.has('performanceWarning')) {
            this.callbacks.set('performanceWarning', []);
        }
        this.callbacks.get('performanceWarning').push(callback);
    }

    onAPICall(callback) {
        if (!this.callbacks.has('apiCall')) {
            this.callbacks.set('apiCall', []);
        }
        this.callbacks.get('apiCall').push(callback);
    }

    /**
     * 콜백 실행
     */
    executeCallbacks(event, data) {
        const callbacks = this.callbacks.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`콜백 실행 오류 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 성능 모니터링 상태 확인
     */
    isActive() {
        return this.isMonitoring;
    }

    /**
     * 메트릭 초기화
     */
    resetMetrics() {
        this.metrics = {
            vitals: { fcp: 0, lcp: 0, cls: 0, fid: 0 },
            apiCalls: [],
            memory: { used: 0, total: 0, limit: 0 },
            pageLoads: [],
            errors: []
        };
        console.log('📊 성능 메트릭 초기화 완료');
    }
}

// 전역 성능 모니터 인스턴스
export const globalPerformanceMonitor = new PerformanceMonitor();