/*
📁 js/auth-core.js
KDV 시스템 - 통합 인증 모듈 (리팩토링 완료)
Create at 250525_1920 Ver2.00
*/

// 분리된 모듈들 import
import { SessionManager } from './auth-session.js';
import { PermissionsManager } from './auth-permissions.js';
import { EncryptionManager } from './auth-encryption.js';

/**
 * 통합 로그인 관리 클래스
 * 세션, 권한, 보안 모듈을 통합하여 기존 인터페이스 호환성 유지
 */
export class LoginManager {
    constructor() {
        // 분리된 모듈들 초기화
        this.sessionManager = new SessionManager();
        this.permissionsManager = new PermissionsManager();
        this.encryptionManager = new EncryptionManager();
        
        // 세션 상태 변화 감지 설정
        this.sessionManager.setupAuthStateListener();
        
        console.log('🔐 통합 LoginManager 초기화 완료 (Ver 2.0)');
    }
    
    /**
     * 이메일/비밀번호로 로그인
     * @param {string} email - 사용자 이메일
     * @param {string} password - 사용자 비밀번호  
     * @param {boolean} rememberMe - 로그인 상태 유지 여부
     * @returns {Promise<{success: boolean, user?: object, error?: string}>}
     */
    async login(email, password, rememberMe = false) {
        try {
            // 1. 세션 로그인 시도
            const sessionResult = await this.sessionManager.login(email, password, rememberMe);
            
            if (!sessionResult.success) {
                // 로그인 실패 로그
                this.encryptionManager.logLoginEvent(email, false, sessionResult.error);
                return sessionResult;
            }
            
            // 2. 사용자 프로필 로드
            const userProfile = await this.permissionsManager.loadUserProfile(
                sessionResult.user.uid, 
                sessionResult.user.email
            );
            
            // 3. 최근 접속 시간 업데이트
            await this.permissionsManager.updateLastLoginTime(sessionResult.user.uid);
            
            // 4. 로그인 성공 로그
            this.encryptionManager.logLoginEvent(email, true);
            
            return {
                success: true,
                user: {
                    uid: sessionResult.user.uid,
                    email: sessionResult.user.email,
                    profile: userProfile
                }
            };
            
        } catch (error) {
            console.error('❌ 통합 로그인 실패:', error);
            this.encryptionManager.logLoginEvent(email, false, error.message);
            
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 로그아웃
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async logout() {
        try {
            const userEmail = this.sessionManager.getCurrentUserInfo()?.email || 'Unknown';
            
            // 1. 세션 로그아웃
            const result = await this.sessionManager.logout();
            
            if (result.success) {
                // 2. 프로필 정리
                this.permissionsManager.clearProfile();
                
                // 3. 로컬 데이터 정리
                this.encryptionManager.clearLocalUserData();
                
                // 4. 로그아웃 로그
                this.encryptionManager.logLogoutEvent(userEmail);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ 통합 로그아웃 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 현재 사용자 정보 반환 (기존 호환성 유지)
     * @returns {object|null} 현재 사용자 정보
     */
    getCurrentUser() {
        const sessionInfo = this.sessionManager.getCurrentUserInfo();
        return this.permissionsManager.getCurrentUser(sessionInfo);
    }
    
    /**
     * 기존 세션 확인 (기존 호환성 유지)
     */
    async checkExistingSession() {
        const sessionResult = await this.sessionManager.checkExistingSession();
        
        // 로그인 상태라면 프로필도 로드
        if (sessionResult.isLoggedIn && sessionResult.user) {
            const profile = await this.permissionsManager.loadUserProfile(
                sessionResult.user.uid,
                sessionResult.user.email
            );
            
            sessionResult.user.profile = profile;
        }
        
        return sessionResult;
    }
    
    /**
     * 비밀번호 재설정 이메일 발송 (기존 호환성 유지)
     * @param {string} email - 이메일 주소
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async sendPasswordReset(email) {
        return await this.encryptionManager.sendPasswordReset(email);
    }
    
    /**
     * 인증 상태 리스너 추가 (기존 호환성 유지)
     * @param {Function} callback - 콜백 함수
     */
    addAuthStateListener(callback) {
        // 세션 매니저의 리스너에 권한 정보도 포함하도록 래핑
        const wrappedCallback = async (isLoggedIn, userData) => {
            if (isLoggedIn && userData) {
                // 프로필 정보 추가
                const profile = await this.permissionsManager.loadUserProfile(
                    userData.uid,
                    userData.email
                );
                userData.profile = profile;
            }
            
            callback(isLoggedIn, userData);
        };
        
        this.sessionManager.addAuthStateListener(wrappedCallback);
    }
    
    /**
     * 인증 상태 리스너 제거 (기존 호환성 유지)
     * @param {Function} callback - 제거할 콜백 함수
     */
    removeAuthStateListener(callback) {
        this.sessionManager.removeAuthStateListener(callback);
    }
    
    // === 추가된 권한 관련 메서드들 ===
    
    /**
     * 관리자 권한 확인
     * @returns {boolean} 관리자 여부
     */
    isAdmin() {
        return this.permissionsManager.isAdmin();
    }
    
    /**
     * 특정 권한 확인
     * @param {string} permission - 권한명
     * @returns {boolean} 권한 보유 여부
     */
    hasPermission(permission) {
        return this.permissionsManager.hasPermission(permission);
    }
    
    /**
     * 사용자 권한 목록 반환
     * @returns {array} 권한 목록
     */
    getUserPermissions() {
        return this.permissionsManager.getUserPermissions();
    }
    
    /**
     * 보안 로그 조회
     * @param {number} limit - 조회할 로그 수
     * @returns {array} 보안 로그
     */
    getSecurityLogs(limit = 10) {
        return this.encryptionManager.getSecurityLogs(limit);
    }
}

console.log('📄 auth-core.js 통합 모듈 로드 완료 (Ver 2.0)');
