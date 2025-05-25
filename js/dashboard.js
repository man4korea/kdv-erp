/* 📁 js/dashboard.js */
/* 메인 대시보드 로직 - KDV ERP 시스템 */
/* Create at 250524_1445 Ver1.00 */

// Firebase 및 인증 모듈 import
import { LoginManager, checkPageAccess, formatUserInfo } from './auth.js';
import { app, db, auth } from './firebase-config.js';

// 메인 UI 컨트롤 import
import './main.js';

// 전역 변수
let loginManager;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 메인 대시보드 페이지 로드');
    
    // 로딩 표시
    showLoading(true);
    
    try {
        // 로그인 매니저 초기화
        loginManager = new LoginManager();
        window.loginManager = loginManager;
        
        // Firebase 인증 상태가 확정될 때까지 대기
        const sessionCheck = await loginManager.checkExistingSession();
        console.log('🔐 세션 확인 결과:', sessionCheck);
        
        // 로그인 상태 확인
        if (!sessionCheck.isLoggedIn) {
            console.log('❌ 로그인 필요 - 로그인 페이지로 이동');
            window.location.href = 'login.html';
            return;
        }
        
        // 페이지 접근 권한 확인 - 프로필 로드를 기다림
        await new Promise(resolve => setTimeout(resolve, 500)); // 프로필 로드 대기
        const currentUser = loginManager.getCurrentUser();
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
        await updateUserInfo();
        
        // 대시보드 데이터 로드
        await loadDashboardData();
        
        console.log('✅ 대시보드 초기화 완료');
        
    } catch (error) {
        console.error('❌ 대시보드 초기화 실패:', error);
        alert('대시보드를 로드하는 중 오류가 발생했습니다.');
    } finally {
        showLoading(false);
    }
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
        userAvatar.textContent = firstChar;
        
        // 사용자 이름 표시 (이메일의 @ 앞부분)
        const displayName = email.split('@')[0];
        userName.textContent = displayName;
        
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
function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (show) {
        loadingOverlay.classList.add('show');
    } else {
        loadingOverlay.classList.remove('show');
    }
}

// 전역 함수들
window.showNotifications = function() {
    alert('알림 기능은 준비 중입니다.');
}

window.showUserMenu = function() {
    const currentUser = loginManager.getCurrentUser();
    const userInfo = formatUserInfo(currentUser);
    alert(`사용자 정보:\\n${userInfo}\\n\\n- 프로필 설정\\n- 계정 관리\\n- 로그아웃`);
}

window.showComingSoon = function() {
    alert('해당 기능은 준비 중입니다.\\n인사관리 메뉴만 현재 이용 가능합니다.');
}

window.showAllActivity = function() {
    alert('전체 활동 로그 페이지로 이동합니다.\\n(준비 중)');
}

window.handleLogout = async function() {
    if (confirm('로그아웃 하시겠습니까?')) {
        showLoading(true);
        
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
    loadDashboardData
};
