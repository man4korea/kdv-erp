/*
📁 js/employee-secure.js
KDV ERP 시스템 - 보안 강화 직원 관리 모듈
Create at 250525_2020 Ver1.00
*/

import { EmployeeManagerCore } from './employee-core.js';
import { EmployeeSearchMixin } from './employee-search.js';
import { EmployeeActionsMixin } from './employee-actions.js';
import { EmployeeUtils } from './employee-utils.js';
import { SecurityUtils } from './security-utils.js';
import { SecureDatabaseOperations } from './db-operations-secure.js';
import { SecureUIController } from './ui-controller-secure.js';

/**
 * 보안 강화된 직원 관리 클래스
 * 모든 CRUD 작업에 보안 검증 및 로깅 적용
 */
export class SecureEmployeeManager {
    constructor() {
        // 기존 핵심 기능 상속
        Object.assign(this, new EmployeeManagerCore());
        
        // 보안 컴포넌트 초기화
        this.secureDB = new SecureDatabaseOperations();
        this.secureUI = new SecureUIController();
        
        // 현재 사용자 정보
        this.currentUser = null;
        this.userPermissions = [];
        
        console.log('🔒 SecureEmployeeManager 초기화 완료');
    }
    
    /**
     * 보안 강화 초기화
     * @param {Object} currentUser - 현재 로그인한 사용자 정보
     */
    async secureInitialize(currentUser) {
        if (!currentUser || !currentUser.uid) {
            throw new Error('사용자 인증 정보가 없습니다.');
        }
        
        this.currentUser = currentUser;
        
        // 사용자 권한 확인
        const hasReadPermission = await this.secureDB.checkPermission(currentUser.uid, 'read');
        if (!hasReadPermission) {
            throw new Error('직원 정보 조회 권한이 없습니다.');
        }
        
        // 기존 초기화 실행
        await EmployeeManagerCore.prototype.initialize.call(this);
        
        // 보안 이벤트 로그
        await this.secureDB.logSecurityEvent('employee_manager_initialized', currentUser.uid, 'Secure employee manager started');
        
        console.log('✅ 보안 강화 직원 관리 시스템 초기화 완료');
    }
    
    /**
     * 보안 강화된 직원 목록 조회
     * @param {Object} options - 검색 옵션
     * @returns {Promise<Object>} 직원 목록
     */
    async secureLoadEmployees(options = {}) {
        try {
            // Rate limiting 확인
            if (!this.secureDB.checkRateLimit(this.currentUser.uid, 'read')) {
                throw new Error('조회 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
            }
            
            // 입력 옵션 검증
            const safeOptions = this.validateSearchOptions(options);
            
            // 보안 검증된 DB 조회
            const result = await this.secureDB.getEmployees(this.currentUser.uid, safeOptions);
            
            // UI 업데이트 (안전한 방법으로)
            this.secureRenderEmployees(result.employees);
            
            return result;
            
        } catch (error) {
            console.error('보안 직원 조회 실패:', error);
            
            // 안전한 에러 메시지 표시
            const safeMessage = SecurityUtils.sanitizeErrorMessage(error, false);
            this.secureUI.showSafeAlert(safeMessage, 'error');
            
            throw error;
        }
    }
    
    /**
     * 보안 강화된 직원 생성
     * @param {Object} employeeData - 직원 데이터
     * @returns {Promise<string>} 생성된 직원 ID
     */
    async secureCreateEmployee(employeeData) {
        try {
            // 권한 확인
            const hasWritePermission = await this.secureDB.checkPermission(this.currentUser.uid, 'write');
            if (!hasWritePermission) {
                throw new Error('직원 생성 권한이 없습니다.');
            }
            
            // Rate limiting 확인
            if (!this.secureDB.checkRateLimit(this.currentUser.uid, 'write')) {
                throw new Error('생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
            }
            
            // 입력 데이터 검증
            const validation = SecurityUtils.validateEmployeeData(employeeData);
            if (!validation.isValid) {
                throw new Error(`입력 데이터 오류: ${validation.errors.join(', ')}`);
            }
            
            // CSRF 토큰 생성
            const csrfToken = SecurityUtils.generateCSRFToken();
            
            // 보안 검증된 DB 생성
            const employeeId = await this.secureDB.createEmployee(
                this.currentUser.uid, 
                employeeData, 
                csrfToken
            );
            
            // 성공 메시지
            this.secureUI.showSafeAlert('직원 정보가 성공적으로 생성되었습니다.', 'info');
            
            // 목록 새로고침
            await this.secureLoadEmployees();
            
            return employeeId;
            
        } catch (error) {
            console.error('보안 직원 생성 실패:', error);
            
            const safeMessage = SecurityUtils.sanitizeErrorMessage(error, false);
            this.secureUI.showSafeAlert(safeMessage, 'error');
            
            throw error;
        }
    }
    
    /**
     * 보안 강화된 직원 수정
     * @param {string} employeeId - 직원 ID
     * @param {Object} updateData - 수정할 데이터
     * @returns {Promise<boolean>} 성공 여부
     */
    async secureUpdateEmployee(employeeId, updateData) {
        try {
            // 직원 ID 검증
            if (!SecurityUtils.isValidEmployeeId(employeeId)) {
                throw new Error('올바르지 않은 직원 ID입니다.');
            }
            
            // 권한 확인
            const hasWritePermission = await this.secureDB.checkPermission(this.currentUser.uid, 'write');
            if (!hasWritePermission) {
                throw new Error('직원 수정 권한이 없습니다.');
            }
            
            // Rate limiting 확인
            if (!this.secureDB.checkRateLimit(this.currentUser.uid, 'write')) {
                throw new Error('수정 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
            }
            
            // 입력 데이터 검증
            const validation = SecurityUtils.validateEmployeeData(updateData);
            if (!validation.isValid) {
                throw new Error(`수정 데이터 오류: ${validation.errors.join(', ')}`);
            }
            
            // CSRF 토큰 검증
            const csrfToken = SecurityUtils.generateCSRFToken();
            
            // 보안 검증된 DB 수정
            const success = await this.secureDB.updateEmployee(
                this.currentUser.uid,
                employeeId,
                updateData,
                csrfToken
            );
            
            if (success) {
                this.secureUI.showSafeAlert('직원 정보가 성공적으로 수정되었습니다.', 'info');
                await this.secureLoadEmployees();
            }
            
            return success;
            
        } catch (error) {
            console.error('보안 직원 수정 실패:', error);
            
            const safeMessage = SecurityUtils.sanitizeErrorMessage(error, false);
            this.secureUI.showSafeAlert(safeMessage, 'error');
            
            throw error;
        }
    }
    
    /**
     * 보안 강화된 직원 삭제
     * @param {string} employeeId - 직원 ID
     * @returns {Promise<boolean>} 성공 여부
     */
    async secureDeleteEmployee(employeeId) {
        try {
            // 직원 ID 검증
            if (!SecurityUtils.isValidEmployeeId(employeeId)) {
                throw new Error('올바르지 않은 직원 ID입니다.');
            }
            
            // 삭제 권한 확인 (높은 권한 필요)
            const hasDeletePermission = await this.secureDB.checkPermission(this.currentUser.uid, 'delete');
            if (!hasDeletePermission) {
                throw new Error('직원 삭제 권한이 없습니다.');
            }
            
            // Rate limiting 확인
            if (!this.secureDB.checkRateLimit(this.currentUser.uid, 'delete')) {
                throw new Error('삭제 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
            }
            
            // 사용자 확인 (이중 확인)
            const confirmMessage = '정말로 이 직원 정보를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.';
            if (!confirm(confirmMessage)) {
                return false;
            }
            
            // CSRF 토큰 검증
            const csrfToken = SecurityUtils.generateCSRFToken();
            
            // 보안 검증된 DB 삭제
            const success = await this.secureDB.deleteEmployee(
                this.currentUser.uid,
                employeeId,
                csrfToken
            );
            
            if (success) {
                this.secureUI.showSafeAlert('직원 정보가 성공적으로 삭제되었습니다.', 'info');
                await this.secureLoadEmployees();
            }
            
            return success;
            
        } catch (error) {
            console.error('보안 직원 삭제 실패:', error);
            
            const safeMessage = SecurityUtils.sanitizeErrorMessage(error, false);
            this.secureUI.showSafeAlert(safeMessage, 'error');
            
            throw error;
        }
    }
    
    /**
     * 검색 옵션 검증 및 정제
     * @param {Object} options - 원본 검색 옵션
     * @returns {Object} 검증된 검색 옵션
     */
    validateSearchOptions(options) {
        const safeOptions = {};
        
        // 부서 필터 정제
        if (options.department && typeof options.department === 'string') {
            const safeDepartment = SecurityUtils.stripHtml(options.department.trim());
            if (safeDepartment && !SecurityUtils.hasSqlInjectionRisk(safeDepartment)) {
                safeOptions.department = safeDepartment;
            }
        }
        
        // 상태 필터 정제
        if (options.status && typeof options.status === 'string') {
            const safeStatus = SecurityUtils.stripHtml(options.status.trim());
            if (['재직', '퇴직', '휴직'].includes(safeStatus)) {
                safeOptions.status = safeStatus;
            }
        }
        
        // 검색어 정제
        if (options.searchTerm && typeof options.searchTerm === 'string') {
            const safeSearchTerm = SecurityUtils.stripHtml(options.searchTerm.trim());
            if (safeSearchTerm.length >= 2 && !SecurityUtils.hasSqlInjectionRisk(safeSearchTerm)) {
                safeOptions.searchTerm = safeSearchTerm;
            }
        }
        
        // 정렬 필드 검증
        const allowedSortFields = ['name', 'department', 'position', 'createdAt'];
        if (options.orderField && allowedSortFields.includes(options.orderField)) {
            safeOptions.orderField = options.orderField;
        }
        
        // 정렬 방향 검증
        if (options.orderDirection && ['asc', 'desc'].includes(options.orderDirection)) {
            safeOptions.orderDirection = options.orderDirection;
        }
        
        // 페이지 크기 검증
        if (options.pageSize && typeof options.pageSize === 'number') {
            safeOptions.pageSize = Math.min(Math.max(1, options.pageSize), 100);
        }
        
        return safeOptions;
    }
    
    /**
     * 보안 강화된 직원 목록 렌더링
     * @param {Array} employees - 직원 목록
     */
    secureRenderEmployees(employees) {
        try {
            const tableBody = document.getElementById('employeeTableBody');
            if (!tableBody) {
                console.warn('직원 테이블 요소를 찾을 수 없습니다.');
                return;
            }
            
            // 기존 내용 안전하게 제거
            tableBody.innerHTML = '';
            
            employees.forEach(employee => {
                const row = document.createElement('tr');
                
                // 각 셀을 안전하게 생성
                const cells = [
                    SecurityUtils.escapeHtml(employee.name || ''),
                    SecurityUtils.escapeHtml(employee.position || ''),
                    SecurityUtils.escapeHtml(employee.department || ''),
                    SecurityUtils.escapeHtml(employee.mobile || ''),
                    SecurityUtils.escapeHtml(employee.email || ''),
                    SecurityUtils.escapeHtml(employee.status || ''),
                    this.createSecureActionButtons(employee.id)
                ];
                
                cells.forEach(cellContent => {
                    const cell = document.createElement('td');
                    if (typeof cellContent === 'string') {
                        cell.textContent = cellContent;
                    } else {
                        cell.appendChild(cellContent);
                    }
                    row.appendChild(cell);
                });
                
                tableBody.appendChild(row);
            });
            
        } catch (error) {
            console.error('직원 목록 렌더링 실패:', error);
        }
    }
    
    /**
     * 보안 강화된 액션 버튼 생성
     * @param {string} employeeId - 직원 ID
     * @returns {HTMLElement} 버튼 컨테이너
     */
    createSecureActionButtons(employeeId) {
        const container = document.createElement('div');
        container.className = 'action-buttons';
        
        // 보기 버튼
        const viewBtn = document.createElement('button');
        viewBtn.textContent = '보기';
        viewBtn.className = 'btn btn-primary btn-sm';
        viewBtn.onclick = () => this.secureViewEmployee(employeeId);
        
        // 수정 버튼 (권한 확인 후 표시)
        const editBtn = document.createElement('button');
        editBtn.textContent = '수정';
        editBtn.className = 'btn btn-secondary btn-sm';
        editBtn.onclick = () => this.secureEditEmployee(employeeId);
        editBtn.style.display = this.hasWritePermission() ? 'inline-block' : 'none';
        
        // 삭제 버튼 (높은 권한 확인 후 표시)
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '삭제';
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.onclick = () => this.secureDeleteEmployee(employeeId);
        deleteBtn.style.display = this.hasDeletePermission() ? 'inline-block' : 'none';
        
        container.appendChild(viewBtn);
        container.appendChild(editBtn);
        container.appendChild(deleteBtn);
        
        return container;
    }
    
    /**
     * 쓰기 권한 확인
     * @returns {boolean} 권한 보유 여부
     */
    hasWritePermission() {
        return this.currentUser && 
               (this.currentUser.profile?.isAdmin === true || 
                ['관리자', 'VIP'].includes(this.currentUser.profile?.securityLevel));
    }
    
    /**
     * 삭제 권한 확인  
     * @returns {boolean} 권한 보유 여부
     */
    hasDeletePermission() {
        return this.currentUser && 
               (this.currentUser.profile?.isAdmin === true || 
                this.currentUser.profile?.securityLevel === 'VIP');
    }
    
    /**
     * 보안 강화된 직원 상세 보기
     * @param {string} employeeId - 직원 ID
     */
    async secureViewEmployee(employeeId) {
        try {
            // 입력 검증
            if (!SecurityUtils.isValidEmployeeId(employeeId)) {
                throw new Error('올바르지 않은 직원 ID입니다.');
            }
            
            // Rate limiting 확인
            if (!this.secureDB.checkRateLimit(this.currentUser.uid, 'read')) {
                throw new Error('조회 요청이 너무 많습니다.');
            }
            
            // 기존 상세 보기 로직 실행
            await EmployeeActionsMixin.prototype.viewEmployee.call(this, employeeId);
            
            // 보안 로그
            await this.secureDB.logSecurityEvent('employee_viewed', this.currentUser.uid, `Employee: ${employeeId}`);
            
        } catch (error) {
            console.error('보안 직원 조회 실패:', error);
            const safeMessage = SecurityUtils.sanitizeErrorMessage(error, false);
            this.secureUI.showSafeAlert(safeMessage, 'error');
        }
    }
    
    /**
     * 보안 강화된 직원 편집
     * @param {string} employeeId - 직원 ID
     */
    async secureEditEmployee(employeeId) {
        // TODO: 편집 기능 구현
        console.log('보안 직원 편집:', employeeId);
        this.secureUI.showSafeAlert('편집 기능은 추후 구현 예정입니다.', 'info');
    }
}

// 믹스인 메서드들을 SecureEmployeeManager 프로토타입에 추가 (보안 검증 래핑)
Object.assign(SecureEmployeeManager.prototype, EmployeeSearchMixin.prototype);
Object.assign(SecureEmployeeManager.prototype, EmployeeActionsMixin.prototype);

// 싱글톤 인스턴스
let secureEmployeeManager = null;

/**
 * 보안 강화 직원 관리자 초기화
 * @param {Object} currentUser - 현재 사용자 정보
 * @returns {Promise<SecureEmployeeManager>} 초기화된 관리자 인스턴스
 */
export async function initSecureEmployeeManager(currentUser) {
    if (!secureEmployeeManager) {
        secureEmployeeManager = new SecureEmployeeManager();
        await secureEmployeeManager.secureInitialize(currentUser);
    }
    return secureEmployeeManager;
}

/**
 * 보안 강화 직원 관리자 인스턴스 반환
 * @returns {SecureEmployeeManager} 관리자 인스턴스
 */
export function getSecureEmployeeManager() {
    return secureEmployeeManager;
}

console.log('🔒 employee-secure.js 모듈 로드 완료');
