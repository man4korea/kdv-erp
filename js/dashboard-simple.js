// 📁 js/dashboard-simple.js
// KDV 시스템 - 대시보드 단순화 스크립트 (CDN 호환)
// Create at 250526_1530 Ver1.00

// CDN 방식으로 변경 - import 문 제거

console.log('📊 대시보드 스크립트 로드 시작');

// 전역 변수
let currentUser = null;
let isAuthChecked = false;

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 대시보드 DOM 로드 완료');
    
    // 인증 상태 확인
    await checkAuthStatus();
    
    // UI 초기화
    initializeDashboard();
    
    // 햄버거 메뉴 설정
    setupHamburgerMenu();
    
    // 로그아웃 버튼 설정
    setupLogoutButton();
});

/**
 * 인증 상태 확인
 */
async function checkAuthStatus() {
    try {
        console.log('🔍 인증 상태 확인 중...');
        
        // 로컬 스토리지에서 사용자 정보 확인
        const rememberedLogin = localStorage.getItem('kdv_remember_login');
        const userData = localStorage.getItem('kdv_user_data');
        const sessionData = sessionStorage.getItem('kdv_user_session');
        
        if (rememberedLogin === 'true' && userData) {
            currentUser = JSON.parse(userData);
            console.log('💾 저장된 로그인 정보 확인:', currentUser.email);
        } else if (sessionData) {
            currentUser = JSON.parse(sessionData);
            console.log('⏱️ 세션 데이터 확인:', currentUser.email);
        }
        
        if (!currentUser) {
            console.log('❌ 로그인 정보 없음 - 로그인 페이지로 이동');
            window.location.href = 'index.html';
            return;
        }
        
        // Firebase 인증 상태 확인 (옵션)
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const firebaseUser = firebase.auth().currentUser;
            if (!firebaseUser) {
                console.log('⚠️ Firebase 세션 만료 - 재로그인 필요');
                clearUserData();
                window.location.href = 'index.html';
                return;
            }
        }
        
        isAuthChecked = true;
        console.log('✅ 인증 확인 완료:', currentUser.email);
        
    } catch (error) {
        console.error('❌ 인증 확인 실패:', error);
        clearUserData();
        window.location.href = 'index.html';
    }
}

/**
 * 사용자 데이터 정리
 */
function clearUserData() {
    localStorage.removeItem('kdv_remember_login');
    localStorage.removeItem('kdv_user_data');
    sessionStorage.removeItem('kdv_user_session');
    currentUser = null;
}

/**
 * 대시보드 초기화
 */
function initializeDashboard() {
    if (!currentUser) return;
    
    console.log('🎛️ 대시보드 UI 초기화');
    
    // 사용자 정보 표시
    updateUserInfo();
    
    // 통계 데이터 로드
    loadDashboardStats();
    
    // 성능 모니터링 초기화
    initializePerformanceMonitoring();
}

/**
 * 사용자 정보 업데이트
 */
function updateUserInfo() {
    // 사용자 드롭다운 메뉴 업데이트
    const userButton = document.querySelector('.user-menu-button');
    if (userButton && currentUser) {
        const displayName = currentUser.displayName || currentUser.email.split('@')[0];
        userButton.innerHTML = `
            <i class="fas fa-user-circle"></i>
            <span>${displayName}</span>
            <i class="fas fa-chevron-down"></i>
        `;
    }
    
    // 웰컴 메시지 업데이트
    const welcomeElement = document.querySelector('.dashboard-welcome');
    if (welcomeElement && currentUser) {
        const displayName = currentUser.displayName || currentUser.email.split('@')[0];
        welcomeElement.textContent = `안녕하세요, ${displayName}님!`;
    }
}

/**
 * 대시보드 통계 로드
 */
function loadDashboardStats() {
    console.log('📊 대시보드 통계 로드');
    
    // 실제 데이터 로드 대신 임시 데이터 표시
    const stats = {
        totalEmployees: 158,
        newPosts: 42,
        activeProjects: 7,
        systemHealth: 98
    };
    
    // 통계 카드 업데이트
    updateStatCard('total-employees', stats.totalEmployees, '+12명');
    updateStatCard('new-posts', stats.newPosts, '+5개');
    updateStatCard('active-projects', stats.activeProjects, '진행중');
    updateStatCard('system-health', stats.systemHealth + '%', '정상');
}

/**
 * 통계 카드 업데이트
 */
function updateStatCard(cardId, value, change) {
    const card = document.getElementById(cardId);
    if (card) {
        const valueElement = card.querySelector('.stat-value');
        const changeElement = card.querySelector('.stat-change');
        
        if (valueElement) valueElement.textContent = value;
        if (changeElement) changeElement.textContent = change;
    }
}

/**
 * 햄버거 메뉴 설정
 */
function setupHamburgerMenu() {
    const hamburgerButton = document.querySelector('.hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (hamburgerButton && sidebar) {
        hamburgerButton.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            if (overlay) {
                overlay.classList.toggle('active');
            }
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
}

/**
 * 로그아웃 버튼 설정
 */
function setupLogoutButton() {
    const logoutButton = document.querySelector('#logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async function(e) {
            e.preventDefault();
            await handleLogout();
        });
    }
}

/**
 * 로그아웃 처리
 */
async function handleLogout() {
    try {
        console.log('🚪 로그아웃 시도');
        
        // Firebase 로그아웃
        if (typeof firebase !== 'undefined' && firebase.auth) {
            await firebase.auth().signOut();
        }
        
        // 로컬 데이터 정리
        clearUserData();
        
        console.log('✅ 로그아웃 완료');
        
        // 로그인 페이지로 이동
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('❌ 로그아웃 실패:', error);
        // 오류가 있어도 강제로 로그인 페이지로 이동
        clearUserData();
        window.location.href = 'index.html';
    }
}

/**
 * 성능 모니터링 초기화
 */
function initializePerformanceMonitoring() {
    console.log('📈 성능 모니터링 초기화');
    
    // 페이지 로드 시간 측정
    if (typeof performance !== 'undefined') {
        window.addEventListener('load', function() {
            const loadTime = performance.now();
            console.log(`⏱️ 페이지 로드 시간: ${Math.round(loadTime)}ms`);
        });
    }
}

/**
 * 오류 처리
 */
window.addEventListener('error', function(e) {
    console.error('❌ JavaScript 오류:', e.error);
    
    // 인증 관련 오류면 로그인 페이지로 이동
    if (e.error && e.error.message && 
        (e.error.message.includes('auth') || e.error.message.includes('login'))) {
        clearUserData();
        window.location.href = 'index.html';
    }
});

console.log('📊 대시보드 스크립트 로드 완료');