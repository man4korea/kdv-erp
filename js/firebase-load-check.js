// Firebase 모듈 로드 실패시 백업 인증 체크
let firebaseLoadTimeout = setTimeout(() => {
    console.warn('⚠️ Firebase 모듈 로드 시간 초과 - 로그인 페이지로 이동');
    window.location.href = 'index.html';
    }, 1000); // 1초 대기

// Firebase 모듈이 성공적으로 로드되면 타이머 해제
window.addEventListener('firebaseReady', () => {
    console.log('✅ Firebase 모듈 로드 완료');
    clearTimeout(firebaseLoadTimeout);
}); 