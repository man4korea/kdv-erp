// 📁 js/dashboard-simple.js
// KDV 시스템 - 대시보드 단순화 스크립트 (CDN 호환)
// Create at 250526_1600 Ver1.02

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
    // 로그아웃 버튼 설정
    setupLogoutButton();
    
    // 사이드바 커스텀 이벤트 리스너 (옵션)
    setupSidebarEvents();
});

/**
 * 인증 상태 확인
 */
async function checkAuthStatus() {
    try {
        console.log('🔍 인증 상태 확인 중...');
        
        // 세션 스토리지 먼저 확인 (우선순위)
        const sessionData = sessionStorage.getItem('kdv_user_session');
        if (sessionData) {
            currentUser = JSON.parse(sessionData);
            console.log('⏱️ 세션 데이터 확인:', currentUser.email);
            isAuthChecked = true;
            console.log('✅ 세션 기반 인증 확인 완료:', currentUser.email);
            return;
        }
        
        // 로컬 스토리지에서 기억된 로그인 확인 (두 번째 우선순위)
        const rememberedLogin = localStorage.getItem('kdv_remember_login');
        const userData = localStorage.getItem('kdv_user_data');
        
        if (rememberedLogin === 'true' && userData) {
            currentUser = JSON.parse(userData);
            console.log('💾 저장된 로그인 정보 확인:', currentUser.email);
            isAuthChecked = true;
            console.log('✅ 로컬 스토리지 기반 인증 확인 완료:', currentUser.email);
            return;
        }
        
        // Firebase 인증 상태 확인 (최종 확인)
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const firebaseUser = firebase.auth().currentUser;
            if (firebaseUser) {
                // Firebase 사용자가 있으면 임시 세션 생성
                currentUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    emailVerified: firebaseUser.emailVerified,
                    displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    lastLoginTime: new Date().toISOString()
                };
                
                // 세션에 저장
                sessionStorage.setItem('kdv_user_session', JSON.stringify(currentUser));
                
                console.log('🔥 Firebase 사용자 확인:', currentUser.email);
                isAuthChecked = true;
                console.log('✅ Firebase 기반 인증 확인 완료:', currentUser.email);
                return;
            }
        }
        
        // 모든 인증 방법 실패
        console.log('❌ 로그인 정보 없음 - 로그인 페이지로 이동');
        console.log('🔍 디버그 정보:');
        console.log('- sessionData:', !!sessionData);
        console.log('- rememberedLogin:', rememberedLogin);
        console.log('- userData:', !!userData);
        console.log('- firebase.auth():', typeof firebase !== 'undefined' && !!firebase.auth);
        
        // 잠시 대기 후 리다이렉트 (디버깅을 위해)
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
        
    } catch (error) {
        console.error('❌ 인증 확인 실패:', error);
        console.log('🔍 오류 상세:', {
            message: error.message,
            stack: error.stack
        });
        
        // 오류 발생 시에도 잠시 대기
        setTimeout(() => {
            clearUserData();
            window.location.href = 'index.html';
        }, 3000);
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
 * 사이드바 커스텀 이벤트 리스너
 */
function setupSidebarEvents() {
    // 사이드바 열기 이벤트
    document.addEventListener('sidebar:open', function(event) {
        console.log('🔓 사이드바 열림 이벤트 수신:', event.detail);
        
        // 사이드바가 열릴 때 추가 로직 (예: 다른 UI 요소 비활성화)
        // 예시: document.body.classList.add('sidebar-open');
    });
    
    // 사이드바 닫기 이벤트
    document.addEventListener('sidebar:close', function(event) {
        console.log('🔒 사이드바 닫힘 이벤트 수신:', event.detail);
        
        // 사이드바가 닫힘 때 추가 로직
        // 예시: document.body.classList.remove('sidebar-open');
    });
    
    console.log('🎆 사이드바 이벤트 리스너 설정 완료');
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