/*
📁 js/auth-session.js
KDV 시스템 - 세션 관리 모듈
Create at 250525_1910 Ver1.00
*/

// Firebase Authentication 관련 함수들 import
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';

// Firebase 설정에서 auth import
import { auth } from './firebase-config.js';

/**
 * 세션 관리 클래스
 * 로그인/로그아웃 및 인증 상태 관리 담당
 */
export class SessionManager {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];
        
        // 인증 상태 초기화 관련
        this.isAuthReady = false;
        this.authReadyCallbacks = [];
        
        console.log('🔐 SessionManager 초기화 완료');
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
            console.log('🔄 로그인 시도:', email);
            
            // 지속성 설정 (로그인 상태 유지 여부에 따라)
            const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistence);
            
            // Firebase 인증 시도
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            console.log('✅ Firebase 인증 성공:', user.uid);
            
            // 현재 사용자 정보 저장
            this.currentUser = user;
            
            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email
                }
            };
            
        } catch (error) {
            console.error('❌ 로그인 실패:', error);
            
            return {
                success: false,
                error: error.code || error.message
            };
        }
    }
    
    /**
     * 로그아웃
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async logout() {
        try {
            const userEmail = this.currentUser?.email || 'Unknown';
            
            console.log('🔄 로그아웃 진행:', userEmail);
            
            // Firebase 로그아웃
            await signOut(auth);
            
            // 로컬 상태 초기화
            this.currentUser = null;
            
            console.log('✅ 로그아웃 완료');
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ 로그아웃 실패:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * 인증 상태 변화 감지 설정
     */
    setupAuthStateListener() {
        onAuthStateChanged(auth, (user) => {
            console.log('🔄 인증 상태 변화 감지:', user ? user.email : 'No user');
            
            if (user) {
                // 로그인 상태
                this.currentUser = user;
                
                // 리스너들에게 알림
                this.notifyAuthStateListeners(true, {
                    uid: user.uid,
                    email: user.email
                });
                
            } else {
                // 로그아웃 상태
                this.currentUser = null;
                
                // 리스너들에게 알림
                this.notifyAuthStateListeners(false, null);
            }
            
            // 인증 상태 준비 완료 처리
            if (!this.isAuthReady) {
                this.isAuthReady = true;
                // 대기 중인 콜백들 실행
                this.authReadyCallbacks.forEach(callback => {
                    try {
                        callback({
                            isLoggedIn: !!user,
                            user: user ? {
                                uid: user.uid,
                                email: user.email
                            } : null
                        });
                    } catch (error) {
                        console.error('❌ 인증 준비 콜백 오류:', error);
                    }
                });
                this.authReadyCallbacks = [];
            }
        });
    }
    
    /**
     * 기존 세션 확인
     * 페이지 로드 시 이미 로그인되어 있는지 확인
     */
    async checkExistingSession() {
        return new Promise((resolve) => {
            // 이미 인증 상태가 준비되었다면 즉시 반환
            if (this.isAuthReady) {
                resolve({
                    isLoggedIn: !!this.currentUser,
                    user: this.currentUser ? {
                        uid: this.currentUser.uid,
                        email: this.currentUser.email
                    } : null
                });
                return;
            }
            
            // 인증 상태가 준비될 때까지 대기
            this.authReadyCallbacks.push(resolve);
        });
    }
    
    /**
     * 인증 상태 리스너 추가
     * @param {Function} callback - 콜백 함수
     */
    addAuthStateListener(callback) {
        this.authStateListeners.push(callback);
    }
    
    /**
     * 인증 상태 리스너 제거
     * @param {Function} callback - 제거할 콜백 함수
     */
    removeAuthStateListener(callback) {
        const index = this.authStateListeners.indexOf(callback);
        if (index > -1) {
            this.authStateListeners.splice(index, 1);
        }
    }
    
    /**
     * 인증 상태 변화를 모든 리스너에게 알림
     * @param {boolean} isLoggedIn - 로그인 상태
     * @param {object} userData - 사용자 데이터
     */
    notifyAuthStateListeners(isLoggedIn, userData) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(isLoggedIn, userData);
            } catch (error) {
                console.error('❌ 인증 상태 리스너 오류:', error);
            }
        });
    }
    
    /**
     * 현재 로그인 상태 확인
     * @returns {boolean} 로그인 상태
     */
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    /**
     * 현재 사용자 기본 정보 반환
     * @returns {object|null} 현재 사용자 정보
     */
    getCurrentUserInfo() {
        return this.currentUser ? {
            uid: this.currentUser.uid,
            email: this.currentUser.email
        } : null;
    }
}

console.log('📄 auth-session.js 모듈 로드 완료');
