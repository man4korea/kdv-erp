// 📁 js/admin-panel-main.js
// KDV ERP 시스템 - 관리자 패널 메인 스크립트
// Create at 250526_1800 Ver1.00

console.log('🛡️ 관리자 패널 스크립트 로드 시작');

// 전역 변수
let currentUser = null;
let isAdminVerified = false;

// 관리자 이메일 목록 (실제 환경에서는 서버에서 관리해야 함)
const ADMIN_EMAILS = [
    'admin@kdverp.com',
    'manager@kdverp.com', 
    'kdv@admin.com',
    'admin@example.com'  // 테스트용
];

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 관리자 패널 DOM 로드 완료');
    
    // 관리자 권한 확인
    await checkAdminAccess();
    
    // 권한이 확인되면 패널 초기화
    if (isAdminVerified) {
        initializeAdminPanel();
    }
});

/**
 * 관리자 접근 권한 확인
 */
async function checkAdminAccess() {
    try {
        console.log('🔍 관리자 권한 확인 중...');
        
        // 경고 메시지 표시
        const warningElement = document.getElementById('accessWarning');
        warningElement.style.display = 'block';
        
        // 현재 사용자 정보 확인
        currentUser = await getCurrentUser();
        
        if (!currentUser) {
            console.log('❌ 로그인된 사용자 없음');
            showAccessDeniedMessage('로그인이 필요합니다.');
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 3000);
            return;
        }
        
        // 관리자 권한 확인
        const isAdmin = ADMIN_EMAILS.includes(currentUser.email);
        
        if (!isAdmin) {
            console.log('❌ 관리자 권한 없음:', currentUser.email);
            showAccessDeniedMessage('관리자 권한이 없습니다.');
            setTimeout(() => {
                window.location.href = '../../dashboard.html';
            }, 3000);
            return;
        }
        
        console.log('✅ 관리자 권한 확인 완료:', currentUser.email);
        isAdminVerified = true;
        
        // 경고 메시지 숨기기
        warningElement.style.display = 'none';
        
        // 관리자 컨텐츠 표시
        const adminContent = document.getElementById('adminContent');
        adminContent.style.display = 'grid';
        
    } catch (error) {
        console.error('❌ 관리자 권한 확인 실패:', error);
        showAccessDeniedMessage('시스템 오류가 발생했습니다.');
        setTimeout(() => {
            window.location.href = '../../dashboard.html';
        }, 3000);
    }
}

/**
 * 현재 사용자 정보 가져오기
 */
async function getCurrentUser() {
    // 세션 스토리지 먼저 확인
    const sessionData = sessionStorage.getItem('kdv_user_session');
    if (sessionData) {
        return JSON.parse(sessionData);
    }
    
    // 로컬 스토리지 확인
    const rememberedLogin = localStorage.getItem('kdv_remember_login');
    const userData = localStorage.getItem('kdv_user_data');
    
    if (rememberedLogin === 'true' && userData) {
        return JSON.parse(userData);
    }
    
    // Firebase 사용자 확인
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const firebaseUser = firebase.auth().currentUser;
        if (firebaseUser) {
            return {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                emailVerified: firebaseUser.emailVerified,
                displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0]
            };
        }
    }
    
    return null;
}

/**
 * 접근 거부 메시지 표시
 */
function showAccessDeniedMessage(message) {
    const warningElement = document.getElementById('accessWarning');
    warningElement.innerHTML = `
        <i class="fas fa-ban"></i>
        <strong>접근 거부:</strong> ${message}
    `;
    warningElement.style.backgroundColor = 'var(--bg-danger)';
    warningElement.style.color = 'var(--danger)';
    warningElement.style.borderLeftColor = 'var(--danger)';
}

/**
 * 관리자 패널 초기화
 */
function initializeAdminPanel() {
    console.log('🛡️ 관리자 패널 초기화');
    
    // 기본 통계 로드
    loadAdminStats();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    console.log('✅ 관리자 패널 초기화 완료');
}

/**
 * 관리자 통계 로드
 */
async function loadAdminStats() {
    try {
        console.log('📊 관리자 통계 로드');
        
        // 실제 환경에서는 Firebase에서 데이터를 가져와야 함
        // 현재는 더미 데이터 사용
        
        // 사용자 통계
        const totalUsers = await getTotalUsersCount();
        const activeUsers = await getActiveUsersCount();
        
        // 통계 업데이트
        updateStatValue('totalUsers', totalUsers);
        updateStatValue('activeUsers', activeUsers);
        updateStatValue('dbDocuments', '127');
        updateStatValue('errorLogs', '3');
        updateStatValue('accessLogs', '245');
        
        console.log('✅ 관리자 통계 로드 완료');
        
    } catch (error) {
        console.error('❌ 관리자 통계 로드 실패:', error);
    }
}

/**
 * 전체 사용자 수 조회
 */
async function getTotalUsersCount() {
    // 실제로는 Firebase에서 조회해야 함
    // 임시로 더미 데이터 반환
    return '15';
}

/**
 * 활성 사용자 수 조회
 */
async function getActiveUsersCount() {
    // 실제로는 Firebase에서 조회해야 함
    // 임시로 더미 데이터 반환
    return '12';
}

/**
 * 통계 값 업데이트
 */
function updateStatValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        // 애니메이션 효과 추가
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    console.log('🎯 이벤트 리스너 설정');
    
    // 키보드 단축키 (Esc: 모달 닫기)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAllModals();
        }
    });
    
    console.log('✅ 이벤트 리스너 설정 완료');
}

/**
 * 모든 모달 숨기기
 */
function hideAllModals() {
    const modals = ['userListModal', 'systemInfoModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    });
}

/**
 * 사용자 목록 로드
 */
async function loadUserList() {
    try {
        console.log('👥 사용자 목록 로드');
        
        // 모달 표시
        const modal = document.getElementById('userListModal');
        modal.style.display = 'block';
        
        // 로딩 상태 표시
        const content = document.getElementById('userListContent');
        content.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span style="margin-left: var(--spacing-2);">사용자 목록을 불러오는 중...</span>
            </div>
        `;
        
        // 실제 환경에서는 Firebase에서 사용자 목록을 가져와야 함
        // 현재는 더미 데이터 사용
        setTimeout(() => {
            const users = getDummyUserList();
            displayUserList(users);
        }, 1000);
        
    } catch (error) {
        console.error('❌ 사용자 목록 로드 실패:', error);
        showErrorMessage('사용자 목록을 불러오는데 실패했습니다.');
    }
}

/**
 * 더미 사용자 목록 생성
 */
function getDummyUserList() {
    return [
        {
            id: '1',
            email: 'admin@kdverp.com',
            displayName: '관리자',
            status: 'active',
            lastLogin: '2025-05-26 17:30',
            role: 'admin'
        },
        {
            id: '2',
            email: 'user1@company.com',
            displayName: '김철수',
            status: 'active',
            lastLogin: '2025-05-26 16:45',
            role: 'user'
        },
        {
            id: '3',
            email: 'user2@company.com',
            displayName: '이영희',
            status: 'active',
            lastLogin: '2025-05-26 15:20',
            role: 'user'
        },
        {
            id: '4',
            email: 'user3@company.com',
            displayName: '박민수',
            status: 'inactive',
            lastLogin: '2025-05-25 14:10',
            role: 'user'
        },
        {
            id: '5',
            email: 'manager@kdverp.com',
            displayName: '팀장',
            status: 'active',
            lastLogin: '2025-05-26 17:00',
            role: 'admin'
        }
    ];
}

/**
 * 사용자 목록 표시
 */
function displayUserList(users) {
    const content = document.getElementById('userListContent');
    
    if (!users || users.length === 0) {
        content.innerHTML = `
            <div class="error-message">
                <i class="fas fa-users"></i>
                등록된 사용자가 없습니다.
            </div>
        `;
        return;
    }
    
    let html = '';
    users.forEach(user => {
        const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U';
        const statusClass = user.status === 'active' ? 'active' : 'inactive';
        const statusText = user.status === 'active' ? '활성' : '비활성';
        const roleText = user.role === 'admin' ? '관리자' : '사용자';
        
        html += `
            <div class="user-list-item">
                <div class="user-info">
                    <div class="user-avatar">${initial}</div>
                    <div class="user-details">
                        <h4>${user.displayName} (${roleText})</h4>
                        <p>${user.email} • 최근 로그인: ${user.lastLogin}</p>
                    </div>
                </div>
                <div class="user-status ${statusClass}">${statusText}</div>
            </div>
        `;
    });
    
    content.innerHTML = html;
    console.log('✅ 사용자 목록 표시 완료');
}

/**
 * 사용자 목록 모달 숨기기
 */
function hideUserList() {
    const modal = document.getElementById('userListModal');
    modal.style.display = 'none';
}

/**
 * 시스템 정보 표시
 */
function showSystemInfo() {
    console.log('ℹ️ 시스템 정보 표시');
    
    const modal = document.getElementById('systemInfoModal');
    const content = document.getElementById('systemInfoContent');
    
    // 시스템 정보 생성
    const systemInfo = {
        version: 'KDV ERP v1.0',
        buildDate: '2025-05-26',
        environment: 'Production',
        database: 'Firebase Firestore',
        hosting: 'Dothome',
        uptime: calculateUptime(),
        lastUpdate: '2025-05-26 18:00',
        features: [
            '사용자 인증 (Firebase Auth)',
            '실시간 데이터베이스 (Firestore)',
            '반응형 디자인',
            '보안 강화 (DOMPurify)',
            '관리자 패널'
        ]
    };
    
    content.innerHTML = `
        <div style="padding: var(--spacing-4);">
            <div style="margin-bottom: var(--spacing-4);">
                <h4 style="color: var(--primary); margin-bottom: var(--spacing-2);">기본 정보</h4>
                <p><strong>버전:</strong> ${systemInfo.version}</p>
                <p><strong>빌드 날짜:</strong> ${systemInfo.buildDate}</p>
                <p><strong>환경:</strong> ${systemInfo.environment}</p>
                <p><strong>데이터베이스:</strong> ${systemInfo.database}</p>
                <p><strong>호스팅:</strong> ${systemInfo.hosting}</p>
            </div>
            
            <div style="margin-bottom: var(--spacing-4);">
                <h4 style="color: var(--primary); margin-bottom: var(--spacing-2);">운영 정보</h4>
                <p><strong>가동 시간:</strong> ${systemInfo.uptime}</p>
                <p><strong>마지막 업데이트:</strong> ${systemInfo.lastUpdate}</p>
            </div>
            
            <div>
                <h4 style="color: var(--primary); margin-bottom: var(--spacing-2);">주요 기능</h4>
                <ul style="margin: 0; padding-left: var(--spacing-4);">
                    ${systemInfo.features.map(feature => `<li style="margin-bottom: var(--spacing-1);">${feature}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

/**
 * 가동 시간 계산
 */
function calculateUptime() {
    // 실제로는 서버 시작 시간을 기준으로 계산해야 함
    // 현재는 더미 데이터 반환
    return '2일 14시간 32분';
}

/**
 * 시스템 정보 모달 숨기기
 */
function hideSystemInfo() {
    const modal = document.getElementById('systemInfoModal');
    modal.style.display = 'none';
}

/**
 * 데이터베이스 상태 확인
 */
async function checkDatabaseStatus() {
    try {
        console.log('🔗 데이터베이스 상태 확인');
        
        // Firebase 연결 상태 확인
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            throw new Error('Firebase가 초기화되지 않았습니다.');
        }
        
        // 간단한 테스트 쿼리 수행
        const db = firebase.firestore();
        const testQuery = await db.collection('system').limit(1).get();
        
        alert('✅ 데이터베이스 연결 상태: 정상\n연결된 컬렉션을 확인했습니다.');
        
        console.log('✅ 데이터베이스 상태 확인 완료');
        
    } catch (error) {
        console.error('❌ 데이터베이스 상태 확인 실패:', error);
        alert('❌ 데이터베이스 연결 실패\n' + error.message);
    }
}

/**
 * 오류 로그 표시
 */
function showErrorLogs() {
    console.log('📋 오류 로그 표시');
    
    // 실제 환경에서는 서버에서 로그를 가져와야 함
    const errorLogs = [
        {
            timestamp: '2025-05-26 17:45:23',
            level: 'ERROR',
            message: '사용자 인증 실패',
            details: 'Invalid password for user: test@example.com'
        },
        {
            timestamp: '2025-05-26 16:30:15',
            level: 'WARN',
            message: 'Firebase 연결 지연',
            details: 'Connection timeout exceeded 5000ms'
        },
        {
            timestamp: '2025-05-26 15:20:08',
            level: 'ERROR',
            message: '파일 업로드 실패',
            details: 'File size exceeds maximum limit (5MB)'
        }
    ];
    
    let logHtml = '<div style="max-height: 300px; overflow-y: auto;">';
    
    errorLogs.forEach(log => {
        const levelClass = log.level === 'ERROR' ? 'danger' : 'warning';
        logHtml += `
            <div style="border-left: 3px solid var(--${levelClass}); padding: var(--spacing-2); margin-bottom: var(--spacing-2); background: var(--bg-secondary);">
                <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-1);">
                    <strong style="color: var(--${levelClass});">${log.level}</strong>
                    <span style="font-size: var(--text-xs); color: var(--text-secondary);">${log.timestamp}</span>
                </div>
                <div style="font-weight: 500; margin-bottom: var(--spacing-1);">${log.message}</div>
                <div style="font-size: var(--text-sm); color: var(--text-secondary);">${log.details}</div>
            </div>
        `;
    });
    
    logHtml += '</div>';
    
    // 간단한 알림으로 표시 (실제로는 모달로 개선 필요)
    const logWindow = window.open('', '_blank', 'width=600,height=400,scrollbars=yes');
    logWindow.document.write(`
        <html>
            <head>
                <title>시스템 오류 로그</title>
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; padding: 20px; }
                    .header { background: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>🚨 시스템 오류 로그</h2>
                    <p>최근 발생한 오류들을 확인할 수 있습니다.</p>
                </div>
                ${logHtml}
            </body>
        </html>
    `);
}

/**
 * 오류 메시지 표시
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    
    const container = document.querySelector('.main-container');
    container.insertBefore(errorDiv, container.firstChild);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}

/**
 * 준비중 알림
 */
function showComingSoon() {
    alert('🚧 준비중인 기능입니다.\n향후 업데이트에서 제공될 예정입니다.');
}

/**
 * 오류 처리
 */
window.addEventListener('error', function(e) {
    console.error('❌ 관리자 패널 JavaScript 오류:', e.error);
    
    // 중요한 오류인 경우 사용자에게 알림
    if (e.error && e.error.message && 
        (e.error.message.includes('firebase') || e.error.message.includes('admin'))) {
        showErrorMessage('시스템 오류가 발생했습니다. 새로고침 후 다시 시도해주세요.');
    }
});

console.log('🛡️ 관리자 패널 스크립트 로드 완료');
