/*
📁 js/employee-utils.js
KDV ERP 시스템 - 직원 관련 유틸리티 함수들
Create at 250525_2200 Ver1.00
*/

/**
 * 직원 관련 유틸리티 함수들
 */
export const EmployeeUtils = {
    /**
     * 직원 상태 한글 변환
     */
    translateStatus(status) {
        const statusMap = {
            'active': '재직',
            'leave': '휴직', 
            'retired': '퇴직'
        };
        return statusMap[status] || status;
    },
    
    /**
     * 입사 기간 계산
     */
    calculateWorkPeriod(joinDate) {
        if (!joinDate) return '정보 없음';
        
        const join = new Date(joinDate);
        const now = new Date();
        const diffTime = now - join;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffYears = Math.floor(diffDays / 365);
        const diffMonths = Math.floor((diffDays % 365) / 30);
        
        if (diffYears > 0) {
            return `${diffYears}년 ${diffMonths}개월`;
        } else if (diffMonths > 0) {
            return `${diffMonths}개월`;
        } else {
            return `${diffDays}일`;
        }
    },
    
    /**
     * 휴대폰 번호 형식 검증
     */
    validateMobile(mobile) {
        if (!mobile) return true; // 선택 항목
        return /^010-[0-9]{4}-[0-9]{4}$/.test(mobile);
    },
    
    /**
     * 이메일 형식 검증
     */
    validateEmail(email) {
        if (!email) return true; // 선택 항목
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
};

console.log('🔧 employee-utils.js 모듈 로드 완료');