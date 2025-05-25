/*
📁 js/auth.js
KDV 시스템 - 인증 통합 모듈
Create at 250525_1900 Ver1.01
*/

// 인증 모듈들 import
import { LoginManager } from './auth-core.js';
import { 
    checkUserPermission,
    checkPageAccess,
    isAdmin,
    checkFeaturePermission,
    checkDataAccess,
    checkIPAccess,
    checkTimeAccess
} from './auth-validators.js';
import {
    formatUserInfo,
    extractUserName,
    formatLastLoginTime,
    getSecurityLevelIcon,
    getSecurityLevelColor,
    generateUserInitials,
    getSessionExpiryTime,
    checkPasswordStrength,
    validateEmail,
    getUserStatusText,
    formatLoginHistory,
    getUserAgent
} from './auth-utils.js';

/**
 * 인증 시스템 통합 클래스
 * 모든 인증 관련 기능을 통합하여 제공
 */
export class AuthSystem {
    constructor() {
        this.loginManager = new LoginManager();
        
        console.log('🔐 AuthSystem 초기화 완료');
    }
    
    // LoginManager 메서드들을 위임
    async login(email, password, rememberMe = false) {
        return await this.loginManager.login(email, password, rememberMe);
    }
    
    async logout() {
        return await this.loginManager.logout();
    }
    
    async checkExistingSession() {
        return await this.loginManager.checkExistingSession();
    }
    
    async sendPasswordReset(email) {
        return await this.loginManager.sendPasswordReset(email);
    }
    
    getCurrentUser() {
        return this.loginManager.getCurrentUser();
    }
    
    addAuthStateListener(callback) {
        this.loginManager.addAuthStateListener(callback);
    }
    
    removeAuthStateListener(callback) {
        this.loginManager.removeAuthStateListener(callback);
    }
    
    // 검증 기능들
    checkUserPermission(requiredLevel) {
        const currentUser = this.getCurrentUser();
        return checkUserPermission(currentUser.profile, requiredLevel);
    }
    
    checkPageAccess(requiredLevel = '일반', redirectUrl = 'login.html') {
        const currentUser = this.getCurrentUser();
        return checkPageAccess(currentUser, requiredLevel, redirectUrl);
    }
    
    isAdmin() {
        const currentUser = this.getCurrentUser();
        return isAdmin(currentUser);
    }
    
    checkFeaturePermission(feature) {
        const currentUser = this.getCurrentUser();
        return checkFeaturePermission(currentUser, feature);
    }
    
    checkDataAccess(dataRecord) {
        const currentUser = this.getCurrentUser();
        return checkDataAccess(currentUser, dataRecord);
    }
    
    checkTimeAccess() {
        const currentUser = this.getCurrentUser();
        return checkTimeAccess(currentUser);
    }
    
    // 유틸리티 기능들
    formatUserInfo() {
        const userData = this.getCurrentUser();
        return formatUserInfo(userData);
    }
    
    getUserStatusText() {
        const userData = this.getCurrentUser();
        return getUserStatusText(userData);
    }
}

// 레거시 호환성을 위한 독립적인 함수들 export
export { 
    LoginManager,
    checkUserPermission,
    checkPageAccess,
    isAdmin,
    checkFeaturePermission,
    checkDataAccess,
    checkIPAccess,
    checkTimeAccess,
    formatUserInfo,
    extractUserName,
    formatLastLoginTime,
    getSecurityLevelIcon,
    getSecurityLevelColor,
    generateUserInitials,
    getSessionExpiryTime,
    checkPasswordStrength,
    validateEmail,
    getUserStatusText,
    formatLoginHistory,
    getUserAgent
};

// 전역 객체 등록 (하위 호환성 유지)
window.LoginManager = LoginManager;
window.checkPageAccess = checkPageAccess;
window.formatUserInfo = formatUserInfo;
window.AuthSystem = AuthSystem;

// 기본 인스턴스 생성 및 전역 등록
const authSystem = new AuthSystem();
window.authSystem = authSystem;

// 레거시 호환을 위한 전역 함수들
window.getAuthSystem = () => authSystem;
window.getLoginManager = () => authSystem.loginManager;

console.log('📄 auth.js 모듈 로드 완료 - 리팩토링 버전 v1.01');
console.log('🔧 사용 가능한 전역 객체:', {
    authSystem: window.authSystem,
    LoginManager: window.LoginManager,
    checkPageAccess: window.checkPageAccess,
    formatUserInfo: window.formatUserInfo
});