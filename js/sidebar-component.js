// 📁 js/sidebar-component.js
// KDV 시스템 - 사이드바 독립 컴포넌트 (CDN 호환)
// Create at 250526_1630 Ver1.00

// CDN 방식으로 변경 - import 문 제거

console.log('🔧 사이드바 컴포넌트 로드 시작');

/**
 * 사이드바 컴포넌트 클래스
 */
class SidebarComponent {
    constructor(options = {}) {
        // 기본 설정
        this.options = {
            hamburgerSelector: '.hamburger-btn',
            sidebarSelector: '.sidebar',
            overlaySelector: '.sidebar-overlay',
            closeButtonSelector: '#sidebarCloseBtn',
            activeClass: 'active',
            enableLogging: true,
            autoInit: true,
            ...options
        };
        
        // 내부 상태
        this.isOpen = false;
        this.elements = {};
        
        // 자동 초기화
        if (this.options.autoInit) {
            this.init();
        }
        
        this.log('🔧 사이드바 컴포넌트 생성 완료');
    }
    
    /**
     * 초기화
     */
    init() {
        this.log('🚀 사이드바 컴포넌트 초기화 시작');
        
        // DOM 요소 찾기
        this.findElements();
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 초기 상태 설정
        this.setupInitialState();
        
        this.log('✅ 사이드바 컴포넌트 초기화 완료');
    }
    
    /**
     * DOM 요소 찾기
     */
    findElements() {
        this.elements = {
            hamburger: document.querySelector(this.options.hamburgerSelector),
            sidebar: document.querySelector(this.options.sidebarSelector),
            overlay: document.querySelector(this.options.overlaySelector),
            closeButton: document.querySelector(this.options.closeButtonSelector)
        };
        
        this.log('🔍 DOM 요소 확인:', {
            hamburger: !!this.elements.hamburger,
            sidebar: !!this.elements.sidebar,
            overlay: !!this.elements.overlay,
            closeButton: !!this.elements.closeButton
        });
        
        // 필수 요소 체크
        if (!this.elements.hamburger) {
            console.error('❌ 햄버거 버튼을 찾을 수 없습니다:', this.options.hamburgerSelector);
        }
        
        if (!this.elements.sidebar) {
            console.error('❌ 사이드바를 찾을 수 없습니다:', this.options.sidebarSelector);
        }
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 햄버거 버튼 클릭
        if (this.elements.hamburger) {
            this.elements.hamburger.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        }
        
        // 오버레이 클릭
        if (this.elements.overlay) {
            this.elements.overlay.addEventListener('click', () => {
                this.close();
            });
        }
        
        // 닫기 버튼 클릭
        if (this.elements.closeButton) {
            this.elements.closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.close();
            });
        }
        
        // ESC 키 눌렀을 때 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // 사이드바 메뉴 항목 클릭 (모바일에서 자동 닫기)
        if (this.elements.sidebar) {
            const menuLinks = this.elements.sidebar.querySelectorAll('a[href]');
            menuLinks.forEach(link => {
                link.addEventListener('click', () => {
                    // 모바일 화면에서만 자동 닫기
                    if (window.innerWidth <= 768) {
                        setTimeout(() => this.close(), 150);
                    }
                });
            });
        }
        
        this.log('🎧 이벤트 리스너 설정 완료');
    }
    
    /**
     * 초기 상태 설정
     */
    setupInitialState() {
        // 초기 상태는 닫힌 상태
        this.isOpen = false;
        
        // CSS 클래스 초기화
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.remove(this.options.activeClass);
        }
        
        if (this.elements.overlay) {
            this.elements.overlay.classList.remove(this.options.activeClass);
        }
        
        this.log('🎯 초기 상태 설정 완료');
    }
    
    /**
     * 사이드바 열기
     */
    open() {
        if (this.isOpen) return;
        
        this.log('📂 사이드바 열기');
        
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.add(this.options.activeClass);
        }
        
        if (this.elements.overlay) {
            this.elements.overlay.classList.add(this.options.activeClass);
        }
        
        this.isOpen = true;
        
        // 커스텀 이벤트 발생
        this.dispatchEvent('sidebar:open');
        
        // body 스크롤 막기 (모바일)
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * 사이드바 닫기
     */
    close() {
        if (!this.isOpen) return;
        
        this.log('📁 사이드바 닫기');
        
        if (this.elements.sidebar) {
            this.elements.sidebar.classList.remove(this.options.activeClass);
        }
        
        if (this.elements.overlay) {
            this.elements.overlay.classList.remove(this.options.activeClass);
        }
        
        this.isOpen = false;
        
        // 커스텀 이벤트 발생
        this.dispatchEvent('sidebar:close');
        
        // body 스크롤 복구
        document.body.style.overflow = '';
    }
    
    /**
     * 사이드바 토글
     */
    toggle() {
        this.log('🔄 사이드바 토글');
        
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    /**
     * 현재 상태 반환
     */
    getState() {
        return {
            isOpen: this.isOpen,
            elements: Object.keys(this.elements).reduce((acc, key) => {
                acc[key] = !!this.elements[key];
                return acc;
            }, {})
        };
    }
    
    /**
     * 옵션 업데이트
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.log('⚙️ 옵션 업데이트:', newOptions);
    }
    
    /**
     * 컴포넌트 제거
     */
    destroy() {
        this.log('💥 사이드바 컴포넌트 제거');
        
        // 이벤트 리스너 제거는 복잡하므로 생략
        // 실제 프로덕션에서는 모든 이벤트 리스너를 추적하고 제거해야 함
        
        // 상태 초기화
        this.close();
        this.elements = {};
        this.isOpen = false;
    }
    
    /**
     * 커스텀 이벤트 발생
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                sidebar: this,
                isOpen: this.isOpen,
                ...detail
            }
        });
        
        document.dispatchEvent(event);
        this.log(`📡 이벤트 발생: ${eventName}`);
    }
    
    /**
     * 로깅 (옵션에 따라)
     */
    log(message, data = null) {
        if (this.options.enableLogging) {
            if (data) {
                console.log(message, data);
            } else {
                console.log(message);
            }
        }
    }
}

/**
 * 전역 사이드바 인스턴스 생성 함수
 */
function createSidebar(options = {}) {
    return new SidebarComponent(options);
}

/**
 * DOM 로드 완료 후 기본 사이드바 자동 생성
 */
function initDefaultSidebar() {
    // 기본 사이드바가 이미 존재하는지 확인
    if (window.defaultSidebar) {
        console.log('🔄 기본 사이드바가 이미 존재합니다.');
        return window.defaultSidebar;
    }
    
    // 기본 사이드바 생성
    window.defaultSidebar = new SidebarComponent({
        enableLogging: true,
        autoInit: true
    });
    
    console.log('🎉 기본 사이드바 생성 완료');
    return window.defaultSidebar;
}

// 전역 객체 등록
if (typeof window !== 'undefined') {
    window.SidebarComponent = SidebarComponent;
    window.createSidebar = createSidebar;
    window.initDefaultSidebar = initDefaultSidebar;
    
    // DOM 로드 완료 시 기본 사이드바 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM 로드 완료 - 기본 사이드바 초기화');
            initDefaultSidebar();
        });
    } else {
        // 이미 로드된 경우
        console.log('📄 DOM 이미 로드됨 - 기본 사이드바 즉시 초기화');
        initDefaultSidebar();
    }
}

console.log('🔧 사이드바 컴포넌트 로드 완료');