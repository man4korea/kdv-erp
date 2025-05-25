/*
📁 js/employee-actions.js
KDV ERP 시스템 - 직원 액션 및 페이지네이션 로직
Create at 250525_2200 Ver1.00
*/

import { dbUtils } from './db-utils.js';

/**
 * 직원 액션 믹스인 클래스
 * 직원 관련 액션 및 페이지네이션 기능 담당
 */
export class EmployeeActionsMixin {
    /**
     * 이전 페이지로 이동
     */
    async goToPrevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.loadEmployees();
        }
    }
    
    /**
     * 다음 페이지로 이동
     */
    async goToNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            await this.loadEmployees();
        }
    }
    
    /**
     * 특정 페이지로 이동
     */
    async goToPage(page) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            await this.loadEmployees();
        }
    }
    
    /**
     * 직원 상세보기
     */
    async viewEmployee(employeeId) {
        try {
            const employee = await dbUtils.getEmployee(employeeId);
            
            const joinDate = employee.joinDate ? 
                new Date(employee.joinDate).toLocaleDateString('ko-KR') : '정보 없음';
            const createdAt = employee.createdAt ? 
                new Date(employee.createdAt).toLocaleString('ko-KR') : '정보 없음';
            
            const details = `
직원 상세 정보

이름: ${employee.name}
부서: ${employee.department}  
직급: ${employee.position}
상태: ${employee.status}
휴대폰: ${employee.mobile || '정보 없음'}
이메일: ${employee.email || '정보 없음'}
입사일: ${joinDate}
직원번호: ${employee.employeeNumber || '정보 없음'}
등록일: ${createdAt}
비고: ${employee.notes || '없음'}
            `.trim();
            
            alert(details);
            
        } catch (error) {
            console.error('직원 상세보기 실패:', error);
            this.showError('직원 정보를 불러오는데 실패했습니다: ' + error.message);
        }
    }
    
    /**
     * 직원 삭제
     */
    async deleteEmployee(employeeId) {
        try {
            // 직원 정보 먼저 조회
            const employee = await dbUtils.getEmployee(employeeId);
            
            const confirmMessage = `정말로 다음 직원을 삭제하시겠습니까?\\n\\n이름: ${employee.name}\\n부서: ${employee.department}\\n직급: ${employee.position}\\n\\n이 작업은 되돌릴 수 없습니다.`;
            
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // 추가 확인
            const doubleConfirm = prompt('삭제를 계속하려면 "DELETE"를 입력하세요:');
            if (doubleConfirm !== 'DELETE') {
                alert('삭제가 취소되었습니다.');
                return;
            }
            
            // 로딩 표시
            this.showLoading('직원 정보를 삭제하는 중...');
            
            // 현재 로그인한 사용자 ID (임시)
            const currentUserId = 'admin-user-001'; // 실제로는 auth에서 가져와야 함
            
            // 직원 삭제 실행
            await dbUtils.deleteEmployee(employeeId, currentUserId);
            
            // 성공 알림
            alert(`${employee.name} 직원이 성공적으로 삭제되었습니다.`);
            
            // 목록 새로고침
            await this.loadEmployees();
            
        } catch (error) {
            console.error('직원 삭제 실패:', error);
            this.showError('직원 삭제 중 오류가 발생했습니다: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * CSV로 내보내기
     */
    async exportToCSV() {
        try {
            this.showLoading('직원 목록을 내보내는 중...');
            
            // 현재 필터링된 모든 직원 데이터 가져오기
            const options = {
                department: this.filters.department || null,
                status: this.filters.status || null,
                searchTerm: this.searchTerm || null,
                orderField: this.sortField,
                orderDirection: this.sortDirection,
                pageSize: null // 모든 데이터
            };
            
            const result = await dbUtils.getEmployees(options);
            
            if (result.employees.length === 0) {
                alert('내보낼 직원 데이터가 없습니다.');
                return;
            }
            
            // CSV 데이터 변환
            const csvData = result.employees.map(emp => ({
                이름: emp.name,
                부서: emp.department,
                직급: emp.position,
                상태: emp.status,
                휴대폰: emp.mobile || '',
                이메일: emp.email || '',
                입사일: emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('ko-KR') : '',
                직원번호: emp.employeeNumber || '',
                등록일: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('ko-KR') : '',
                수정일: emp.updatedAt ? new Date(emp.updatedAt).toLocaleDateString('ko-KR') : ''
            }));
            
            // 파일명 생성
            const today = new Date().toISOString().split('T')[0];
            const filename = `직원목록_${today}.csv`;
            
            // CSV 내보내기
            dbUtils.exportToCSV(csvData, filename);
            
            alert(`직원 목록이 성공적으로 내보내졌습니다.\\n파일명: ${filename}\\n총 ${csvData.length}명의 직원 정보`);
            
        } catch (error) {
            console.error('CSV 내보내기 실패:', error);
            this.showError('직원 목록 내보내기 중 오류가 발생했습니다: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * 현재 상태 정보 반환 (디버깅용)
     */
    getStatus() {
        return {
            totalEmployees: this.totalEmployees,
            filteredCount: this.filteredEmployees.length,
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            pageSize: this.pageSize,
            sortField: this.sortField,
            sortDirection: this.sortDirection,
            searchTerm: this.searchTerm,
            filters: { ...this.filters }
        };
    }
}

console.log('⚡ employee-actions.js 모듈 로드 완료');