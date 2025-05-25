/*
📁 js/log-dashboard.js  
KDV ERP 시스템 - 로그 및 오류 추적 대시보드
Create at 250525_2030 Ver1.00
*/

import { logger } from './logger.js';
import { errorTracker } from './error-tracker.js';

/**
 * 로그 및 오류 추적 대시보드
 * 실시간으로 시스템 상태를 모니터링
 */
class LogDashboard {
    constructor() {
        this.isVisible = false;
        this.refreshInterval = null;
        this.refreshRate = 5000;
        this.dashboardElement = null;
        this.init();
    }

    init() {
        this.createDashboard();
        this.setupKeyboardShortcuts();
        logger.info('📊 LogDashboard 초기화 완료');
    }

    createDashboard() {
        const dashboardHTML = this.getDashboardHTML();
        
        // 기존 대시보드 제거
        const existing = document.getElementById('log-dashboard');
        if (existing) existing.remove();
        
        // 새 대시보드 추가
        document.body.insertAdjacentHTML('beforeend', dashboardHTML);
        this.dashboardElement = document.getElementById('log-dashboard');
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    getDashboardHTML() {
        return `
            <div id="log-dashboard" class="log-dashboard hidden">
                <div class="dashboard-header">
                    <h2>📊 KDV 시스템 모니터링</h2>
                    <div class="dashboard-controls">
                        <button id="refresh-btn" class="btn btn-primary">새로고침</button>
                        <button id="export-btn" class="btn btn-secondary">로그 내보내기</button>
                        <button id="clear-btn" class="btn btn-danger">로그 지우기</button>
                        <button id="close-dashboard" class="btn btn-secondary">닫기</button>
                    </div>
                </div>
                
                <div class="dashboard-content">
                    <div class="stats-section">
                        <h3>시스템 통계</h3>
                        <div class="stats-grid">
                            <div class="stat-card"><div class="stat-label">로그 총 개수</div><div class="stat-value" id="total-logs">0</div></div>
                            <div class="stat-card error"><div class="stat-label">오류 개수</div><div class="stat-value" id="error-count">0</div></div>
                            <div class="stat-card warning"><div class="stat-label">경고 개수</div><div class="stat-value" id="warning-count">0</div></div>
                            <div class="stat-card performance"><div class="stat-label">성능 이슈</div><div class="stat-value" id="performance-issues">0</div></div>
                            <div class="stat-card uptime"><div class="stat-label">시스템 가동시간</div><div class="stat-value" id="uptime">0s</div></div>
                        </div>
                    </div>
                    
                    <div class="recent-errors-section">
                        <h3>최근 오류 (10개)</h3>
                        <div class="error-list" id="recent-errors"></div>
                    </div>
                    
                    <div class="performance-section">
                        <h3>성능 모니터링</h3>
                        <div id="performance-metrics"></div>
                    </div>
                    
                    <div class="log-filter-section">
                        <h3>로그 필터</h3>
                        <div class="filter-controls">
                            <select id="log-level-filter">
                                <option value="">All Levels</option>
                                <option value="0">DEBUG</option>
                                <option value="1">INFO</option>
                                <option value="2">WARN</option>
                                <option value="3">ERROR</option>
                                <option value="4">FATAL</option>
                            </select>
                            <input type="text" id="log-search" placeholder="로그 검색...">
                            <button id="apply-filter" class="btn btn-primary">필터 적용</button>
                        </div>
                    </div>
                    
                    <div class="log-list-section">
                        <h3>로그 목록 (100개)</h3>
                        <div class="log-list" id="log-list"></div>
                    </div>
                </div>
            </div>
            ${this.getDashboardCSS()}
        `;
    }

    getDashboardCSS() {
        return `<style>
            .log-dashboard{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999;overflow-y:auto;font-family:'Courier New',monospace;color:#00ff00}
            .log-dashboard.hidden{display:none}
            .dashboard-header{display:flex;justify-content:space-between;align-items:center;padding:20px;background:#1a1a1a;border-bottom:2px solid #333}
            .dashboard-header h2{margin:0;color:#00ff00}
            .dashboard-controls{display:flex;gap:10px}
            .dashboard-content{padding:20px}
            .stats-section,.recent-errors-section,.performance-section,.log-filter-section,.log-list-section{margin-bottom:30px;background:#1a1a1a;padding:15px;border-radius:5px;border:1px solid #333}
            .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-top:10px}
            .stat-card{background:#2a2a2a;padding:15px;border-radius:5px;text-align:center;border:2px solid #333}
            .stat-card.error{border-color:#ff4444}
            .stat-card.warning{border-color:#ffaa00}
            .stat-card.performance{border-color:#44aaff}
            .stat-card.uptime{border-color:#44ff44}
            .stat-label{font-size:12px;color:#888;margin-bottom:5px}
            .stat-value{font-size:24px;font-weight:bold;color:#00ff00}
            .error-list,.log-list{max-height:300px;overflow-y:auto;background:#000;padding:10px;border-radius:3px;margin-top:10px}
            .log-entry{padding:8px;margin:5px 0;border-left:3px solid #333;font-size:12px;word-wrap:break-word}
            .log-entry.error{border-color:#ff4444;color:#ff9999}
            .log-entry.warn{border-color:#ffaa00;color:#ffcc99}
            .log-entry.info{border-color:#44aaff;color:#99ccff}
            .log-entry.debug{border-color:#888;color:#ccc}
            .filter-controls{display:flex;gap:10px;margin-top:10px}
            .filter-controls select,.filter-controls input{background:#2a2a2a;border:1px solid #555;color:#00ff00;padding:5px;border-radius:3px}
            .btn{padding:8px 15px;border:none;border-radius:3px;cursor:pointer;font-size:12px}
            .btn-primary{background:#007bff;color:white}
            .btn-secondary{background:#6c757d;color:white}
            .btn-danger{background:#dc3545;color:white}
            .btn:hover{opacity:0.8}
            h3{color:#00ff00;margin:0 0 10px 0;font-size:16px}
        </style>`;
    }

    setupEventListeners() {
        document.getElementById('close-dashboard').addEventListener('click', () => this.hide());
        document.getElementById('refresh-btn').addEventListener('click', () => this.updateDashboard());
        document.getElementById('export-btn').addEventListener('click', () => this.exportLogs());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearLogs());
        document.getElementById('apply-filter').addEventListener('click', () => this.applyFilters());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) this.hide();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    toggle() { this.isVisible ? this.hide() : this.show(); }

    show() {
        if (!this.dashboardElement) this.createDashboard();
        this.dashboardElement.classList.remove('hidden');
        this.isVisible = true;
        this.updateDashboard();
        this.startAutoRefresh();
        logger.info('📊 로그 대시보드 열림');
    }

    hide() {
        if (this.dashboardElement) this.dashboardElement.classList.add('hidden');
        this.isVisible = false;
        this.stopAutoRefresh();
        logger.info('📊 로그 대시보드 닫힘');
    }

    startAutoRefresh() {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => this.updateDashboard(), this.refreshRate);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    updateDashboard() {
        try {
            this.updateStats();
            this.updateRecentErrors();
            this.updatePerformanceMetrics();
            this.updateLogList();
        } catch (error) {
            logger.error('대시보드 업데이트 오류', { error: error.message });
        }
    }

    updateStats() {
        const logStats = logger.getLogStats();
        const errorStats = errorTracker.getErrorStats();
        
        document.getElementById('total-logs').textContent = logStats.totalLogs || 0;
        document.getElementById('error-count').textContent = logStats.errorCount || 0;
        document.getElementById('warning-count').textContent = logger.filterLogs({ level: logger.LogLevel.WARN }).length;
        document.getElementById('performance-issues').textContent = errorStats.performanceIssues || 0;
        
        const uptime = errorStats.uptime || 0;
        document.getElementById('uptime').textContent = this.formatUptime(uptime);
    }

    updateRecentErrors() {
        const recentErrors = errorTracker.getRecentErrors(10);
        const errorContainer = document.getElementById('recent-errors');
        
        if (recentErrors.length === 0) {
            errorContainer.innerHTML = '<div class="log-entry info">최근 오류가 없습니다.</div>';
            return;
        }
        
        const errorHTML = recentErrors.map(error => `
            <div class="log-entry error">
                <div><strong>[${new Date(error.timestamp).toLocaleString()}]</strong></div>
                <div>${this.escapeHtml(error.message)}</div>
            </div>
        `).join('');
        
        errorContainer.innerHTML = errorHTML;
    }

    updatePerformanceMetrics() {
        const performanceContainer = document.getElementById('performance-metrics');
        let html = '';
        
        if ('memory' in performance) {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
            const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
            
            html += `<div>메모리 사용량: ${usedMB}MB / ${totalMB}MB (최대: ${limitMB}MB)</div>`;
        }
        
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            const loadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);
            const domContentLoaded = Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart);
            
            html += `<div>페이지 로드 시간: ${loadTime}ms</div>`;
            html += `<div>DOM 로드 시간: ${domContentLoaded}ms</div>`;
        }
        
        performanceContainer.innerHTML = html;
    }

    updateLogList() {
        const logs = logger.filterLogs({}).slice(0, 100);
        const logContainer = document.getElementById('log-list');
        
        if (logs.length === 0) {
            logContainer.innerHTML = '<div class="log-entry info">로그가 없습니다.</div>';
            return;
        }
        
        const logHTML = logs.map(log => {
            const levelClass = log.level.toLowerCase();
            return `
                <div class="log-entry ${levelClass}">
                    <div><strong>[${new Date(log.timestamp).toLocaleString()}] [${log.level}]</strong></div>
                    <div>${this.escapeHtml(log.message)}</div>
                </div>
            `;
        }).join('');
        
        logContainer.innerHTML = logHTML;
    }

    applyFilters() {
        const levelFilter = document.getElementById('log-level-filter').value;
        const searchText = document.getElementById('log-search').value;
        
        const filterOptions = {};
        if (levelFilter) filterOptions.level = parseInt(levelFilter);
        if (searchText) filterOptions.keyword = searchText;
        
        const filteredLogs = logger.filterLogs(filterOptions).slice(0, 100);
        const logContainer = document.getElementById('log-list');
        
        if (filteredLogs.length === 0) {
            logContainer.innerHTML = '<div class="log-entry info">필터 조건에 맞는 로그가 없습니다.</div>';
            return;
        }
        
        const logHTML = filteredLogs.map(log => {
            const levelClass = log.level.toLowerCase();
            return `
                <div class="log-entry ${levelClass}">
                    <div><strong>[${new Date(log.timestamp).toLocaleString()}] [${log.level}]</strong></div>
                    <div>${this.escapeHtml(log.message)}</div>
                </div>
            `;
        }).join('');
        
        logContainer.innerHTML = logHTML;
    }

    exportLogs() {
        try {
            const logs = logger.exportLogs();
            const blob = new Blob([logs], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `kdv-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            logger.info('로그 내보내기 완료');
        } catch (error) {
            logger.error('로그 내보내기 실패', { error: error.message });
        }
    }

    clearLogs() {
        if (confirm('모든 로그를 지우시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            localStorage.removeItem(logger.storageKey);
            this.updateDashboard();
            logger.info('로그 지우기 완료');
        }
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        this.stopAutoRefresh();
        if (this.dashboardElement) this.dashboardElement.remove();
        logger.info('📊 LogDashboard 시스템 종료');
    }
}

// 전역 LogDashboard 인스턴스 생성
const logDashboard = new LogDashboard();

// 전역 export
window.LogDashboard = LogDashboard;
window.logDashboard = logDashboard;

// 편의 함수들을 전역에 등록
window.showLogDashboard = () => logDashboard.show();
window.hideLogDashboard = () => logDashboard.hide();
window.toggleLogDashboard = () => logDashboard.toggle();

export { LogDashboard, logDashboard };

console.log('📊 LogDashboard 모듈 로드 완료 - Ctrl+Shift+L로 열기');
