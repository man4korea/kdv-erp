/*
📁 js/employee-search.js
KDV ERP 시스템 - 직원 검색 및 필터링 로직
Create at 250525_2200 Ver1.00
*/

/**
 * 직원 검색 및 필터링 믹스인 클래스
 * 검색, 필터링, 정렬 관련 기능 담당
 */
export class EmployeeSearchMixin {
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 검색 입력 이벤트
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.performSearch();
            }, 300));
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }
        
        // 필터 변경 이벤트
        const filters = ['departmentFilter', 'statusFilter', 'positionFilter', 'sortFilter'];
        filters.forEach(filterId => {
            const filterEl = document.getElementById(filterId);
            if (filterEl) {
                filterEl.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        });
        
        console.log('🔗 이벤트 리스너 설정 완료');
    }
    
    /**
     * 검색 수행
     */
    async performSearch() {
        const searchInput = document.getElementById('searchInput');
        this.searchTerm = searchInput?.value.trim() || '';
        
        console.log('🔍 검색 수행:', this.searchTerm);
        
        // 첫 페이지로 리셋
        this.currentPage = 1;
        this.lastDoc = null;
        
        // 데이터 다시 로드
        await this.loadEmployees();
    }
    
    /**
     * 검색 초기화
     */
    async clearSearch() {
        const searchInput = document.getElementById('searchInput');
        const filters = ['departmentFilter', 'statusFilter', 'positionFilter'];
        
        // 검색어 및 필터 초기화
        if (searchInput) searchInput.value = '';
        filters.forEach(filterId => {
            const filterEl = document.getElementById(filterId);
            if (filterEl) filterEl.value = '';
        });
        
        // 정렬 초기화
        const sortFilter = document.getElementById('sortFilter');
        if (sortFilter) sortFilter.value = 'name';
        
        // 변수 초기화
        this.searchTerm = '';
        this.filters = { department: '', status: '', position: '' };
        this.sortField = 'name';
        this.sortDirection = 'asc';
        this.currentPage = 1;
        this.lastDoc = null;
        
        console.log('🗑️ 검색 및 필터 초기화');
        
        // 데이터 다시 로드
        await this.loadEmployees();
    }
    
    /**
     * 필터 적용
     */
    async applyFilters() {
        // 필터 값 수집
        this.filters.department = document.getElementById('departmentFilter')?.value || '';
        this.filters.status = document.getElementById('statusFilter')?.value || '';
        this.filters.position = document.getElementById('positionFilter')?.value || '';
        this.sortField = document.getElementById('sortFilter')?.value || 'name';
        
        console.log('🎯 필터 적용:', this.filters);
        
        // 첫 페이지로 리셋
        this.currentPage = 1;
        this.lastDoc = null;
        
        // 데이터 다시 로드
        await this.loadEmployees();
    }
    
    /**
     * 테이블 정렬
     */
    async sortTable(field) {
        // 같은 필드 클릭 시 정렬 방향 변경
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
        
        console.log(`📊 테이블 정렬: ${field} ${this.sortDirection}`);
        
        // 정렬 아이콘 업데이트
        this.updateSortIcons(field);
        
        // 첫 페이지로 리셋
        this.currentPage = 1;
        this.lastDoc = null;
        
        // 데이터 다시 로드
        await this.loadEmployees();
    }
    
    /**
     * 정렬 아이콘 업데이트
     */
    updateSortIcons(activeField) {
        const headers = document.querySelectorAll('.employee-table th');
        headers.forEach(th => {
            const icon = th.querySelector('.sort-icon');
            if (icon) {
                th.classList.remove('sort-active');
                icon.className = 'fas fa-sort sort-icon';
            }
        });
        
        // 활성 정렬 필드 아이콘 업데이트
        const activeHeader = document.querySelector(`[onclick="sortTable('${activeField}')"]`);
        if (activeHeader) {
            const icon = activeHeader.querySelector('.sort-icon');
            if (icon) {
                activeHeader.classList.add('sort-active');
                icon.className = `fas fa-sort-${this.sortDirection === 'asc' ? 'up' : 'down'} sort-icon`;
            }
        }
    }
    
    /**
     * 페이지 크기 변경
     */
    async changePageSize() {
        const pageSizeSelect = document.getElementById('pageSize');
        this.pageSize = parseInt(pageSizeSelect?.value || 25);
        
        console.log('📄 페이지 크기 변경:', this.pageSize);
        
        // 첫 페이지로 리셋
        this.currentPage = 1;
        this.lastDoc = null;
        
        // 데이터 다시 로드
        await this.loadEmployees();
    }
    
    /**
     * 디바운스 함수 (검색 입력 지연)
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

console.log('🔍 employee-search.js 모듈 로드 완료');