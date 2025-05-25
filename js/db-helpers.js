/*
📁 js/db-helpers.js  
KDV ERP 시스템 - 데이터베이스 헬퍼 및 유틸리티 함수들
Create at 250525_2200 Ver1.00
*/

import { db } from './firebase-config.js';
import { 
    collection, 
    doc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

/**
 * 데이터베이스 헬퍼 및 유틸리티 클래스
 */
export class DatabaseHelpers {
    constructor() {
        this.db = db;
        this.collections = {
            users: 'users',
            employees: 'employees',
            employeePrivate: 'employee_private', 
            systemLogs: 'system_logs',
            departments: 'departments'
        };
    }
    
    // ========================================================================
    // 시스템 로그 관련 함수들
    // ========================================================================
    
    /**
     * 시스템 로그 기록
     * @param {string} action - 액션
     * @param {string} userId - 사용자 ID
     * @param {string} targetCollection - 대상 컬렉션
     * @param {string} targetDocumentId - 대상 문서 ID
     * @param {Object} details - 상세 정보
     */
    async logActivity(action, userId, targetCollection = null, targetDocumentId = null, details = {}) {
        try {
            const logEntry = {
                action,
                userId,
                targetCollection,
                targetDocumentId,
                details,
                timestamp: serverTimestamp(),
                ipAddress: this.getClientIP(),
                userAgent: navigator.userAgent
            };
            
            await addDoc(collection(this.db, this.collections.systemLogs), logEntry);
            
        } catch (error) {
            console.error('로그 기록 실패:', error);
            // 로그 실패는 전체 작업을 중단시키지 않음
        }
    }
    
    /**
     * 시스템 로그 조회
     * @param {Object} options - 조회 옵션
     * @returns {Promise<Array>} 로그 목록
     */
    async getSystemLogs(options = {}) {
        try {
            const {
                userId = null,
                action = null,
                startDate = null,
                endDate = null,
                pageSize = 50
            } = options;
            
            let q = collection(this.db, this.collections.systemLogs);
            const constraints = [];
            
            if (userId) {
                constraints.push(where('userId', '==', userId));
            }
            
            if (action) {
                constraints.push(where('action', '==', action));
            }
            
            constraints.push(orderBy('timestamp', 'desc'));
            
            if (pageSize) {
                constraints.push(limit(pageSize));
            }
            
            q = query(q, ...constraints);
            const querySnapshot = await getDocs(q);
            
            const logs = [];
            querySnapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate()
                });
            });
            
            return logs;
            
        } catch (error) {
            console.error('시스템 로그 조회 실패:', error);
            throw error;
        }
    }
    
    // ========================================================================
    // 유틸리티 함수들
    // ========================================================================
    
    /**
     * 직원 데이터 유효성 검증
     * @param {Object} employeeData - 직원 데이터
     * @param {boolean} isCreate - 생성 모드 여부
     */
    validateEmployeeData(employeeData, isCreate = true) {
        if (isCreate) {
            const required = ['name', 'department', 'position', 'status'];
            const missing = required.filter(field => !employeeData[field]);
            
            if (missing.length > 0) {
                throw new Error(`필수 필드 누락: ${missing.join(', ')}`);
            }
        }
        
        if (employeeData.status && !['재직', '휴직', '퇴직'].includes(employeeData.status)) {
            throw new Error('유효하지 않은 직원 상태');
        }
        
        if (employeeData.mobile && !employeeData.mobile.match(/^010-[0-9]{4}-[0-9]{4}$/)) {
            throw new Error('유효하지 않은 휴대폰 번호 형식 (010-0000-0000)');
        }
        
        if (employeeData.email && !employeeData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            throw new Error('유효하지 않은 이메일 형식');
        }
    }
    
    /**
     * 클라이언트 IP 주소 가져오기 (간단한 구현)
     */
    getClientIP() {
        // 실제 환경에서는 서버에서 IP를 가져와야 함
        return 'localhost';
    }
    
    /**
     * 데이터 내보내기 (CSV 형식)
     * @param {Array} data - 내보낼 데이터
     * @param {string} filename - 파일명
     */
    exportToCSV(data, filename = 'export.csv') {
        if (!data || data.length === 0) {
            throw new Error('내보낼 데이터가 없습니다.');
        }
        
        // CSV 헤더 생성
        const headers = Object.keys(data[0]);
        let csvContent = headers.join(',') + '\\n';
        
        // 데이터 행 생성
        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header];
                if (value === null || value === undefined) {
                    value = '';
                } else if (typeof value === 'string' && value.includes(',')) {
                    value = `"${value}"`;
                }
                return value;
            });
            csvContent += values.join(',') + '\\n';
        });
        
        // 파일 다운로드
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    /**
     * 데이터베이스 연결 상태 확인
     */
    async checkConnection() {
        try {
            // 간단한 읽기 테스트
            await getDocs(query(collection(this.db, this.collections.departments), limit(1)));
            return { connected: true, timestamp: new Date() };
        } catch (error) {
            console.error('데이터베이스 연결 확인 실패:', error);
            return { connected: false, error: error.message, timestamp: new Date() };
        }
    }
    
    /**
     * 데이터 통계 계산 헬퍼
     * @param {Array} data - 데이터 배열
     * @param {string} field - 집계할 필드
     * @returns {Object} 통계 결과
     */
    calculateStats(data, field) {
        if (!data || data.length === 0) {
            return { count: 0, unique: 0, distribution: {} };
        }
        
        const distribution = {};
        const uniqueValues = new Set();
        
        data.forEach(item => {
            const value = item[field];
            if (value !== null && value !== undefined) {
                uniqueValues.add(value);
                distribution[value] = (distribution[value] || 0) + 1;
            }
        });
        
        return {
            count: data.length,
            unique: uniqueValues.size,
            distribution
        };
    }
    
    /**
     * 날짜 범위 필터 헬퍼
     * @param {Date} startDate - 시작 날짜
     * @param {Date} endDate - 종료 날짜
     * @returns {Object} Firestore 쿼리 조건
     */
    createDateRangeFilter(startDate, endDate) {
        const filters = [];
        
        if (startDate) {
            filters.push(where('createdAt', '>=', startDate));
        }
        
        if (endDate) {
            filters.push(where('createdAt', '<=', endDate));
        }
        
        return filters;
    }
    
    /**
     * 페이징 헬퍼
     * @param {number} page - 페이지 번호
     * @param {number} size - 페이지 크기
     * @returns {Object} 페이징 정보
     */
    createPaginationInfo(page, size, total) {
        const totalPages = Math.ceil(total / size);
        const startIndex = (page - 1) * size + 1;
        const endIndex = Math.min(page * size, total);
        
        return {
            currentPage: page,
            pageSize: size,
            totalPages,
            totalItems: total,
            startIndex,
            endIndex,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
    }
}

console.log('🔧 db-helpers.js 모듈 로드 완료');