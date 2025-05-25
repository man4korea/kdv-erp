/*
📁 js/security-utils.js
KDV 시스템 - 보안 유틸리티 모듈
Create at 250525_1930 Ver1.00
*/

/**
 * 보안 유틸리티 클래스
 * XSS, CSRF, 입력 검증 등 웹 보안 기능 제공
 */
export class SecurityUtils {
    /**
     * 정적 변수 초기화
     */
    static initializeStatics() {
        if (!this.csrfToken) this.csrfToken = null;
        if (!this.requestCounts) this.requestCounts = new Map();
    }
    
    
    /**
     * HTML 문자 이스케이프 (XSS 방어)
     * @param {string} str - 이스케이프할 문자열
     * @returns {string} 이스케이프된 문자열
     */
    static escapeHtml(str) {
        if (typeof str !== 'string') return '';
        
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        
        return str.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
    }
    
    /**
     * DOMPurify를 사용한 HTML 정제 (XSS 방어)
     * @param {string} dirty - 정제할 HTML 문자열
     * @param {Object} config - DOMPurify 설정 옵션
     * @returns {string} 정제된 HTML 문자열
     */
    static sanitizeHtml(dirty, config = {}) {
        if (typeof dirty !== 'string') return '';
        
        // DOMPurify가 로드되지 않은 경우 기본 이스케이프 사용
        if (typeof DOMPurify === 'undefined') {
            console.warn('⚠️ DOMPurify가 로드되지 않음. 기본 이스케이프 사용');
            return this.escapeHtml(dirty);
        }
        
        // 기본 DOMPurify 설정
        const defaultConfig = {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span'],
            ALLOWED_ATTR: ['class'],
            FORBID_TAGS: ['script', 'object', 'embed', 'style', 'link'],
            FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'style'],
            ...config
        };
        
        try {
            return DOMPurify.sanitize(dirty, defaultConfig);
        } catch (error) {
            console.error('❌ DOMPurify 정제 실패:', error);
            return this.escapeHtml(dirty); // 실패 시 기본 이스케이프 사용
        }
    }
    
    /**
     * 안전한 innerHTML 설정 (XSS 방어)
     * @param {HTMLElement} element - 대상 요소
     * @param {string} content - 설정할 내용
     * @param {Object} config - 정제 설정
     */
    static safeSetInnerHTML(element, content, config = {}) {
        if (!element || typeof content !== 'string') {
            console.warn('⚠️ safeSetInnerHTML: 유효하지 않은 매개변수');
            return;
        }
        
        const sanitizedContent = this.sanitizeHtml(content, config);
        element.innerHTML = sanitizedContent;
        
        // 보안 로그
        if (content !== sanitizedContent) {
            console.log('🔒 XSS 방어: 콘텐츠가 정제되었습니다');
        }
    }
    
    /**
     * 안전한 textContent 설정 (완전한 XSS 방어)
     * @param {HTMLElement} element - 대상 요소
     * @param {string} content - 설정할 텍스트
     */
    static safeSetTextContent(element, content) {
        if (!element) {
            console.warn('⚠️ safeSetTextContent: 유효하지 않은 요소');
            return;
        }
        
        element.textContent = typeof content === 'string' ? content : String(content);
    }
    
    /**
     * URL 검증 및 정제 (XSS 방어)
     * @param {string} url - 검증할 URL
     * @param {Array} allowedDomains - 허용된 도메인 목록
     * @returns {string|null} 안전한 URL 또는 null
     */
    static sanitizeUrl(url, allowedDomains = []) {
        if (typeof url !== 'string') return null;
        
        try {
            const urlObj = new URL(url);
            
            // 위험한 프로토콜 차단
            const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
            if (dangerousProtocols.includes(urlObj.protocol)) {
                console.warn('🚫 위험한 프로토콜 차단:', urlObj.protocol);
                return null;
            }
            
            // 허용된 도메인 확인 (설정된 경우)
            if (allowedDomains.length > 0 && !allowedDomains.includes(urlObj.hostname)) {
                console.warn('🚫 허용되지 않은 도메인:', urlObj.hostname);
                return null;
            }
            
            return urlObj.href;
        } catch (error) {
            console.warn('⚠️ URL 파싱 실패:', error.message);
            return null;
        }
    }
    
    /**
     * HTML 태그 제거 (추가 XSS 방어)
     * @param {string} str - 정제할 문자열
     * @returns {string} 태그가 제거된 문자열
     */
    static stripHtml(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/<[^>]*>/g, '');
    }
    
    /**
     * SQL 인젝션 위험 문자 검사
     * @param {string} input - 검사할 입력값
     * @returns {boolean} 위험한 패턴 포함 여부
     */
    static hasSqlInjectionRisk(input) {
        if (typeof input !== 'string') return false;
        
        const dangerousPatterns = [
            /('|(\\')|(;)|(\\)|(union)|(select)|(insert)|(delete)|(update)|(drop)|(create)|(alter)|(exec)|(execute)|(script)|(javascript)|(vbscript)|(onload)|(onerror)|(onclick))/gi,
            /(--|\*\/|\*|\/\*)/g,
            /(\b(exec|execute|sp_|xp_)\b)/gi
        ];
        
        return dangerousPatterns.some(pattern => pattern.test(input));
    }
    
    /**
     * 이메일 형식 검증
     * @param {string} email - 검증할 이메일
     * @returns {boolean} 유효성 여부
     */
    static isValidEmail(email) {
        if (typeof email !== 'string') return false;
        
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email) && email.length <= 254;
    }
    
    /**
     * 전화번호 형식 검증 (한국)
     * @param {string} phone - 검증할 전화번호
     * @returns {boolean} 유효성 여부
     */
    static isValidPhone(phone) {
        if (typeof phone !== 'string') return false;
        
        // 한국 전화번호 패턴
        const phoneRegex = /^(01[0-9]|02|0[3-9][0-9])-?[0-9]{3,4}-?[0-9]{4}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    
    /**
     * 직원 ID 형식 검증
     * @param {string} employeeId - 검증할 직원 ID
     * @returns {boolean} 유효성 여부
     */
    static isValidEmployeeId(employeeId) {
        if (typeof employeeId !== 'string') return false;
        
        // 직원 ID: 영문 + 숫자, 4-20자
        const idRegex = /^[a-zA-Z0-9]{4,20}$/;
        return idRegex.test(employeeId);
    }
    
    /**
     * 문자열 길이 검증
     * @param {string} str - 검증할 문자열
     * @param {number} minLen - 최소 길이
     * @param {number} maxLen - 최대 길이  
     * @returns {boolean} 유효성 여부
     */
    static isValidLength(str, minLen = 1, maxLen = 255) {
        if (typeof str !== 'string') return false;
        return str.length >= minLen && str.length <= maxLen;
    }
    
    /**
     * 특수문자 허용 여부 검사
     * @param {string} str - 검사할 문자열
     * @param {boolean} allowSpecial - 특수문자 허용 여부
     * @returns {boolean} 유효성 여부
     */
    static hasOnlyAllowedChars(str, allowSpecial = false) {
        if (typeof str !== 'string') return false;
        
        const pattern = allowSpecial 
            ? /^[a-zA-Z0-9가-힣\s\-_.@()]+$/ 
            : /^[a-zA-Z0-9가-힣\s\-_.]+$/;
            
        return pattern.test(str);
    }
    
    /**
     * CSRF 토큰 생성
     * @returns {string} CSRF 토큰
     */
    static generateCSRFToken() {
        const token = 'csrf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
        this.csrfToken = token;
        
        // 세션 스토리지에 저장
        try {
            sessionStorage.setItem('csrf_token', token);
        } catch (error) {
            console.warn('⚠️ CSRF 토큰 저장 실패:', error);
        }
        
        return token;
    }
    
    /**
     * CSRF 토큰 검증
     * @param {string} token - 검증할 토큰
     * @returns {boolean} 유효성 여부
     */
    static validateCSRFToken(token) {
        if (!token || typeof token !== 'string') return false;
        
        // 메모리의 토큰과 비교
        if (this.csrfToken && token === this.csrfToken) return true;
        
        // 세션 스토리지의 토큰과 비교
        try {
            const storedToken = sessionStorage.getItem('csrf_token');
            return storedToken && token === storedToken;
        } catch (error) {
            console.warn('⚠️ CSRF 토큰 검증 실패:', error);
            return false;
        }
    }
    
    /**
     * Rate limiting 검사
     * @param {string} key - 요청 식별자 (IP, 사용자 ID 등)
     * @param {number} maxRequests - 최대 요청 수
     * @param {number} windowMs - 시간 창 (밀리초)
     * @returns {boolean} 요청 허용 여부
     */
    static checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // 해당 키의 요청 기록 가져오기
        let requests = this.requestCounts.get(key) || [];
        
        // 시간 창 이전의 요청들 제거
        requests = requests.filter(time => time > windowStart);
        
        // 현재 요청 추가
        requests.push(now);
        
        // 업데이트된 기록 저장
        this.requestCounts.set(key, requests);
        
        // 제한 검사
        return requests.length <= maxRequests;
    }
    
    /**
     * 안전한 JSON 파싱
     * @param {string} jsonString - JSON 문자열
     * @returns {Object|null} 파싱된 객체 또는 null
     */
    static safeJsonParse(jsonString) {
        try {
            if (typeof jsonString !== 'string') return null;
            
            // 잠재적으로 위험한 패턴 검사
            if (this.hasSqlInjectionRisk(jsonString)) {
                console.warn('⚠️ JSON 파싱: 위험한 패턴 감지');
                return null;
            }
            
            return JSON.parse(jsonString);
        } catch (error) {
            console.warn('⚠️ JSON 파싱 실패:', error.message);
            return null;
        }
    }
    
    /**
     * 직원 데이터 검증
     * @param {Object} employeeData - 직원 데이터
     * @returns {Object} 검증 결과 {isValid: boolean, errors: Array}
     */
    static validateEmployeeData(employeeData) {
        const errors = [];
        
        if (!employeeData || typeof employeeData !== 'object') {
            errors.push('직원 데이터가 올바르지 않습니다.');
            return { isValid: false, errors };
        }
        
        // 필수 필드 검사
        const requiredFields = ['name', 'position', 'department'];
        requiredFields.forEach(field => {
            if (!employeeData[field] || typeof employeeData[field] !== 'string') {
                errors.push(`${field}는 필수 입력 항목입니다.`);
            }
        });
        
        // 이름 검증
        if (employeeData.name) {
            if (!this.isValidLength(employeeData.name, 2, 50)) {
                errors.push('이름은 2-50자 사이여야 합니다.');
            }
            if (!this.hasOnlyAllowedChars(employeeData.name, false)) {
                errors.push('이름에 허용되지 않은 문자가 포함되어 있습니다.');
            }
        }
        
        // 이메일 검증
        if (employeeData.email && !this.isValidEmail(employeeData.email)) {
            errors.push('올바른 이메일 형식이 아닙니다.');
        }
        
        // 전화번호 검증
        if (employeeData.mobile && !this.isValidPhone(employeeData.mobile)) {
            errors.push('올바른 전화번호 형식이 아닙니다.');
        }
        
        // 직원 ID 검증 (있는 경우)
        if (employeeData.employeeId && !this.isValidEmployeeId(employeeData.employeeId)) {
            errors.push('직원 ID는 영문+숫자 4-20자여야 합니다.');
        }
        
        // SQL 인젝션 위험 검사
        Object.values(employeeData).forEach(value => {
            if (typeof value === 'string' && this.hasSqlInjectionRisk(value)) {
                errors.push('입력된 데이터에 허용되지 않은 문자가 포함되어 있습니다.');
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * 에러 메시지 안전화 (정보 노출 방지)
     * @param {Error} error - 원본 에러
     * @param {boolean} isDevelopment - 개발 환경 여부
     * @returns {string} 안전한 에러 메시지
     */
    static sanitizeErrorMessage(error, isDevelopment = false) {
        if (isDevelopment) {
            // 개발 환경에서는 상세 정보 표시
            return error.message || '알 수 없는 오류가 발생했습니다.';
        }
        
        // 운영 환경에서는 일반적인 메시지만 표시
        const safeMessages = {
            'Permission denied': '접근 권한이 없습니다.',
            'Network error': '네트워크 연결을 확인해주세요.',
            'Validation failed': '입력된 정보를 확인해주세요.',
            'Authentication failed': '인증에 실패했습니다.',
            'Not found': '요청한 정보를 찾을 수 없습니다.'
        };
        
        // 알려진 안전한 메시지면 반환, 아니면 일반 메시지 반환
        const errorMsg = error.message || '';
        for (const [key, safeMsg] of Object.entries(safeMessages)) {
            if (errorMsg.toLowerCase().includes(key.toLowerCase())) {
                return safeMsg;
            }
        }
        
        return '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    
    /**
     * 보안 헤더 설정 (가능한 경우)
     */
    static setSecurityHeaders() {
        try {
            // CSP 정책 설정 (메타 태그로)
            const cspMeta = document.createElement('meta');
            cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
            cspMeta.setAttribute('content', 
                "default-src 'self' https:; " +
                "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdnjs.cloudflare.com; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' https://fonts.gstatic.com; " +
                "img-src 'self' data: https:; " +
                "connect-src 'self' https: wss:;"
            );
            
            if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
                document.head.appendChild(cspMeta);
            }
            
            console.log('🔒 보안 헤더 설정 완료');
        } catch (error) {
            console.warn('⚠️ 보안 헤더 설정 실패:', error);
        }
    }
}

// Rate limiting 정리 (메모리 누수 방지)
setInterval(() => {
    const now = Date.now();
    const cleanupTime = now - 300000; // 5분 이전 데이터 정리
    
    SecurityUtils.requestCounts.forEach((requests, key) => {
        const filteredRequests = requests.filter(time => time > cleanupTime);
        if (filteredRequests.length === 0) {
            SecurityUtils.requestCounts.delete(key);
        } else {
            SecurityUtils.requestCounts.set(key, filteredRequests);
        }
    });
}, 60000); // 1분마다 정리

console.log('🔒 security-utils.js 모듈 로드 완료');

// SecurityUtils 정적 변수 초기화
SecurityUtils.initializeStatics();
