/*
📁 js/auth.js
KDV 시스템 - 인증 통합 모듈 (CDN 호환 버전)
Create at 250525_0900 Ver1.02
*/

// CDN 방식으로 변경 - import 문 제거하고 직접 구현

/**
 * 로그인 매니저 클래스 (CDN 호환)
 */
class LoginManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        
        // Firebase 인스턴스 확인
        this.checkFirebaseAvailability();
        
        console.log('🔐 LoginManager 생성 완료');
    }
    
    /**
     * Firebase 사용 가능 여부 확인
     */
    checkFirebaseAvailability() {
        // 전역 Firebase 객체 확인
        if (!window.firebaseAuth) {
            console.warn('⚠️ Firebase 인증 서비스가 초기화되지 않았습니다.');
            return false;
        }
        
        console.log('✅ Firebase 인증 서비스 사용 가능');
        return true;
    }
    
    /**
     * 이메일/비밀번호 로그인
     */
    async login(email, password, rememberMe = false) {
        try {
            console.log('🔑 로그인 시도:', email);
            
            // Firebase 인증 사용 가능 여부 확인
            if (!this.checkFirebaseAvailability()) {
                throw new Error('Firebase 인증 서비스를 사용할 수 없습니다.');
            }
            
            // 로그인 시도
            // 로그인 시도
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('✅ Firebase 로그인 성공:', user.email);
            
            // 사용자 정보 구성
            const userData = {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                displayName: user.displayName || email.split('@')[0],
                photoURL: user.photoURL,
                lastLoginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };
            
            // 현재 사용자 설정
            this.currentUser = {
                isLoggedIn: true,
                user: userData,
                profile: {
                    level: '일반', // 기본 권한
                    permissions: ['read', 'write'],
                    department: 'KDV',
                    position: '사용자'
                }
            };
            
            // 로그인 상태 유지 설정
            if (rememberMe) {
                localStorage.setItem('kdv_remember_login', 'true');
                localStorage.setItem('kdv_user_data', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('kdv_user_session', JSON.stringify(userData));
            }
            
            // 인증 상태 리스너들에게 알림
            this.notifyAuthStateChange(this.currentUser);
            
            return {
                success: true,
                user: userData,
                message: '로그인 성공'
            };
            
        } catch (error) {
            console.error('❌ 로그인 실패:', error);
            
            return {
                success: false,
                error: error.code || error.message,
                message: this.getErrorMessage(error)
            };
        }
    }
    
    /**
     * 로그아웃
     */
    async logout() {
        try {
            console.log('🚪 로그아웃 시도');
            
            // Firebase 로그아웃
            if (window.firebaseAuth) {
                await window.firebaseAuth.signOut();
            }
            
            // 로컬 데이터 정리
            this.currentUser = null;
            localStorage.removeItem('kdv_remember_login');
            localStorage.removeItem('kdv_user_data');
            sessionStorage.removeItem('kdv_user_session');
            
            // 인증 상태 리스너들에게 알림
            this.notifyAuthStateChange(null);
            
            console.log('✅ 로그아웃 완료');
            return {
                success: true,
                message: '로그아웃 완료'
            };
            
        } catch (error) {
            console.error('❌ 로그아웃 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 기존 세션 확인
     */
    async checkExistingSession() {
        try {
            console.log('🔍 기존 세션 확인 중...');
            
            // 로컬 스토리지에서 기억된 로그인 확인
            const rememberLogin = localStorage.getItem('kdv_remember_login');
            const userData = localStorage.getItem('kdv_user_data');
            
            if (rememberLogin === 'true' && userData) {
                const user = JSON.parse(userData);
                console.log('💾 저장된 로그인 정보 발견:', user.email);
                
                // Firebase 인증 상태 확인
                if (window.firebaseAuth && window.firebaseAuth.currentUser) {
                    this.currentUser = {
                        isLoggedIn: true,
                        user: user,
                        profile: {
                            level: '일반',
                            permissions: ['read', 'write'],
                            department: 'KDV',
                            position: '사용자'
                        }
                    };
                    
                    return {
                        isLoggedIn: true,
                        user: user
                    };
                }
            }
            
            // 세션 스토리지에서 임시 세션 확인
            const sessionData = sessionStorage.getItem('kdv_user_session');
            if (sessionData) {
                const user = JSON.parse(sessionData);
                console.log('⏱️ 세션 데이터 발견:', user.email);
                
                this.currentUser = {
                    isLoggedIn: true,
                    user: user,
                    profile: {
                        level: '일반',
                        permissions: ['read', 'write'],
                        department: 'KDV',
                        position: '사용자'
                    }
                };
                
                return {
                    isLoggedIn: true,
                    user: user
                };
            }
            
            console.log('❌ 유효한 세션 없음');
            return {
                isLoggedIn: false,
                user: null
            };
            
        } catch (error) {
            console.error('❌ 세션 확인 중 오류:', error);
            return {
                isLoggedIn: false,
                user: null,
                error: error.message
            };
        }
    }
    
    /**
     * 비밀번호 재설정 이메일 전송
     */
    async sendPasswordReset(email) {
        try {
            console.log('📧 비밀번호 재설정 이메일 전송:', email);
            
            if (!this.checkFirebaseAvailability()) {
                throw new Error('Firebase 인증 서비스를 사용할 수 없습니다.');
            }
            
            await window.firebaseAuth.sendPasswordResetEmail(email);
            
            console.log('✅ 비밀번호 재설정 이메일 전송 완료');
            return {
                success: true,
                message: '비밀번호 재설정 이메일이 전송되었습니다.'
            };
            
        } catch (error) {
            console.error('❌ 비밀번호 재설정 실패:', error);
            return {
                success: false,
                error: error.code || error.message,
                message: this.getErrorMessage(error)
            };
        }
    }
    
    /**
     * 현재 사용자 정보 반환
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * 인증 상태 변경 리스너 추가
     */
    addAuthStateListener(callback) {
        if (typeof callback === 'function') {
            this.authStateListeners.push(callback);
            console.log('👂 인증 상태 리스너 추가');
        }
    }
    
    /**
     * 인증 상태 변경 리스너 제거
     */
    removeAuthStateListener(callback) {
        const index = this.authStateListeners.indexOf(callback);
        if (index > -1) {
            this.authStateListeners.splice(index, 1);
            console.log('🔇 인증 상태 리스너 제거');
        }
    }
    
    /**
     * 인증 상태 변경 알림
     */
    notifyAuthStateChange(userData) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(userData);
            } catch (error) {
                console.error('❌ 인증 상태 리스너 실행 오류:', error);
            }
        });
    }
    
    /**
     * Firebase 오류 메시지 한국어 변환
     */
    getErrorMessage(error) {
        const errorCode = error.code || error.message || error;
        
        const errorMessages = {
            'auth/user-not-found': '등록되지 않은 이메일 주소입니다.',
            'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
            'auth/invalid-email': '이메일 주소 형식이 올바르지 않습니다.',
            'auth/user-disabled': '비활성화된 계정입니다. 관리자에게 문의하세요.',
            'auth/too-many-requests': '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
            'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
            'auth/invalid-credential': '인증 정보가 올바르지 않습니다.',
            'auth/operation-not-allowed': '이메일/비밀번호 로그인이 비활성화되어 있습니다.'
        };
        
        return errorMessages[errorCode] || '인증 중 오류가 발생했습니다. 다시 시도해주세요.';
    }
}

/**
 * 권한 검증 함수들
 */
function checkUserPermission(userProfile, requiredLevel) {
    if (!userProfile) return false;
    
    const levelPriority = {
        '관리자': 4,
        '매니저': 3,
        '일반': 2,
        '게스트': 1
    };
    
    const userLevel = levelPriority[userProfile.level] || 1;
    const requiredLevelNum = levelPriority[requiredLevel] || 1;
    
    return userLevel >= requiredLevelNum;
}

function checkPageAccess(currentUser, requiredLevel = '일반', redirectUrl = 'login.html') {
    // 로그인 확인
    if (!currentUser || !currentUser.isLoggedIn) {
        console.warn('⚠️ 로그인이 필요합니다.');
        if (redirectUrl && typeof window !== 'undefined') {
            window.location.href = redirectUrl;
        }
        return false;
    }
    
    // 권한 확인
    if (!checkUserPermission(currentUser.profile, requiredLevel)) {
        console.warn('⚠️ 접근 권한이 부족합니다. 필요 권한:', requiredLevel);
        if (typeof window !== 'undefined') {
            alert('접근 권한이 부족합니다.');
        }
        return false;
    }
    
    return true;
}

function isAdmin(currentUser) {
    return currentUser && 
           currentUser.isLoggedIn && 
           currentUser.profile && 
           currentUser.profile.level === '관리자';
}

function checkFeaturePermission(currentUser, feature) {
    if (!currentUser || !currentUser.isLoggedIn) return false;
    
    const permissions = currentUser.profile.permissions || [];
    return permissions.includes(feature);
}

/**
 * 유틸리티 함수들
 */
function formatUserInfo(userData) {
    if (!userData || !userData.user) {
        return {
            displayName: '게스트',
            email: '',
            status: 'offline'
        };
    }
    
    return {
        displayName: userData.user.displayName || userData.user.email.split('@')[0],
        email: userData.user.email,
        status: userData.isLoggedIn ? 'online' : 'offline',
        lastLogin: userData.user.lastLoginTime,
        level: userData.profile ? userData.profile.level : '일반'
    };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getUserStatusText(userData) {
    if (!userData || !userData.isLoggedIn) {
        return '로그아웃 상태';
    }
    
    const level = userData.profile ? userData.profile.level : '일반';
    return `${level} 사용자 (온라인)`;
}

/**
 * 인증 시스템 통합 클래스
 */
class AuthSystem {
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
        return checkUserPermission(currentUser ? currentUser.profile : null, requiredLevel);
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

// 전역 객체 등록 (CDN 방식)
if (typeof window !== 'undefined') {
    window.LoginManager = LoginManager;
    window.AuthSystem = AuthSystem;
    window.checkPageAccess = checkPageAccess;
    window.formatUserInfo = formatUserInfo;
    window.validateEmail = validateEmail;
    window.getUserStatusText = getUserStatusText;
    window.checkUserPermission = checkUserPermission;
    window.isAdmin = isAdmin;
    
    // 기본 인스턴스 생성 및 전역 등록
    const authSystem = new AuthSystem();
    window.authSystem = authSystem;
    
    // 레거시 호환을 위한 전역 함수들
    window.getAuthSystem = () => authSystem;
    window.getLoginManager = () => authSystem.loginManager;
    
    console.log('📄 auth.js CDN 모듈 로드 완료 - Ver1.02');
    console.log('🔧 사용 가능한 전역 객체:', {
        authSystem: !!window.authSystem,
        LoginManager: !!window.LoginManager,
        checkPageAccess: !!window.checkPageAccess,
        formatUserInfo: !!window.formatUserInfo
    });
}
