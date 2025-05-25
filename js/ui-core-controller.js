/*
📁 js/ui-core-controller.js
KDV 시스템 - UI 핵심 제어 로직
Create at 250525_2200 Ver1.00
*/

/**
 * UI 핵심 제어 클래스
 * 사이드바, 메뉴, 반응형 등 기본 UI 제어 담당
 */
export class UICoreController {
    constructor() {
        this.sidebar = null;
        this.sidebarOverlay = null;
        this.hamburgerBtn = null;
        this.mainContent = null;
        this.sidebarCloseBtn = null;
        
        this.isSidebarOpen = false;
        this.isDesktop = window.innerWidth >= 1024;
        
        console.log('🎨 UICoreController 초기화 완료');
    }
    
    /**
     * UI 컨트롤러 초기화
     */
    init() {
        // DOM 요소 참조
        this.findElements();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 초기 상태 설정
        this.setupInitialState();
        
        // 반응형 처리
        this.handleResponsive();
    }
    
    /**
     * DOM 요소 찾기
     */
    findElements() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.hamburgerBtn = document.getElementById('hamburgerBtn');
        this.mainContent = document.getElementById('mainContent');
        this.sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
        
        // 필수 요소 체크
        const requiredElements = {
            sidebar: this.sidebar,
            sidebarOverlay: this.sidebarOverlay,
            hamburgerBtn: this.hamburgerBtn,
            mainContent: this.mainContent
        };
        
        for (const [name, element] of Object.entries(requiredElements)) {
            if (!element) {
                console.error(`❌ 필수 요소를 찾을 수 없습니다: ${name}`);
            }
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 햄버거 버튼 클릭
        if (this.hamburgerBtn) {
            this.hamburgerBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // 사이드바 닫기 버튼 클릭
        if (this.sidebarCloseBtn) {
            this.sidebarCloseBtn.addEventListener('click', () => {
                this.closeSidebar();
            });
        }
        
        // 오버레이 클릭
        if (this.sidebarOverlay) {
            this.sidebarOverlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }
        
        // 윈도우 리사이즈
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // ESC 키로 사이드바 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSidebarOpen) {
                this.closeSidebar();
            }
        });
        
        // 사이드바 서브메뉴 토글
        this.setupSubmenuToggle();
        
        console.log('🔗 이벤트 리스너 설정 완료');
    }
    
    /**
     * 서브메뉴 토글 설정
     */
    setupSubmenuToggle() {
        const submenuItems = document.querySelectorAll('.has-submenu');
        
        submenuItems.forEach(item => {
            const menuItem = item.querySelector('.menu-item');
            const submenu = item.querySelector('.submenu');
            
            if (menuItem && submenu) {
                menuItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleSubmenu(item);
                });
            }
        });
    }
    
    /**
     * 서브메뉴 토글
     * @param {HTMLElement} parentItem - 부모 메뉴 아이템
     */
    toggleSubmenu(parentItem) {
        const submenu = parentItem.querySelector('.submenu');
        const isOpen = parentItem.classList.contains('open');
        
        // 다른 서브메뉴 모두 닫기
        document.querySelectorAll('.has-submenu.open').forEach(item => {
            if (item !== parentItem) {
                item.classList.remove('open');
                const otherSubmenu = item.querySelector('.submenu');
                if (otherSubmenu) {
                    otherSubmenu.classList.remove('show');
                }
            }
        });
        
        // 현재 서브메뉴 토글
        if (isOpen) {
            parentItem.classList.remove('open');
            submenu.classList.remove('show');
        } else {
            parentItem.classList.add('open');
            submenu.classList.add('show');
        }
        
        console.log('📋 서브메뉴 토글:', parentItem.querySelector('span').textContent);
    }
    
    /**
     * 초기 상태 설정
     */
    setupInitialState() {
        // 데스크톱에서는 사이드바를 기본적으로 열어둠
        if (this.isDesktop) {
            this.openSidebar(false); // 애니메이션 없이
        } else {
            this.closeSidebar(false); // 애니메이션 없이
        }
        
        // 인사관리 서브메뉴 기본 열기
        const hrMenu = document.querySelector('.has-submenu');
        if (hrMenu) {
            this.toggleSubmenu(hrMenu);
        }
    }
    
    /**
     * 사이드바 토글
     */
    toggleSidebar() {
        if (this.isSidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }
    
    /**
     * 사이드바 열기
     * @param {boolean} animate - 애니메이션 여부
     */
    openSidebar(animate = true) {
        if (!this.sidebar) return;
        
        this.isSidebarOpen = true;
        
        // 클래스 추가
        this.sidebar.classList.add('active');
        this.hamburgerBtn?.classList.add('active');
        
        if (this.isDesktop) {
            // 데스크톱: 메인 콘텐츠 밀어내기
            this.mainContent?.classList.add('sidebar-open');
        } else {
            // 모바일: 오버레이 표시
            this.sidebarOverlay?.classList.add('active');
            document.body.style.overflow = 'hidden'; // 스크롤 방지
        }
        
        console.log('📂 사이드바 열림');
    }
    
    /**
     * 사이드바 닫기
     * @param {boolean} animate - 애니메이션 여부
     */
    closeSidebar(animate = true) {
        if (!this.sidebar) return;
        
        this.isSidebarOpen = false;
        
        // 클래스 제거
        this.sidebar.classList.remove('active');
        this.sidebarOverlay?.classList.remove('active');
        this.hamburgerBtn?.classList.remove('active');
        this.mainContent?.classList.remove('sidebar-open');
        
        // 바디 스크롤 복원
        document.body.style.overflow = '';
        
        console.log('📁 사이드바 닫힘');
    }
    
    /**
     * 윈도우 리사이즈 처리
     */
    handleResize() {
        const wasDesktop = this.isDesktop;
        this.isDesktop = window.innerWidth >= 1024;
        
        // 데스크톱 ↔ 모바일 전환 시
        if (wasDesktop !== this.isDesktop) {
            this.handleResponsive();
        }
    }
    
    /**
     * 반응형 처리
     */
    handleResponsive() {
        if (this.isDesktop) {
            // 데스크톱: 오버레이 제거, 사이드바 기본 열기
            this.sidebarOverlay?.classList.remove('active');
            document.body.style.overflow = '';
            
            if (!this.isSidebarOpen) {
                this.openSidebar(false);
            }
        } else {
            // 모바일: 메인 콘텐츠 마진 제거
            this.mainContent?.classList.remove('sidebar-open');
            
            if (this.isSidebarOpen) {
                this.sidebarOverlay?.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
        
        console.log('📱 반응형 모드:', this.isDesktop ? '데스크톱' : '모바일');
    }
    
    /**
     * 현재 페이지에 해당하는 메뉴 활성화
     * @param {string} pagePath - 페이지 경로
     */
    setActiveMenu(pagePath) {
        // 기존 활성 메뉴 제거
        document.querySelectorAll('.sidebar-nav li.active').forEach(item => {
            item.classList.remove('active');
        });
        
        // 새 활성 메뉴 설정
        const menuLinks = document.querySelectorAll('.sidebar-nav a[href]');
        menuLinks.forEach(link => {
            if (link.getAttribute('href') === pagePath) {
                const parentLi = link.closest('li');
                if (parentLi) {
                    parentLi.classList.add('active');
                    
                    // 부모 서브메뉴가 있으면 열기
                    const parentSubmenu = parentLi.closest('.has-submenu');
                    if (parentSubmenu) {
                        this.toggleSubmenu(parentSubmenu);
                    }
                }
            }
        });
    }
    
    /**
     * 사이드바 상태 반환
     * @returns {boolean} 사이드바 열림 상태
     */
    isSidebarVisible() {
        return this.isSidebarOpen;
    }
}

console.log('🎨 ui-core-controller.js 모듈 로드 완료');