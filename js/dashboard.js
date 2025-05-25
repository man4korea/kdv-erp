/* 📁 js/dashboard.js */
/* 메인 대시보드 로직 - KDV ERP 시스템 */
/* Create at 250525_1030 Ver1.10 */

// Firebase 및 인증 모듈 import
import { LoginManager, checkPageAccess, formatUserInfo } from './auth.js';
import { app, db, auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';
import { globalPerformanceDashboard } from './performance-dashboard.js';

// 메인 UI 컨트롤 import
import './main.js';

// 전역 변수
let loginManager;
let authCheckComplete = false;

// Firebase 인증 상태 직접 모니터링
function initializeAuthCheck() {
    console.log('🔥 Firebase 인증 상태 모니터링 시작');
    
    // 로딩 화면 즉시 표시
    showLoading(true, '사용자 인증 중...');
    
    // Firebase onAuthStateChanged로 즉시 인증 상태 확인
    onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('🔍 Firebase 인증 상태 변경:', {
            hasUser: !!firebaseUser,
            email: firebaseUser?.email,
            uid: firebaseUser?.uid
        });
        
        // 미로그인시 즉시 리디렉션
        if (!firebaseUser) {
            console.log('❌ 미로그인 상태 - 로그인 페이지로 이동');
            authCheckComplete = true;
            showLoading(false);
            window.location.href = 'login.html';
            return;
        }
        
        // 로그인된 경우 대시보드 초기화
        try {
            await initializeDashboard(firebaseUser);
        } catch (error) {
            console.error('❌ 대시보드 초기화 실패:', error);
            alert('대시보드를 로드하는 중 오류가 발생했습니다.');
        } finally {
            authCheckComplete = true;
            showLoading(false);
        }
    });
}

// 대시보드 초기화 함수
async function initializeDashboard(firebaseUser) {
    console.log('🚀 대시보드 초기화 시작', firebaseUser.email);
    
    // 로딩 메시지 업데이트
    showLoading(true, '대시보드 초기화 중...');
    
    // 로그인 매니저 초기화
    loginManager = new LoginManager();
    window.loginManager = loginManager;
    
    // 사용자 프로필 로드 대기 (백그라운드로 로드 중)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 번거롭지만 더 안전한 권한 체크
    const currentUser = loginManager.getCurrentUser();
    
    // 기본 권한 체크 (사용자 프로필이 있는 경우)
    if (currentUser && currentUser.profile) {
        const hasPermission = loginManager.checkUserPermission('일반');
        if (!hasPermission) {
            console.warn('⚠️ 접근 권한이 부족합니다');
            alert('이 페이지에 접근하려면 일반 이상의 권한이 필요합니다.');
            await loginManager.logout();
            window.location.href = 'login.html';
            return;
        }
    }
    
    // 사용자 정보 표시
    showLoading(true, '사용자 정보 로딩 중...');
    await updateUserInfo();
    
    // 대시보드 데이터 로드
    showLoading(true, '대시보드 데이터 로딩 중...');
    await loadDashboardData();
    
    console.log('✅ 대시보드 초기화 완료');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 메인 대시보드 페이지 로드');
    
    // Firebase 인증 체크 시작
    initializeAuthCheck();
});

/**
 * 사용자 정보 업데이트
 */
async function updateUserInfo() {
    const currentUser = loginManager.getCurrentUser();
    
    if (currentUser.isLoggedIn && currentUser.user) {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        
        // 사용자 이름 첫 글자로 아바타 설정
        const email = currentUser.user.email;
        const firstChar = email.charAt(0).toUpperCase();
        if (userAvatar) userAvatar.textContent = firstChar;
        
        // 사용자 이름 표시 (이메일의 @ 앞부분)
        const displayName = email.split('@')[0];
        if (userName) userName.textContent = displayName;
        
        console.log('👤 사용자 정보 업데이트:', displayName);
    }
}

/**
 * 대시보드 데이터 로드
 */
async function loadDashboardData() {
    try {
        // 실제 데이터 로드 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 현재는 정적 데이터 표시
        // 추후 Firestore에서 실제 데이터를 가져올 예정
        console.log('📊 대시보드 데이터 로드 완료');
        
    } catch (error) {
        console.error('❌ 대시보드 데이터 로드 실패:', error);
    }
}

/**
 * 로딩 상태 표시/숨김
 */
function showLoading(show, message = '사용자 인증 중...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (show) {
        if (loadingMessage) loadingMessage.textContent = message;
        if (loadingOverlay) loadingOverlay.classList.add('show');
    } else {
        if (loadingOverlay) loadingOverlay.classList.remove('show');
    }
}

// 전역 함수들
window.showPerformanceDashboard = function() {
    globalPerformanceDashboard.toggle();
}

window.showComingSoon = function() {
    alert('해당 기능은 준비 중입니다.\n인사관리 메뉴만 현재 이용 가능합니다.');
}

window.showAllActivity = function() {
    alert('전체 활동 로그 페이지로 이동합니다.\n(준비 중)');
}

window.showUserMenu = function() {
    const currentUser = loginManager.getCurrentUser();
    const userInfo = formatUserInfo(currentUser);
    alert(`사용자 정보:\n${userInfo}\n\n- 프로필 설정\n- 계정 관리\n- 로그아웃`);
}

window.handleLogout = async function() {
    if (confirm('로그아웃 하시겠습니까?')) {
        showLoading(true, '로그아웃 처리 중...');
        
        try {
            const result = await loginManager.logout();
            
            if (result.success) {
                console.log('✅ 로그아웃 성공');
                window.location.href = 'login.html';
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('❌ 로그아웃 실패:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        } finally {
            showLoading(false);
        }
    }
}

// 전역 객체로 등록 (디버깅용)
window.dashboardApp = {
    loginManager,
    updateUserInfo,
    loadDashboardData,
    authCheckComplete
};
