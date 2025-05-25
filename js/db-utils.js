/*
📁 js/db-utils.js  
KDV ERP 시스템 - 데이터베이스 유틸리티 통합 모듈 (모듈화 버전)
Create at 250525_2200 Ver2.00
*/

import { DatabaseOperations } from './db-operations.js';
import { DatabaseHelpers } from './db-helpers.js';

/**
 * 통합 데이터베이스 유틸리티 클래스
 * 여러 모듈을 조합하여 완전한 기능 제공
 */
export class DatabaseUtils {
    constructor() {
        // 핵심 CRUD 작업
        this.operations = new DatabaseOperations();
        
        // 헬퍼 및 유틸리티 기능
        this.helpers = new DatabaseHelpers();
        
        // 기존 호환성을 위한 프로퍼티들
        this.db = this.operations.db;
        this.collections = this.operations.collections;
        
        console.log('🗄️ DatabaseUtils (통합 버전) 초기화 완료');
    }
    
    // ========================================================================
    // 직원 관련 함수들 (operations 모듈 위임)
    // ========================================================================
    
    /**
     * 직원 목록 조회 (페이징 지원)
     */
    async getEmployees(options = {}) {
        return await this.operations.getEmployees(options);
    }
    
    /**
     * 직원 상세 정보 조회
     */
    async getEmployee(employeeId) {
        return await this.operations.getEmployee(employeeId);
    }
    
    /**
     * 직원 정보 생성
     */
    async createEmployee(employeeData, userId) {
        // 데이터 검증 (helpers 모듈 사용)
        this.helpers.validateEmployeeData(employeeData);
        
        // 생성 (operations 모듈 사용)
        const employeeId = await this.operations.createEmployee(employeeData, userId);
        
        // 시스템 로그 기록 (helpers 모듈 사용)
        await this.helpers.logActivity('EMPLOYEE_CREATE', userId, this.collections.employees, employeeId, {
            employeeName: employeeData.name,
            department: employeeData.department
        });
        
        return employeeId;
    }
    
    /**
     * 직원 정보 수정
     */
    async updateEmployee(employeeId, updateData, userId) {
        // 데이터 검증 (helpers 모듈 사용)
        this.helpers.validateEmployeeData(updateData, false);
        
        // 수정 (operations 모듈 사용)
        const result = await this.operations.updateEmployee(employeeId, updateData, userId);
        
        // 시스템 로그 기록 (helpers 모듈 사용)
        await this.helpers.logActivity('EMPLOYEE_UPDATE', userId, this.collections.employees, employeeId, {
            updatedFields: Object.keys(updateData)
        });
        
        return result;
    }
    
    /**
     * 직원 삭제
     */
    async deleteEmployee(employeeId, userId) {
        // 직원 정보 조회 (로그용)
        const employee = await this.operations.getEmployee(employeeId);
        
        // 삭제 (operations 모듈 사용)
        const result = await this.operations.deleteEmployee(employeeId, userId);
        
        // 시스템 로그 기록 (helpers 모듈 사용)
        await this.helpers.logActivity('EMPLOYEE_DELETE', userId, this.collections.employees, employeeId, {
            employeeName: employee.name,
            department: employee.department
        });
        
        return result;
    }
    
    // ========================================================================
    // 부서 관련 함수들 (operations 모듈 위임)
    // ========================================================================
    
    /**
     * 부서 목록 조회
     */
    async getDepartments() {
        return await this.operations.getDepartments();
    }
    
    /**
     * 부서별 직원 수 조회
     */
    async getDepartmentStats() {
        return await this.operations.getDepartmentStats();
    }
    
    // ========================================================================
    // 시스템 로그 관련 함수들 (helpers 모듈 위임)
    // ========================================================================
    
    /**
     * 시스템 로그 기록
     */
    async logActivity(action, userId, targetCollection = null, targetDocumentId = null, details = {}) {
        return await this.helpers.logActivity(action, userId, targetCollection, targetDocumentId, details);
    }
    
    /**
     * 시스템 로그 조회
     */
    async getSystemLogs(options = {}) {
        return await this.helpers.getSystemLogs(options);
    }
    
    // ========================================================================
    // 유틸리티 함수들 (helpers 모듈 위임)
    // ========================================================================
    
    /**
     * 직원 데이터 유효성 검증
     */
    validateEmployeeData(employeeData, isCreate = true) {
        return this.helpers.validateEmployeeData(employeeData, isCreate);
    }
    
    /**
     * 클라이언트 IP 주소 가져오기
     */
    getClientIP() {
        return this.helpers.getClientIP();
    }
    
    /**
     * 데이터 내보내기 (CSV 형식)
     */
    exportToCSV(data, filename = 'export.csv') {
        return this.helpers.exportToCSV(data, filename);
    }
    
    /**
     * 데이터베이스 연결 상태 확인
     */
    async checkConnection() {
        return await this.helpers.checkConnection();
    }
    
    /**
     * 데이터 통계 계산
     */
    calculateStats(data, field) {
        return this.helpers.calculateStats(data, field);
    }
    
    /**
     * 날짜 범위 필터 헬퍼
     */
    createDateRangeFilter(startDate, endDate) {
        return this.helpers.createDateRangeFilter(startDate, endDate);
    }
    
    /**
     * 페이징 헬퍼
     */
    createPaginationInfo(page, size, total) {
        return this.helpers.createPaginationInfo(page, size, total);
    }
}

// 전역 인스턴스 생성 (기존 호환성 유지)
export const dbUtils = new DatabaseUtils();

console.log('🗄️ db-utils.js (통합 모듈) 로드 완료');