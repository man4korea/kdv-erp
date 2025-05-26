// 📁 js/login.js
// KDV 시스템 - 로그인 페이지 스크립트 (CDN 호환 버전)
// Create at 250526_1400 Ver1.01

// CDN 방식으로 변경 - import 문 제거

// 전역 변수
let loginManager;

// Firebase 초기화 대기 및 로그인 매니저 설정
async function initializeApp() {
    try {
        console.log('🚀 앱 초기화 시작...');
        
        // Firebase 초기화 대기
        const firebaseServices = await window.waitForFirebaseAndInitialize();
        console.log('✅ Firebase 서비스 준비 완료');
        
        // 로그인 매니저 초기화 (window 전역 객체에서 가져오기)
        if (typeof window.LoginManager !== 'undefined') {
            loginManager = new window.LoginManager();
            window.loginManager = loginManager;
            console.log('🔐 LoginManager 초기화 완료');
        } else if (typeof window.authSystem !== 'undefined') {
            // authSystem이 있다면 그것을 사용
            loginManager = window.authSystem.loginManager;
            window.loginManager = loginManager;
            console.log('🔐 AuthSystem의 LoginManager 사용');
        } else {
            throw new Error('LoginManager 클래스를 찾을 수 없습니다. auth.js가 올바르게 로드되었는지 확인하세요.');
        }
        
        // Firebase 서비스를 전역에 등록 (디버깅용)
        window.firebase = firebaseServices;
        
        console.log('✅ 앱 초기화 완료');
        return true;
        
    } catch (error) {
        console.error('❌ 앱 초기화 실패:', error);
        showFirebaseError('시스템 초기화에 실패했습니다: ' + error.message);
        return false;
    }
}

// Firebase 연결 오류 표시 함수
function showFirebaseError(message) {
    const errorDiv = document.getElementById('generalError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.color = 'var(--danger)';
        errorDiv.style.backgroundColor = 'var(--bg-danger)';
        errorDiv.classList.add('show');
    }
    
    // 로그인 버튼 비활성화
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = '시스템 연결 실패';
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM 로드 완료');
    
    // 앱 초기화
    const initSuccess = await initializeApp();
    if (!initSuccess) {
        return; // 초기화 실패시 종료
    }
    
    // 이미 로그인되어 있는지 확인
    try {
        const sessionCheck = await loginManager.checkExistingSession();
        
        // 로그인 상태면 메인 페이지로 이동
        if (sessionCheck.isLoggedIn) {
            console.log('🔄 이미 로그인됨 - 메인 페이지로 이동');
            window.location.href = 'dashboard.html';
            return;
        }
    } catch (error) {
        console.warn('⚠️ 기존 세션 확인 실패:', error);
        // 세션 확인 실패해도 로그인 페이지는 표시
    }
    
    // 폼 이벤트 리스너 설정
    setupFormEventListeners();
    
    // 테스트 계정 정보 표시 (개발 모드에서만)
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
        showTestAccountInfo();
    }
});

/**
 * 폼 이벤트 리스너 설정
 */
function setupFormEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    
    // 로그인 폼 제출 이벤트
    loginForm.addEventListener('submit', handleLoginSubmit);
    
    // 입력 필드 검증 이벤트
    emailInput.addEventListener('blur', validateEmail);
    passwordInput.addEventListener('blur', validatePassword);
    
    // 입력 시 오류 메시지 제거
    emailInput.addEventListener('input', clearFieldError);
    passwordInput.addEventListener('input', clearFieldError);
    
    // 비밀번호 찾기 클릭 이벤트 (임시)
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        alert('비밀번호 재설정 기능은 준비 중입니다.\\n시스템 관리자에게 문의해주세요.');
    });
}

/**
 * 로그인 폼 제출 처리
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // 입력 검증
    if (!validateForm(email, password)) {
        return;
    }
    
    // 로그인 시도
    try {
        setLoadingState(true);
        clearAllErrors();
        
        const result = await loginManager.login(email, password, rememberMe);
        
        if (result.success) {
            // 로그인 성공
            console.log('✅ 로그인 성공:', result.user.email);
            showSuccessMessage('로그인 성공! 메인 페이지로 이동합니다...');
            
            // 1.5초 후 메인 페이지로 이동
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            // 로그인 실패
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('❌ 로그인 오류:', error);
        showGeneralError(getErrorMessage(error));
    } finally {
        setLoadingState(false);
    }
}

/**
 * 폼 검증
 */
function validateForm(email, password) {
    let isValid = true;
    
    // 이메일 검증
    if (!email) {
        showFieldError('email', '이메일 주소를 입력해주세요.');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError('email', '올바른 이메일 형식이 아닙니다.');
        isValid = false;
    }
    
    // 비밀번호 검증
    if (!password) {
        showFieldError('password', '비밀번호를 입력해주세요.');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError('password', '비밀번호는 6자 이상이어야 합니다.');
        isValid = false;
    }
    
    return isValid;
}

/**
 * 이메일 형식 검증
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 개별 필드 검증
 */
function validateEmail() {
    const email = document.getElementById('email').value.trim();
    if (email && !isValidEmail(email)) {
        showFieldError('email', '올바른 이메일 형식이 아닙니다.');
    } else {
        clearFieldError('email');
    }
}

function validatePassword() {
    const password = document.getElementById('password').value;
    if (password && password.length < 6) {
        showFieldError('password', '비밀번호는 6자 이상이어야 합니다.');
    } else {
        clearFieldError('password');
    }
}

/**
 * 로딩 상태 설정
 */
function setLoadingState(isLoading) {
    const loginButton = document.getElementById('loginButton');
    const buttonText = loginButton.querySelector('.button-text');
    
    if (isLoading) {
        loginButton.disabled = true;
        loginButton.classList.add('loading');
        buttonText.textContent = '로그인 중...';
    } else {
        loginButton.disabled = false;
        loginButton.classList.remove('loading');
        buttonText.textContent = '로그인';
    }
}

/**
 * 오류 메시지 표시/제거 함수들
 */
function showFieldError(fieldName, message) {
    const input = document.getElementById(fieldName);
    const errorDiv = document.getElementById(fieldName + 'Error');
    
    input.classList.add('error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function clearFieldError(fieldName) {
    if (typeof fieldName === 'string') {
        const input = document.getElementById(fieldName);
        const errorDiv = document.getElementById(fieldName + 'Error');
        
        input.classList.remove('error');
        errorDiv.classList.remove('show');
    } else {
        // 이벤트 객체인 경우
        const fieldName = fieldName.target.id;
        clearFieldError(fieldName);
    }
}

function showGeneralError(message) {
    const errorDiv = document.getElementById('generalError');
    errorDiv.textContent = message;
    errorDiv.style.color = 'var(--danger)';
    errorDiv.style.backgroundColor = 'var(--bg-danger)';
    errorDiv.classList.add('show');
}

function clearAllErrors() {
    clearFieldError('email');
    clearFieldError('password');
    const generalError = document.getElementById('generalError');
    generalError.classList.remove('show');
    generalError.style.backgroundColor = '';
}

function showSuccessMessage(message) {
    // 성공 메시지를 일반 오류 영역에 표시 (스타일 변경)
    const errorDiv = document.getElementById('generalError');
    errorDiv.textContent = message;
    errorDiv.style.color = 'var(--success)';
    errorDiv.style.backgroundColor = 'var(--bg-success)';
    errorDiv.classList.add('show');
}

/**
 * Firebase 오류 메시지 한국어 변환
 */
function getErrorMessage(error) {
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
    
    return errorMessages[errorCode] || '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
}

/**
 * 테스트 계정 정보 표시 (개발 모드)
 */
function showTestAccountInfo() {
    console.log('🔧 개발 모드 - 테스트 계정 정보:');
    console.log('이메일: man4korea@gmail.com');
    console.log('비밀번호: dmlwjdqn@Wkd24');
    
    // 페이지에 테스트 정보 표시
    const systemInfo = document.querySelector('.system-info');
    const testInfo = document.createElement('div');
    testInfo.style.marginTop = '10px';
    testInfo.style.padding = '10px';
    testInfo.style.backgroundColor = '#fff3cd';
    testInfo.style.border = '1px solid #ffeaa7';
    testInfo.style.borderRadius = '4px';
    testInfo.style.fontSize = '12px';
    testInfo.innerHTML = `
        <strong>🧪 테스트 계정 (개발용)</strong><br>
        이메일: man4korea@gmail.com<br>
        비밀번호: dmlwjdqn@Wkd24
    `;
    systemInfo.appendChild(testInfo);
} 