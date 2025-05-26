// DOM 로드 즉시 기본 햄버거 기능 연결 (UI 컨트롤러 로드 전에도 작동)
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍔 기본 햄버거 기능 초기화');
    
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    
    // 기본 토글 함수
    function toggleSidebar() {
        if (sidebar && sidebar.classList.contains('active')) {
            // 닫기
            sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            if (hamburgerBtn) hamburgerBtn.classList.remove('active');
            console.log('🔴 사이드바 닫힘');
        } else if (sidebar) {
            // 열기
            sidebar.classList.add('active');
            if (sidebarOverlay) sidebarOverlay.classList.add('active');
            if (hamburgerBtn) hamburgerBtn.classList.add('active');
            console.log('🟢 사이드바 열림');
        }
    }
    
    // 이벤트 연결
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🍔 햄버거 버튼 클릭됨');
            toggleSidebar();
        });
        console.log('✅ 햄버거 버튼 이벤트 연결 완료');
    } else {
        console.error('❌ 햄버거 버튼을 찾을 수 없음');
    }
    
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleSidebar();
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }
    
    // ESC 키로 사이드바 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
    
    // 전역 함수로 등록 (디버깅용)
    window.toggleSidebarFallback = toggleSidebar;
}); 