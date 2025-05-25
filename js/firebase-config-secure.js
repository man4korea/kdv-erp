/*
📁 js/firebase-config-secure.js
KDV 시스템 - 보안 강화 Firebase 설정
Create at 250525_1950 Ver1.00
*/

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';
import { SecurityUtils } from './security-utils.js';

/**
 * 보안 강화된 Firebase 설정 클래스
 */
class FirebaseConfigSecure {
    constructor() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.isInitialized = false;
        this.initializationError = null;
    }
    
    /**
     * 환경별 설정 로드
     * @returns {Object} Firebase 설정 객체
     */
    loadFirebaseConfig() {
        try {
            // 1. 환경 변수에서 설정 로드 시도 (서버 사이드)
            if (typeof process !== 'undefined' && process.env) {
                const config = {
                    apiKey: process.env.FIREBASE_API_KEY,
                    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
                    appId: process.env.FIREBASE_APP_ID
                };
                
                // 모든 필수 값이 있는지 확인
                if (Object.values(config).every(value => value && value !== 'undefined')) {
                    console.log('🔧 환경변수에서 Firebase 설정 로드');
                    return config;
                }
            }
            
            // 2. window 객체에서 설정 로드 시도 (클라이언트 사이드)
            if (typeof window !== 'undefined' && window.FIREBASE_CONFIG) {
                console.log('🔧 전역 객체에서 Firebase 설정 로드');
                return window.FIREBASE_CONFIG;
            }
            
            // 3. 로컬 스토리지에서 설정 로드 시도 (보안상 권장하지 않음)
            if (typeof localStorage !== 'undefined') {
                try {
                    const storedConfig = localStorage.getItem('firebase_config');
                    if (storedConfig) {
                        const config = SecurityUtils.safeJsonParse(storedConfig);
                        if (config && this.validateConfig(config)) {
                            console.log('🔧 로컬 스토리지에서 Firebase 설정 로드');
                            return config;
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ 로컬 스토리지 설정 로드 실패:', error);
                }
            }
            
            // 4. 폴백: 개발 환경 설정 (실제 운영에서는 제거 필요)
            console.warn('⚠️ 개발용 설정 사용 - 운영 환경에서는 환경변수 사용 필수!');
            return this.getDevelopmentConfig();
            
        } catch (error) {
            console.error('❌ Firebase 설정 로드 실패:', error);
            throw new Error('Firebase 설정을 로드할 수 없습니다.');
        }
    }
    
    /**
     * 개발 환경 설정 (운영 시 제거 필요)
     * @returns {Object} 개발용 Firebase 설정
     */
    getDevelopmentConfig() {
        // 실제 운영에서는 이 메서드를 제거하고 환경변수만 사용해야 함
        return {
            apiKey: "AIzaSyAfSlSi4pNlKvMU-NBpQ3ZWSeG4QNpZiCk",
            authDomain: "kdv-sys.firebaseapp.com", 
            projectId: "kdv-sys",
            storageBucket: "kdv-sys.firebasestorage.app",
            messagingSenderId: "352925761129",
            appId: "1:352925761129:web:a9c9cf2e1154d745faecf8"
        };
    }
    
    /**
     * Firebase 설정 유효성 검사
     * @param {Object} config - 검사할 설정 객체
     * @returns {boolean} 유효성 여부
     */
    validateConfig(config) {
        const requiredFields = [
            'apiKey', 'authDomain', 'projectId', 
            'storageBucket', 'messagingSenderId', 'appId'
        ];
        
        if (!config || typeof config !== 'object') {
            return false;
        }
        
        // 모든 필수 필드가 존재하고 비어있지 않은지 확인
        return requiredFields.every(field => {
            const value = config[field];
            return value && typeof value === 'string' && value.trim().length > 0;
        });
    }
    
    /**
     * Firebase 초기화
     * @returns {Promise<boolean>} 초기화 성공 여부
     */
    async initialize() {
        try {
            if (this.isInitialized) {
                return true;
            }
            
            const firebaseConfig = this.loadFirebaseConfig();
            
            // 설정 유효성 검사
            if (!this.validateConfig(firebaseConfig)) {
                throw new Error('Firebase 설정이 올바르지 않습니다.');
            }
            
            // Firebase 앱 초기화
            this.app = initializeApp(firebaseConfig);
            this.db = getFirestore(this.app);
            this.auth = getAuth(this.app);
            
            // 보안 헤더 설정
            SecurityUtils.setSecurityHeaders();
            
            // CSRF 토큰 생성
            SecurityUtils.generateCSRFToken();
            
            this.isInitialized = true;
            console.log('🔥 보안 강화 Firebase 초기화 성공!');
            
            // 초기화 성공 로그
            this.logSecurityEvent('firebase_initialized', 'system', 'Firebase successfully initialized');
            
            return true;
            
        } catch (error) {
            this.initializationError = error;
            console.error('❌ Firebase 초기화 실패:', error);
            
            // 초기화 실패 로그
            this.logSecurityEvent('firebase_init_failed', 'system', error.message);
            
            // 사용자에게 안전한 에러 메시지 표시
            const safeMessage = SecurityUtils.sanitizeErrorMessage(error, false);
            if (typeof alert !== 'undefined') {
                alert(`시스템 초기화 실패: ${safeMessage}`);
            }
            
            return false;
        }
    }
    
    /**
     * Firebase 인스턴스 반환
     * @returns {Object} Firebase 인스턴스들
     */
    getInstances() {
        if (!this.isInitialized) {
            throw new Error('Firebase가 초기화되지 않았습니다. initialize()를 먼저 호출하세요.');
        }
        
        return {
            app: this.app,
            db: this.db,
            auth: this.auth
        };
    }
    
    /**
     * 연결 상태 확인
     * @returns {boolean} 연결 상태
     */
    isConnected() {
        return this.isInitialized && !this.initializationError;
    }
    
    /**
     * 보안 이벤트 로그 (간단한 버전)
     * @param {string} event - 이벤트 유형
     * @param {string} userId - 사용자 ID
     * @param {string} details - 상세 정보
     */
    logSecurityEvent(event, userId, details) {
        try {
            const logData = {
                timestamp: new Date().toISOString(),
                event,
                userId: userId || 'system',
                details: details || '',
                userAgent: navigator.userAgent
            };
            
            // 로컬 스토리지에 보안 로그 저장
            const existingLogs = SecurityUtils.safeJsonParse(
                localStorage.getItem('firebase_security_logs') || '[]'
            ) || [];
            
            existingLogs.push(logData);
            
            // 최근 100개 로그만 유지
            if (existingLogs.length > 100) {
                existingLogs.splice(0, existingLogs.length - 100);
            }
            
            localStorage.setItem('firebase_security_logs', JSON.stringify(existingLogs));
            
        } catch (error) {
            console.error('보안 로그 기록 실패:', error);
        }
    }
    
    /**
     * 설정 보안 강화
     * 민감한 정보를 메모리에서 제거
     */
    secureClearConfig() {
        try {
            // 개발용 설정이 메모리에 남아있지 않도록 정리
            if (window.FIREBASE_CONFIG) {
                delete window.FIREBASE_CONFIG;
            }
            
            // 로컬 스토리지의 설정 정보도 정리 (필요시)
            localStorage.removeItem('firebase_config');
            
            console.log('🧹 Firebase 설정 보안 정리 완료');
            
        } catch (error) {
            console.warn('⚠️ 설정 정리 실패:', error);
        }
    }
}

// 싱글톤 인스턴스 생성
const firebaseConfigSecure = new FirebaseConfigSecure();

// 자동 초기화
firebaseConfigSecure.initialize().then(success => {
    if (success) {
        // 초기화 성공 후 설정 정리
        setTimeout(() => {
            firebaseConfigSecure.secureClearConfig();
        }, 1000);
    }
});

// 인스턴스 export
export default firebaseConfigSecure;

// 개별 인스턴스들도 export (기존 호환성)
export const { app, db, auth } = firebaseConfigSecure.isConnected() 
    ? firebaseConfigSecure.getInstances() 
    : { app: null, db: null, auth: null };

console.log('🔒 firebase-config-secure.js 모듈 로드 완료');
