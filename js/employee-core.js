/*
📁 js/employee-core.js
KDV ERP 시스템 - 직원 관리 핵심 클래스
Create at 250525_2200 Ver1.00
*/

import { dbUtils } from './db-utils.js';

/**
 * 직원 관리 핵심 클래스
 * 기본 초기화, 데이터 로딩, 렌더링 담당
 */
export class EmployeeManagerCore {
    constructor() {
        this.employees = [];
        this.filteredEmployees = [];
        this.departments = [];
        this.positions = [];
        this.currentPage = 1;
        this.pageSize = 25;
        this.totalEmployees = 0;
        this.totalPages = 0;
        this.lastDoc = null;
        this.sortField = 'name';
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.filters = {
            department: '',
            status: '',
            position: ''
        };
        
        console.log('👥 EmployeeManagerCore 초기화 완료');
    }
    
    /**
     * 직원 관리자 초기화
     */
    async initialize() {
        try {
            console.log('🚀 직원 관리 시스템 초기화 시작...');
            
            // 부서 데이터 로드
            await this.loadDepartments();
            
            // 직원 데이터 로드
            await this.loadEmployees();
            
            console.log('✅ 직원 관리 시스템 초기화 완료');
            
        } catch (error) {
            console.error('❌ 직원 관리 시스템 초기화 실패:', error);
            throw error;
        }
    }
    
    /**
     * 부서 데이터 로드
     */
    async loadDepartments() {
        try {
            this.departments = await dbUtils.getDepartments();
            this.populateDepartmentFilter();
            console.log('📁 부서 데이터 로드 완료:', this.departments.length);
        } catch (error) {
            console.error('❌ 부서 데이터 로드 실패:', error);
        }
    }
    
    /**
     * 직원 데이터 로드
     */
    async loadEmployees() {
        try {
            console.log('👥 직원 데이터 로드 시작...');
            
            const options = {
                department: this.filters.department || null,
                status: this.filters.status || null,
                searchTerm: this.searchTerm || null,
                orderField: this.sortField,
                orderDirection: this.sortDirection,
                pageSize: this.pageSize,
                lastDoc: this.currentPage > 1 ? this.lastDoc : null
            };
            
            const result = await dbUtils.getEmployees(options);
            
            this.employees = result.employees;
            this.filteredEmployees = [...this.employees];
            this.lastDoc = result.lastDoc;
            this.totalEmployees = result.total;
            this.totalPages = Math.ceil(this.totalEmployees / this.pageSize);
            
            // 직급 데이터 추출 (중복 제거)
            this.extractPositions();
            
            // UI 업데이트
            this.renderEmployeeTable();
            this.updateStatistics();
            this.updatePagination();
            this.populatePositionFilter();
            
            console.log(`✅ 직원 데이터 로드 완료: ${this.employees.length}명`);
            
        } catch (error) {
            console.error('❌ 직원 데이터 로드 실패:', error);
            this.showError('직원 데이터를 불러오는데 실패했습니다: ' + error.message);
        }
    }
    
    /**
     * 직원 테이블 렌더링
     */
    renderEmployeeTable() {
        const tableBody = document.getElementById('employeeTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (!tableBody) return;
        
        // 빈 상태 처리
        if (this.filteredEmployees.length === 0) {
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // 테이블 행 생성
        const rows = this.filteredEmployees.map(employee => {
            const joinDate = employee.joinDate ? 
                new Date(employee.joinDate).toLocaleDateString('ko-KR') : '-';
            const statusBadge = this.getStatusBadge(employee.status);
            
            return `
                <tr>
                    <td>
                        <div class="employee-name">${this.escapeHtml(employee.name)}</div>
                        ${employee.email ? `<div class="employee-email">${this.escapeHtml(employee.email)}</div>` : ''}
                    </td>
                    <td>${this.escapeHtml(employee.department)}</td>
                    <td>${this.escapeHtml(employee.position)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        ${employee.mobile ? `<div class="employee-mobile">${this.escapeHtml(employee.mobile)}</div>` : '-'}
                    </td>
                    <td>${joinDate}</td>
                    <td>
                        <div class="employee-actions">
                            <button class="action-btn view" 
                                    onclick="viewEmployee('${employee.id}')" 
                                    title="상세보기">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit" 
                                    onclick="editEmployee('${employee.id}')" 
                                    title="수정">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" 
                                    onclick="deleteEmployee('${employee.id}')" 
                                    title="삭제">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
        
        tableBody.innerHTML = rows;
    }
    
    /**
     * 상태 배지 생성
     */
    getStatusBadge(status) {
        const statusClasses = {
            '재직': 'active',
            '휴직': 'leave',
            '퇴직': 'retired'
        };
        
        const statusClass = statusClasses[status] || 'active';
        return `<span class="status-badge ${statusClass}">${status}</span>`;
    }
    
    /**
     * 통계 업데이트
     */
    async updateStatistics() {
        try {
            // 전체 직원 수
            document.getElementById('totalEmployees').textContent = this.totalEmployees;
            
            // 재직 직원 수
            const activeCount = this.employees.filter(emp => emp.status === '재직').length;
            document.getElementById('activeEmployees').textContent = activeCount;
            
            // 부서 수
            document.getElementById('totalDepartments').textContent = this.departments.length;
            
            // 이번 달 입사자 수
            const thisMonth = new Date();
            const recentJoins = this.employees.filter(emp => {
                if (!emp.joinDate) return false;
                const joinDate = new Date(emp.joinDate);
                return joinDate.getFullYear() === thisMonth.getFullYear() &&
                       joinDate.getMonth() === thisMonth.getMonth();
            }).length;
            document.getElementById('recentJoins').textContent = recentJoins;
            
        } catch (error) {
            console.error('통계 업데이트 실패:', error);
        }
    }
    
    /**
     * 페이지네이션 업데이트
     */
    updatePagination() {
        const paginationInfo = document.getElementById('paginationInfo');
        const pageNumbers = document.getElementById('pageNumbers');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        // 페이지 정보 업데이트
        const startIndex = (this.currentPage - 1) * this.pageSize + 1;
        const endIndex = Math.min(this.currentPage * this.pageSize, this.totalEmployees);
        paginationInfo.textContent = `${startIndex}-${endIndex} / 총 ${this.totalEmployees}명`;
        
        // 이전/다음 버튼 상태
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= this.totalPages;
        
        // 페이지 번호 생성
        this.renderPageNumbers();
    }
    
    /**
     * 페이지 번호 렌더링
     */
    renderPageNumbers() {
        const pageNumbers = document.getElementById('pageNumbers');
        if (!pageNumbers) return;
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        let pageNumbersHtml = '';
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            pageNumbersHtml += `
                <button class="pagination-btn ${activeClass}" onclick="goToPage(${i})">
                    ${i}
                </button>`;
        }
        
        pageNumbers.innerHTML = pageNumbersHtml;
    }
    
    /**
     * 부서 필터 옵션 채우기
     */
    populateDepartmentFilter() {
        const departmentFilter = document.getElementById('departmentFilter');
        if (!departmentFilter) return;
        
        // 기존 옵션 제거 (첫 번째 '전체 부서' 옵션 제외)
        while (departmentFilter.children.length > 1) {
            departmentFilter.removeChild(departmentFilter.lastChild);
        }
        
        // 부서 옵션 추가
        this.departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.name;
            option.textContent = dept.name;
            departmentFilter.appendChild(option);
        });
    }
    
    /**
     * 직급 필터 옵션 채우기
     */
    populatePositionFilter() {
        const positionFilter = document.getElementById('positionFilter');
        if (!positionFilter) return;
        
        // 기존 옵션 제거 (첫 번째 '전체 직급' 옵션 제외)
        while (positionFilter.children.length > 1) {
            positionFilter.removeChild(positionFilter.lastChild);
        }
        
        // 직급 옵션 추가
        this.positions.forEach(position => {
            const option = document.createElement('option');
            option.value = position;
            option.textContent = position;
            positionFilter.appendChild(option);
        });
    }
    
    /**
     * 직급 데이터 추출 (중복 제거)
     */
    extractPositions() {
        const positionSet = new Set();
        this.employees.forEach(emp => {
            if (emp.position) {
                positionSet.add(emp.position);
            }
        });
        this.positions = Array.from(positionSet).sort();
    }
    
    /**
     * HTML 이스케이프
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 로딩 표시
     */
    showLoading(message = '처리 중...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) loadingMessage.textContent = message;
        if (loadingOverlay) loadingOverlay.classList.add('show');
    }
    
    /**
     * 로딩 숨김
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.classList.remove('show');
    }
    
    /**
     * 에러 표시
     */
    showError(message) {
        alert('오류: ' + message);
        console.error(message);
    }
    
    /**
     * 성공 메시지 표시
     */
    showSuccess(message) {
        alert('성공: ' + message);
        console.log(message);
    }
}

console.log('👥 employee-core.js 모듈 로드 완료');