/* 📁 js/performance-dashboard.js */
/* 성능 대시보드 UI 컴포넌트 - KDV ERP 시스템 */
/* Create at 250525_1355 Ver1.00 */

import { globalPerformanceMonitor } from './performance-monitor.js';

export class PerformanceDashboard {
    constructor() {
        this.isVisible = false;
        this.updateInterval = null;
    }

    show() {
        if (this.isVisible) return;
        this.createDashboardHTML();
        this.bindEvents();
        this.startDataUpdates();
        this.isVisible = true;
        console.log('📊 성능 대시보드 표시');
    }

    hide() {
        if (!this.isVisible) return;
        const dashboard = document.getElementById('performance-dashboard');
        if (dashboard) dashboard.remove();
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.isVisible = false;
        console.log('📊 성능 대시보드 숨김');
    }

    toggle() { this.isVisible ? this.hide() : this.show(); }

    createDashboardHTML() {
        const html = `<div id="performance-dashboard" class="perf-dash"><div class="dash-header"><h2>📊 성능 모니터링</h2><div class="dash-controls"><button id="perf-refresh" class="btn btn-primary btn-sm">새로고침</button><button id="perf-export" class="btn btn-secondary btn-sm">내보내기</button><button id="perf-close" class="btn btn-icon">✕</button></div></div><div class="dash-content"><div class="metrics-section"><h3>Core Web Vitals</h3><div class="vitals-grid"><div class="vital-card" id="fcp-card"><div class="vital-label">FCP</div><div class="vital-value" id="fcp-value">-</div><div class="vital-unit">ms</div><div class="vital-status" id="fcp-status">측정중</div></div><div class="vital-card" id="lcp-card"><div class="vital-label">LCP</div><div class="vital-value" id="lcp-value">-</div><div class="vital-unit">ms</div><div class="vital-status" id="lcp-status">측정중</div></div><div class="vital-card" id="cls-card"><div class="vital-label">CLS</div><div class="vital-value" id="cls-value">-</div><div class="vital-unit"></div><div class="vital-status" id="cls-status">측정중</div></div><div class="vital-card" id="fid-card"><div class="vital-label">FID</div><div class="vital-value" id="fid-value">-</div><div class="vital-unit">ms</div><div class="vital-status" id="fid-status">대기중</div></div></div></div><div class="metrics-section"><h3>API 성능</h3><div class="api-metrics"><div class="metric-item"><span>총 호출:</span><span id="api-total">0</span></div><div class="metric-item"><span>응답시간:</span><span id="api-avg">0ms</span></div><div class="metric-item"><span>느린 호출:</span><span id="api-slow">0</span></div></div></div><div class="metrics-section"><h3>메모리</h3><div class="memory-info"><div><span>사용:</span><span id="mem-used">0MB</span></div><div><span>전체:</span><span id="mem-total">0MB</span></div></div><div class="memory-bar"><div id="mem-usage"></div></div><div class="memory-pct" id="mem-pct">0%</div></div><div class="metrics-section"><h3>경고</h3><div id="warnings">현재 경고 없음</div></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        this.addStyles();
    }

    addStyles() {
        const css = `<style>.perf-dash{position:fixed;top:80px;right:20px;width:400px;max-height:80vh;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:1000;font-family:sans-serif}.dash-header{padding:16px;background:linear-gradient(135deg,#007bff,#0056b3);color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0}.dash-header h2{margin:0;font-size:16px;font-weight:600}.dash-controls{display:flex;gap:8px}.btn-sm{padding:4px 8px;font-size:12px;border-radius:6px;border:none;cursor:pointer}.dash-content{padding:16px;max-height:calc(80vh - 60px);overflow-y:auto}.metrics-section{margin-bottom:20px}.metrics-section h3{font-size:14px;font-weight:600;margin:0 0 12px 0;color:#333}.vitals-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.vital-card{background:#f8f9fa;border-radius:8px;padding:12px;text-align:center;border:2px solid transparent}.vital-card.good{border-color:#22c55e;background:#f0fdf4}.vital-card.warning{border-color:#f59e0b;background:#fffbeb}.vital-card.poor{border-color:#ef4444;background:#fef2f2}.vital-label{font-size:11px;font-weight:600;color:#666;margin-bottom:4px}.vital-value{font-size:18px;font-weight:700;color:#333;margin-bottom:2px}.vital-unit{font-size:10px;color:#888;margin-bottom:4px}.vital-status{font-size:10px;font-weight:500}.api-metrics{display:flex;justify-content:space-between;font-size:12px;gap:8px}.metric-item{text-align:center}.memory-info{display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px}.memory-bar{height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:8px}#mem-usage{height:100%;background:linear-gradient(90deg,#22c55e,#f59e0b,#ef4444);width:0%;transition:width 0.3s}.memory-pct{text-align:center;font-size:12px;font-weight:600}#warnings{font-size:12px;max-height:100px;overflow-y:auto}.warning-item{padding:6px 8px;margin:4px 0;border-radius:4px;font-size:11px}.warning-item.low{background:#fef3c7}.warning-item.medium{background:#fed7aa}.warning-item.high{background:#fecaca}.warning-item.critical{background:#fee2e2}</style>`;
        document.head.insertAdjacentHTML('beforeend', css);
    }

    bindEvents() {
        document.getElementById('perf-close').onclick = () => this.hide();
        document.getElementById('perf-refresh').onclick = () => this.refreshData();
        document.getElementById('perf-export').onclick = () => this.exportData();
    }

    startDataUpdates() {
        this.refreshData();
        this.updateInterval = setInterval(() => this.updateMetrics(), 2000);
    }

    refreshData() {
        if (!globalPerformanceMonitor.isActive()) globalPerformanceMonitor.startMonitoring();
        this.updateMetrics();
        console.log('📊 성능 데이터 새로고침');
    }

    updateMetrics() {
        const metrics = globalPerformanceMonitor.getMetrics();
        const summary = globalPerformanceMonitor.getPerformanceSummary();
        this.updateVitals(metrics.vitals);
        this.updateAPI(summary.apiPerformance);
        this.updateMemory(summary.memoryUsage);
        this.updateWarnings(metrics.errors);
    }

    updateVitals(vitals) {
        this.updateVital('fcp', vitals.fcp, [1800, 3000]);
        this.updateVital('lcp', vitals.lcp, [2500, 4000]);
        this.updateVital('cls', vitals.cls, [0.1, 0.25]);
        this.updateVital('fid', vitals.fid, [100, 300]);
    }

    updateVital(type, value, thresholds) {
        const valueEl = document.getElementById(`${type}-value`);
        const statusEl = document.getElementById(`${type}-status`);
        const cardEl = document.getElementById(`${type}-card`);
        if (!valueEl) return;
        valueEl.textContent = value > 0 ? (type === 'cls' ? value.toFixed(3) : Math.round(value)) : '-';
        cardEl.className = 'vital-card';
        if (value > 0) {
            if (value <= thresholds[0]) {
                cardEl.classList.add('good');
                statusEl.textContent = '좋음';
            } else if (value <= thresholds[1]) {
                cardEl.classList.add('warning');
                statusEl.textContent = '개선필요';
            } else {
                cardEl.classList.add('poor');
                statusEl.textContent = '나쁨';
            }
        }
    }

    updateAPI(api) {
        document.getElementById('api-total').textContent = api.totalCalls || 0;
        document.getElementById('api-avg').textContent = `${api.avgResponseTime || 0}ms`;
        document.getElementById('api-slow').textContent = api.slowCalls || 0;
    }

    updateMemory(mem) {
        document.getElementById('mem-used').textContent = `${mem.used || 0}MB`;
        document.getElementById('mem-total').textContent = `${mem.total || 0}MB`;
        const pct = mem.limit > 0 ? Math.round((mem.used / mem.limit) * 100) : 0;
        document.getElementById('mem-pct').textContent = `${pct}%`;
        document.getElementById('mem-usage').style.width = `${pct}%`;
    }

    updateWarnings(errors) {
        const el = document.getElementById('warnings');
        if (!errors || errors.length === 0) {
            el.innerHTML = '현재 경고 없음';
            return;
        }
        el.innerHTML = errors.slice(-3).map(e => 
            `<div class="warning-item ${e.severity}">${e.message}</div>`
        ).join('');
    }

    exportData() {
        const data = globalPerformanceMonitor.exportMetrics();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('📊 성능 데이터 내보내기 완료');
    }

    isActive() { return this.isVisible; }
}

export const globalPerformanceDashboard = new PerformanceDashboard();