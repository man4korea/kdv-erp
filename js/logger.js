/*
📁 js/logger.js  
KDV ERP 시스템 - 통합 로깅 시스템
Create at 250525_2030 Ver1.00
*/

/**
 * 통합 로깅 시스템
 * 클라이언트와 서버 로그를 체계적으로 관리하고 분석하는 시스템
 */
class Logger {
    constructor() {
        // 로그 레벨 정의
        this.LogLevel = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            FATAL: 4
        };

        // 로그 레벨 이름 매핑
        this.LogLevelNames = {
            0: 'DEBUG',
            1: 'INFO',
            2: 'WARN',
            3: 'ERROR',
            4: 'FATAL'
        };

        // 기본 설정
        this.config = {
            minLevel: this.LogLevel.INFO,          // 최소 로그 레벨
            enableConsole: true,                   // 콘솔 출력 여부
            enableStorage: true,                   // 로컬 스토리지 저장 여부
            enableRemote: false,                   // 원격 서버 전송 여부
            maxStorageEntries: 1000,              // 최대 저장 로그 수
            remoteEndpoint: null,                 // 원격 로그 서버 엔드포인트
            includeStackTrace: true               // 스택 트레이스 포함 여부
        };

        // 로그 저장소 키
        this.storageKey = 'kdv_system_logs';

        // 성능 지표 추적
        this.performanceMetrics = {
            logCount: 0,
            startTime: Date.now(),
            lastCleanup: Date.now()
        };

        // 초기화
        this.init();
    }

    /**
     * 로거 초기화
     */
    init() {
        // 기존 로그 불러오기
        this.loadStoredLogs();
        
        // 정기적 정리 작업 설정 (5분마다)
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, 5 * 60 * 1000);

        console.log('📋 Logger 시스템 초기화 완료');
    }

    /**
     * 로그 기록 - 메인 함수
     * @param {number} level - 로그 레벨
     * @param {string} message - 로그 메시지
     * @param {Object} metadata - 추가 메타데이터
     * @param {Error} error - 오류 객체 (선택사항)
     */
    log(level, message, metadata = {}, error = null) {
        // 레벨 필터링
        if (level < this.config.minLevel) {
            return;
        }

        // 로그 엔트리 생성
        const logEntry = this.createLogEntry(level, message, metadata, error);

        // 콘솔 출력
        if (this.config.enableConsole) {
            this.outputToConsole(logEntry);
        }

        // 로컬 저장소에 저장
        if (this.config.enableStorage) {
            this.saveToStorage(logEntry);
        }

        // 원격 서버로 전송
        if (this.config.enableRemote && this.config.remoteEndpoint) {
            this.sendToRemote(logEntry);
        }

        // 성능 지표 업데이트
        this.performanceMetrics.logCount++;
    }

    /**
     * 로그 엔트리 생성
     */
    createLogEntry(level, message, metadata, error) {
        const timestamp = new Date().toISOString();
        const levelName = this.LogLevelNames[level];

        const entry = {
            id: this.generateLogId(),
            timestamp,
            level: levelName,
            levelNum: level,
            message,
            metadata: {
                ...metadata,
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                sessionId: this.getSessionId()
            }
        };

        // 오류 정보 추가
        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: this.config.includeStackTrace ? error.stack : null
            };
        }

        // 스택 트레이스 자동 생성 (ERROR 레벨 이상)
        if (level >= this.LogLevel.ERROR && !error && this.config.includeStackTrace) {
            entry.stackTrace = new Error().stack;
        }

        return entry;
    }

    /**
     * 콘솔 출력
     */
    outputToConsole(entry) {
        const prefix = `[${entry.timestamp}] [${entry.level}]`;
        
        switch (entry.levelNum) {
            case this.LogLevel.DEBUG:
                console.debug(prefix, entry.message, entry.metadata);
                break;
            case this.LogLevel.INFO:
                console.info(prefix, entry.message, entry.metadata);
                break;
            case this.LogLevel.WARN:
                console.warn(prefix, entry.message, entry.metadata);
                break;
            case this.LogLevel.ERROR:
            case this.LogLevel.FATAL:
                console.error(prefix, entry.message, entry.metadata);
                if (entry.error) {
                    console.error('Error Details:', entry.error);
                }
                break;
            default:
                console.log(prefix, entry.message, entry.metadata);
        }
    }

    /**
     * 로컬 스토리지 저장
     */
    saveToStorage(entry) {
        try {
            const existingLogs = this.getStoredLogs();
            existingLogs.unshift(entry); // 최신 로그를 앞에 추가

            // 최대 개수 제한
            if (existingLogs.length > this.config.maxStorageEntries) {
                existingLogs.splice(this.config.maxStorageEntries);
            }

            localStorage.setItem(this.storageKey, JSON.stringify(existingLogs));
        } catch (error) {
            console.error('로그 저장 실패:', error);
        }
    }

    /**
     * 원격 서버 전송
     */
    async sendToRemote(entry) {
        try {
            await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entry)
            });
        } catch (error) {
            console.error('원격 로그 전송 실패:', error);
        }
    }

    /**
     * 편의 메서드들
     */
    debug(message, metadata = {}) {
        this.log(this.LogLevel.DEBUG, message, metadata);
    }

    info(message, metadata = {}) {
        this.log(this.LogLevel.INFO, message, metadata);
    }

    warn(message, metadata = {}) {
        this.log(this.LogLevel.WARN, message, metadata);
    }

    error(message, metadata = {}, error = null) {
        this.log(this.LogLevel.ERROR, message, metadata, error);
    }

    fatal(message, metadata = {}, error = null) {
        this.log(this.LogLevel.FATAL, message, metadata, error);
    }

    /**
     * 저장된 로그 조회
     */
    getStoredLogs() {
        try {
            const logs = localStorage.getItem(this.storageKey);
            return logs ? JSON.parse(logs) : [];
        } catch (error) {
            console.error('로그 조회 실패:', error);
            return [];
        }
    }

    /**
     * 로그 필터링
     */
    filterLogs(options = {}) {
        const logs = this.getStoredLogs();
        let filteredLogs = logs;

        // 레벨 필터
        if (options.level !== undefined) {
            filteredLogs = filteredLogs.filter(log => log.levelNum >= options.level);
        }

        // 시간 범위 필터
        if (options.startTime) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) >= new Date(options.startTime)
            );
        }

        if (options.endTime) {
            filteredLogs = filteredLogs.filter(log => 
                new Date(log.timestamp) <= new Date(options.endTime)
            );
        }

        // 키워드 필터
        if (options.keyword) {
            const keyword = options.keyword.toLowerCase();
            filteredLogs = filteredLogs.filter(log => 
                log.message.toLowerCase().includes(keyword)
            );
        }

        return filteredLogs;
    }

    /**
     * 로그 통계 정보
     */
    getLogStats() {
        const logs = this.getStoredLogs();
        const now = Date.now();
        const oneHourAgo = now - (60 * 60 * 1000);
        const oneDayAgo = now - (24 * 60 * 60 * 1000);

        const recentLogs = logs.filter(log => 
            new Date(log.timestamp).getTime() > oneHourAgo
        );

        const dailyLogs = logs.filter(log => 
            new Date(log.timestamp).getTime() > oneDayAgo
        );

        const errorCount = logs.filter(log => 
            log.levelNum >= this.LogLevel.ERROR
        ).length;

        return {
            totalLogs: logs.length,
            recentLogs: recentLogs.length,
            dailyLogs: dailyLogs.length,
            errorCount,
            performanceMetrics: this.performanceMetrics
        };
    }

    /**
     * 유틸리티 메서드들
     */
    generateLogId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('kdv_session_id');
        if (!sessionId) {
            sessionId = this.generateLogId();
            sessionStorage.setItem('kdv_session_id', sessionId);
        }
        return sessionId;
    }

    loadStoredLogs() {
        const logs = this.getStoredLogs();
        console.log(`📋 저장된 로그 ${logs.length}개 로드 완료`);
    }

    performCleanup() {
        try {
            const logs = this.getStoredLogs();
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            // 일주일 이전 로그 삭제
            const cleanedLogs = logs.filter(log => 
                new Date(log.timestamp).getTime() > oneWeekAgo
            );

            if (cleanedLogs.length < logs.length) {
                localStorage.setItem(this.storageKey, JSON.stringify(cleanedLogs));
                console.log(`🧹 오래된 로그 ${logs.length - cleanedLogs.length}개 정리 완료`);
            }

            this.performanceMetrics.lastCleanup = Date.now();
        } catch (error) {
            console.error('로그 정리 실패:', error);
        }
    }

    /**
     * 설정 업데이트
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('📋 Logger 설정 업데이트:', this.config);
    }

    /**
     * 로그 내보내기 (JSON 형태)
     */
    exportLogs(options = {}) {
        const logs = this.filterLogs(options);
        const exportData = {
            exportTime: new Date().toISOString(),
            totalCount: logs.length,
            logs
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 시스템 종료
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        console.log('📋 Logger 시스템 종료');
    }
}

// 전역 Logger 인스턴스 생성
const logger = new Logger();

// 전역 export
window.Logger = Logger;
window.logger = logger;

export { Logger, logger };

console.log('📋 Logger 모듈 로드 완료');
