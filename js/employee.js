/*
📁 js/employee.js
KDV ERP 시스템 - 직원 관리 통합 모듈 (모듈화 버전)
Create at 250525_2200 Ver2.00
*/

import { EmployeeManagerCore } from './employee-core.js';
import { EmployeeSearchMixin } from './employee-search.js';
import { EmployeeActionsMixin } from './employee-actions.js';
import { EmployeeUtils } from './employee-utils.js';

/**
 * 통합 직원 관리 클래스
 * 여러 믹스인을 조합하여 완전한 기능 제공
 */
export class EmployeeManager {
    constructor() {
        // 핵심 기능 초기화
        Object.assign(this, new EmployeeManagerCore());
        
        console.log('👥 EmployeeManager (통합 버전) 초기화 완료');
    }
    
    /**
     * 초기화 (핵심 + 이벤트 리스너)
     */
    async initialize() {
        // 핵심 초기화
        await EmployeeManagerCore.prototype.initialize.call(this);
        
        // 검색 이벤트 리스너 설정
        EmployeeSearchMixin.prototype.setupEventListeners.call(this);
        
        console.log('✅ 통합 직원 관리 시스템 초기화 완료');
    }
}

// 믹스인 메서드들을 EmployeeManager 프로토타입에 추가
Object.assign(EmployeeManager.prototype, EmployeeSearchMixin.prototype);
Object.assign(EmployeeManager.prototype, EmployeeActionsMixin.prototype);

// 전역 함수들 (기존 호환성 유지)
let employeeManager = null;

/**
 * 직원 관리자 인스턴스 초기화
 */
export async function initEmployeeManager() {
    if (!employeeManager) {
        employeeManager = new EmployeeManager();
        await employeeManager.initialize();
    }
    return employeeManager;
}

/**
 * 직원 관리자 인스턴스 반환
 */
export function getEmployeeManager() {
    return employeeManager;
}

// 전역 액세스를 위한 window 객체 설정 (기존 코드 호환성)
if (typeof window !== 'undefined') {
    // 전역 함수들
    window.viewEmployee = async (employeeId) => {
        if (employeeManager) {
            await employeeManager.viewEmployee(employeeId);
        }
    };
    
    window.deleteEmployee = async (employeeId) => {
        if (employeeManager) {
            await employeeManager.deleteEmployee(employeeId);
        }
    };
    
    window.editEmployee = (employeeId) => {
        // TODO: 편집 기능 구현 필요
        console.log('편집 기능:', employeeId);
        alert('편집 기능은 추후 구현 예정입니다.');
    };
    
    window.goToPage = async (page) => {
        if (employeeManager) {
            await employeeManager.goToPage(page);
        }
    };
    
    window.sortTable = async (field) => {
        if (employeeManager) {
            await employeeManager.sortTable(field);
        }
    };
    
    window.clearSearch = async () => {
        if (employeeManager) {
            await employeeManager.clearSearch();
        }
    };
    
    window.exportEmployeeCSV = async () => {
        if (employeeManager) {
            await employeeManager.exportToCSV();
        }
    };
    
    window.changePageSize = async () => {
        if (employeeManager) {
            await employeeManager.changePageSize();
        }
    };
}

// 유틸리티 함수들도 export
export { EmployeeUtils };

console.log('👥 employee.js (통합 모듈) 로드 완료');