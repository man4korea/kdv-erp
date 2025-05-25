/*
📁 js/ui-controller-secure.js
KDV 시스템 - 보안 강화 UI 컨트롤러
Create at 250525_2000 Ver1.00
*/

import { SecurityUtils } from './security-utils.js';

/**
 * 보안 강화된 UI 컨트롤러 클래스
 * XSS 방어, 안전한 DOM 조작, 입력 검증 등 보안 기능 통합
 */
export class SecureUIController {
    constructor() {
        this.csrfToken = SecurityUtils.generateCSRFToken();
        this.sanitizedElements = new Set(); // 정제된 요소 추적
        
        console.log('🛡️ SecureUIController 초기화 완료');
    }
    
    /**
     * 안전한 텍스트 설정 (XSS 방어)
     * @param {HTMLElement|string} element - 대상 요소 또는 선택자
     * @param {string} text - 설정할 텍스트
     */
    safeSetText(element, text) {
        try {
            const el = typeof element === 'string' ? document.querySelector(element) : element;
            if (!el) {
                console.warn('⚠️ 요소를 찾을 수 없습니다:', element);
                return;
            }
            
            // HTML 이스케이프 처리
            const safeText = SecurityUtils.escapeHtml(text);
            
            // textContent 사용 (innerHTML 대신)
            el.textContent = safeText;
            
            this.sanitizedElements.add(el);
            
        } catch (error) {
            console.error('안전한 텍스트 설정 실패:', error);
        }
    }
    
    /**
     * 안전한 HTML 설정 (제한적 허용)
     * @param {HTMLElement|string} element - 대상 요소 또는 선택자
     * @param {string} html - 설정할 HTML (제한된 태그만 허용)
     */
    safeSetHTML(element, html) {
        try {
            const el = typeof element === 'string' ? document.querySelector(element) : element;
            if (!el) {
                console.warn('⚠️ 요소를 찾을 수 없습니다:', element);
                return;
            }
            
            // 허용된 태그만 남기고 정제
            const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'span', 'br'];
            const sanitizedHTML = this.sanitizeHTML(html, allowedTags);
            
            // DOMPurify 같은 라이브러리가 있다면 사용 권장
            el.innerHTML = sanitizedHTML;
            
            this.sanitizedElements.add(el);
            
        } catch (error) {
            console.error('안전한 HTML 설정 실패:', error);
        }
    }
    
    /**
     * HTML 정제 (허용된 태그만 남김)
     * @param {string} html - 정제할 HTML
     * @param {Array} allowedTags - 허용할 태그 목록
     * @returns {string} 정제된 HTML
     */
    sanitizeHTML(html, allowedTags = []) {
        if (typeof html !== 'string') return '';
        
        // 모든 태그 제거 후 허용된 태그만 복원
        let sanitized = SecurityUtils.stripHtml(html);
        
        // 허용된 태그에 대해서만 기본적인 복원 (매우 제한적)
        allowedTags.forEach(tag => {
            const openTagRegex = new RegExp(`&lt;${tag}&gt;`, 'gi');
            const closeTagRegex = new RegExp(`&lt;/${tag}&gt;`, 'gi');
            
            sanitized = sanitized.replace(openTagRegex, `<${tag}>`);
            sanitized = sanitized.replace(closeTagRegex, `</${tag}>`);
        });
        
        return sanitized;
    }
    
    /**
     * 안전한 폼 데이터 수집
     * @param {HTMLFormElement|string} form - 폼 요소 또는 선택자
     * @returns {Object} 정제된 폼 데이터
     */
    safeGetFormData(form) {
        try {
            const formEl = typeof form === 'string' ? document.querySelector(form) : form;
            if (!formEl) {
                throw new Error('폼을 찾을 수 없습니다.');
            }
            
            const formData = new FormData(formEl);
            const safeData = {};
            
            for (const [key, value] of formData.entries()) {
                // 키 이름 검증
                if (!SecurityUtils.hasOnlyAllowedChars(key, false)) {
                    console.warn(`⚠️ 허용되지 않은 필드명: ${key}`);
                    continue;
                }
                
                // 값 정제
                if (typeof value === 'string') {
                    safeData[key] = SecurityUtils.stripHtml(value.trim());
                    
                    // SQL 인젝션 위험 검사
                    if (SecurityUtils.hasSqlInjectionRisk(safeData[key])) {
                        throw new Error(`${key} 필드에 허용되지 않은 문자가 포함되어 있습니다.`);
                    }
                } else {
                    safeData[key] = value;
                }
            }
            
            // CSRF 토큰 추가
            safeData._csrf = this.csrfToken;
            
            return safeData;
            
        } catch (error) {
            console.error('폼 데이터 수집 실패:', error);
            throw error;
        }
    }
    
    /**
     * 안전한 AJAX 요청
     * @param {Object} options - 요청 옵션
     * @returns {Promise} 요청 결과
     */
    async safeAjaxRequest(options) {
        try {
            const {
                url,
                method = 'GET',
                data = null,
                headers = {},
                timeout = 30000
            } = options;
            
            // URL 검증
            if (!url || typeof url !== 'string') {
                throw new Error('올바르지 않은 URL입니다.');
            }
            
            // 상대 URL이 아닌 경우 도메인 검증
            if (url.startsWith('http') && !url.startsWith(window.location.origin)) {
                console.warn('⚠️ 외부 도메인 요청:', url);
            }
            
            // 기본 보안 헤더 설정
            const safeHeaders = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-Token': this.csrfToken,
                ...headers
            };
            
            // 요청 데이터 정제
            let safeData = data;
            if (data && typeof data === 'object') {
                safeData = JSON.stringify(data);
            }
            
            // AbortController로 타임아웃 처리
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(url, {
                method: method.toUpperCase(),
                headers: safeHeaders,
                body: ['GET', 'HEAD'].includes(method.toUpperCase()) ? null : safeData,
                signal: controller.signal,
                credentials: 'same-origin' // CSRF 보호
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error('AJAX 요청 실패:', error);
            
            // 안전한 에러 메시지 반환
            const safeError = new Error(SecurityUtils.sanitizeErrorMessage(error, false));
            throw safeError;
        }
    }
    
    /**
     * 안전한 이벤트 리스너 등록
     * @param {HTMLElement|string} element - 대상 요소 또는 선택자
     * @param {string} event - 이벤트 타입
     * @param {Function} handler - 이벤트 핸들러
     * @param {Object} options - 이벤트 옵션
     */
    safeAddEventListener(element, event, handler, options = {}) {
        try {
            const el = typeof element === 'string' ? document.querySelector(element) : element;
            if (!el) {
                console.warn('⚠️ 요소를 찾을 수 없습니다:', element);
                return;
            }
            
            // 핸들러 래핑 (에러 처리 및 보안 검사)
            const wrappedHandler = (e) => {
                try {
                    // 기본적인 보안 검사
                    if (e.isTrusted === false) {
                        console.warn('⚠️ 신뢰할 수 없는 이벤트 감지');
                        return;
                    }
                    
                    handler.call(this, e);
                    
                } catch (error) {
                    console.error('이벤트 핸들러 오류:', error);
                    
                    // 사용자에게 안전한 메시지 표시
                    const safeMessage = SecurityUtils.sanitizeErrorMessage(error, false);
                    this.showSafeAlert(safeMessage);
                }
            };
            
            el.addEventListener(event, wrappedHandler, options);
            
        } catch (error) {
            console.error('이벤트 리스너 등록 실패:', error);
        }
    }
    
    /**
     * 안전한 알림 표시
     * @param {string} message - 표시할 메시지
     * @param {string} type - 알림 유형 ('info', 'warning', 'error')
     */
    showSafeAlert(message, type = 'info') {
        try {
            // 메시지 정제
            const safeMessage = SecurityUtils.escapeHtml(message);
            
            // 커스텀 알림 요소 생성
            const alertDiv = document.createElement('div');
            alertDiv.className = `safe-alert safe-alert-${type}`;
            alertDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px;
                background: ${type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
                color: ${type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
                border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
                border-radius: 4px;
                max-width: 300px;
                z-index: 10000;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            `;
            alertDiv.textContent = safeMessage;
            
            // 닫기 버튼 추가
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                float: right;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                margin-left: 10px;
            `;
            closeBtn.onclick = () => alertDiv.remove();
            
            alertDiv.appendChild(closeBtn);
            document.body.appendChild(alertDiv);
            
            // 자동 제거 (5초 후)
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
            
        } catch (error) {
            console.error('알림 표시 실패:', error);
            // 폴백으로 기본 alert 사용
            alert(SecurityUtils.escapeHtml(message));
        }
    }
    
    /**
     * 입력 필드 실시간 검증
     * @param {HTMLInputElement|string} input - 입력 요소 또는 선택자
     * @param {Function} validator - 검증 함수
     */
    addInputValidation(input, validator) {
        try {
            const inputEl = typeof input === 'string' ? document.querySelector(input) : input;
            if (!inputEl) {
                console.warn('⚠️ 입력 요소를 찾을 수 없습니다:', input);
                return;
            }
            
            // 실시간 검증 이벤트 추가
            const validateInput = () => {
                const value = inputEl.value;
                const isValid = validator(value);
                
                // 시각적 피드백
                inputEl.classList.toggle('invalid', !isValid);
                inputEl.classList.toggle('valid', isValid);
                
                // 접근성을 위한 aria 속성 설정
                inputEl.setAttribute('aria-invalid', !isValid ? 'true' : 'false');
            };
            
            // 이벤트 리스너 등록
            inputEl.addEventListener('input', validateInput);
            inputEl.addEventListener('blur', validateInput);
            
        } catch (error) {
            console.error('입력 검증 설정 실패:', error);
        }
    }
    
    /**
     * CSRF 토큰 갱신
     */
    refreshCSRFToken() {
        this.csrfToken = SecurityUtils.generateCSRFToken();
        
        // 모든 숨겨진 CSRF 입력 필드 업데이트
        const csrfInputs = document.querySelectorAll('input[name="_csrf"]');
        csrfInputs.forEach(input => {
            input.value = this.csrfToken;
        });
        
        console.log('🔄 CSRF 토큰 갱신 완료');
    }
    
    /**
     * 정제된 요소들 정리
     */
    cleanup() {
        this.sanitizedElements.clear();
        console.log('🧹 SecureUIController 정리 완료');
    }
}

console.log('🛡️ ui-controller-secure.js 모듈 로드 완료');
