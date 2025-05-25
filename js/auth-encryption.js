/*
📁 js/auth-encryption.js
KDV 시스템 - 보안 및 암호화 모듈
Create at 250525_1910 Ver1.00
*/

// Firebase Authentication 관련 함수들 import
import { 
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';

// Firebase 설정에서 auth import
import { auth } from './firebase-config.js';

/**
 * 보안 및 암호화 관리 클래스
 * 비밀번호 재설정, 로그 관리, 데이터 보안 담당
 */
export class EncryptionManager {
    constructor() {
        console.log('🔐 EncryptionManager 초기화 완료');
    }
    
    /**
     * 비밀번호 재설정 이메일 발송
     * @param {string} email - 이메일 주소
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async sendPasswordReset(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            console.log('📧 비밀번호 재설정 이메일 발송 완료:', email);
            
            // 비밀번호 재설정 요청 로그
            this.logSecurityEvent('password_reset_request', email);
            
            return { success: true };
        } catch (error) {
            console.error('❌ 비밀번호 재설정 실패:', error);
            
            // 실패 로그
            this.logSecurityEvent('password_reset_failed', email, error.code);
            
            return {
                success: false,
                error: error.code || error.message
            };
        }
    }
    
    /**
     * 로컬 사용자 데이터 정리
     * 보안상 중요한 로컬 데이터 삭제
     */
    clearLocalUserData() {
        try {
            // 로컬 스토리지에서 사용자 관련 데이터 제거
            const keysToRemove = [
                'kdv_user_preferences',
                'kdv_auth_token',
                'kdv_session_data'
            ];
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // 세션 스토리지 정리
            const sessionKeysToRemove = [
                'kdv_temp_data',
                'kdv_form_data',
                'kdv_cache'
            ];
            
            sessionKeysToRemove.forEach(key => {
                sessionStorage.removeItem(key);
            });
            
            console.log('🧹 로컬 사용자 데이터 정리 완료');
            
            // 데이터 정리 로그
            this.logSecurityEvent('local_data_cleared');
            
        } catch (error) {
            console.error('❌ 로컬 데이터 정리 실패:', error);
        }
    }
    
    /**
     * 로그인 이벤트 로그 기록
     * @param {string} email - 사용자 이메일
     * @param {boolean} success - 성공 여부
     * @param {string} errorCode - 오류 코드 (실패시)
     */
    logLoginEvent(email, success, errorCode = null) {
        const logData = {
            timestamp: new Date().toISOString(),
            event: 'login_attempt',
            email: email,
            success: success,
            errorCode: errorCode,
            userAgent: navigator.userAgent,
            ip: 'N/A' // 클라이언트에서는 실제 IP 확인 불가
        };
        
        console.log('📊 로그인 이벤트:', logData);
        
        // 보안 이벤트 저장 (선택적)
        this.storeSecurityLog(logData);
    }
    
    /**
     * 로그아웃 이벤트 로그 기록
     * @param {string} email - 사용자 이메일
     */
    logLogoutEvent(email) {
        const logData = {
            timestamp: new Date().toISOString(),
            event: 'logout',
            email: email,
            userAgent: navigator.userAgent
        };
        
        console.log('📊 로그아웃 이벤트:', logData);
        
        // 보안 이벤트 저장
        this.storeSecurityLog(logData);
    }
    
    /**
     * 보안 이벤트 로그 기록
     * @param {string} eventType - 이벤트 타입
     * @param {string} email - 관련 이메일 (선택적)
     * @param {string} details - 추가 세부사항 (선택적)
     */
    logSecurityEvent(eventType, email = null, details = null) {
        const logData = {
            timestamp: new Date().toISOString(),
            event: eventType,
            email: email,
            details: details,
            userAgent: navigator.userAgent,
            sessionId: this.generateSessionId()
        };
        
        console.log('🔒 보안 이벤트:', logData);
        
        // 로그 저장
        this.storeSecurityLog(logData);
    }
    
    /**
     * 보안 로그 저장
     * @param {object} logData - 로그 데이터
     */
    storeSecurityLog(logData) {
        try {
            // 로컬 스토리지에 보안 로그 저장 (최근 50개만 유지)
            const existingLogs = JSON.parse(localStorage.getItem('kdv_security_logs') || '[]');
            existingLogs.push(logData);
            
            // 최근 50개 로그만 유지
            if (existingLogs.length > 50) {
                existingLogs.splice(0, existingLogs.length - 50);
            }
            
            localStorage.setItem('kdv_security_logs', JSON.stringify(existingLogs));
            
            // 추후 서버로 로그 전송 가능
            // this.sendLogToServer(logData);
            
        } catch (error) {
            console.error('❌ 보안 로그 저장 실패:', error);
        }
    }
    
    /**
     * 세션 ID 생성
     * @returns {string} 고유한 세션 ID
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 간단한 문자열 해시 생성 (보안용 아님, 식별용)
     * @param {string} str - 해시할 문자열
     * @returns {string} 해시값
     */
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit integer로 변환
        }
        
        return Math.abs(hash).toString(16);
    }
    
    /**
     * 보안 로그 조회
     * @param {number} limit - 조회할 로그 수 (기본: 10)
     * @returns {array} 보안 로그 배열
     */
    getSecurityLogs(limit = 10) {
        try {
            const logs = JSON.parse(localStorage.getItem('kdv_security_logs') || '[]');
            return logs.slice(-limit).reverse(); // 최신 순으로 반환
        } catch (error) {
            console.error('❌ 보안 로그 조회 실패:', error);
            return [];
        }
    }
    
    /**
     * 보안 로그 초기화
     */
    clearSecurityLogs() {
        try {
            localStorage.removeItem('kdv_security_logs');
            console.log('🧹 보안 로그 초기화 완료');
            
            // 로그 초기화 이벤트 기록
            this.logSecurityEvent('security_logs_cleared');
        } catch (error) {
            console.error('❌ 보안 로그 초기화 실패:', error);
        }
    }
}

console.log('📄 auth-encryption.js 모듈 로드 완료');
