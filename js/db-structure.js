/*
📁 js/db-structure.js
KDV ERP 시스템 - 데이터베이스 구조 초기화
Create at 250525_2200 Ver1.00
*/

import { db, auth } from './firebase-config.js';
import { 
    collection, 
    doc, 
    setDoc, 
    addDoc, 
    getDocs, 
    query, 
    where,
    serverTimestamp,
    enableNetwork,
    disableNetwork
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

/**
 * 데이터베이스 구조 초기화 클래스
 */
export class DatabaseStructure {
    constructor() {
        this.db = db;
        this.collections = {
            users: 'users',
            employees: 'employees', 
            employeePrivate: 'employee_private',
            systemLogs: 'system_logs',
            departments: 'departments'
        };
        
        console.log('🏗️ DatabaseStructure 초기화 완료');
    }
    
    /**
     * 데이터베이스 구조 초기화 실행
     */
    async initializeStructure() {
        try {
            console.log('🚀 데이터베이스 구조 초기화 시작...');
            
            // 1. 부서 구조 생성
            await this.createDepartments();
            
            // 2. 초기 시스템 로그 설정
            await this.createInitialSystemLog();
            
            console.log('✅ 데이터베이스 구조 초기화 완료!');
            return { success: true, message: '데이터베이스 구조가 성공적으로 초기화되었습니다.' };
            
        } catch (error) {
            console.error('❌ 데이터베이스 구조 초기화 실패:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 부서 데이터 생성
     */
    async createDepartments() {
        console.log('📁 부서 데이터 생성 중...');
        
        const departments = [
            {
                name: '임원',
                code: 'EXEC',
                parentDepartment: null,
                manager: null, // 직원 생성 후 업데이트 예정
                isActive: true,
                description: '경영진 및 임원',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            {
                name: '개발팀',
                code: 'DEV',
                parentDepartment: null,
                manager: null,
                isActive: true,
                description: '소프트웨어 개발 및 기술 지원',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            {
                name: '영업팀',
                code: 'SALES',
                parentDepartment: null,
                manager: null,
                isActive: true,
                description: '영업 및 마케팅',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            {
                name: '관리팀',
                code: 'ADMIN',
                parentDepartment: null,
                manager: null,
                isActive: true,
                description: '인사, 총무, 회계 업무',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
        ];
        
        for (const dept of departments) {
            const docRef = doc(collection(this.db, this.collections.departments), dept.code);
            await setDoc(docRef, dept);
            console.log(`✅ 부서 생성 완료: ${dept.name} (${dept.code})`);
        }
    }
    
    /**
     * 초기 시스템 로그 생성
     */
    async createInitialSystemLog() {
        console.log('📋 초기 시스템 로그 생성 중...');
        
        const initialLog = {
            action: 'SYSTEM_INIT',
            userId: 'admin-user-001',
            targetCollection: 'system',
            targetDocumentId: 'database-structure-init',
            details: {
                message: '데이터베이스 구조 초기화 완료',
                collections: Object.keys(this.collections),
                timestamp: new Date().toISOString()
            },
            timestamp: serverTimestamp(),
            ipAddress: 'localhost', // 실제 환경에서는 동적으로 획득
            userAgent: navigator.userAgent
        };
        
        await addDoc(collection(this.db, this.collections.systemLogs), initialLog);
        console.log('✅ 초기 시스템 로그 생성 완료');
    }
    
    /**
     * 컬렉션 존재 여부 확인
     */
    async checkCollectionExists(collectionName) {
        try {
            const querySnapshot = await getDocs(collection(this.db, collectionName));
            return !querySnapshot.empty;
        } catch (error) {
            console.error(`컬렉션 확인 실패 (${collectionName}):`, error);
            return false;
        }
    }
    
    /**
     * 데이터베이스 상태 확인
     */
    async checkDatabaseStatus() {
        console.log('🔍 데이터베이스 상태 확인 중...');
        
        const status = {
            collections: {},
            totalDocuments: 0,
            timestamp: new Date().toISOString()
        };
        
        for (const [key, collectionName] of Object.entries(this.collections)) {
            try {
                const querySnapshot = await getDocs(collection(this.db, collectionName));
                status.collections[key] = {
                    name: collectionName,
                    documentCount: querySnapshot.size,
                    exists: !querySnapshot.empty
                };
                status.totalDocuments += querySnapshot.size;
            } catch (error) {
                console.error(`컬렉션 상태 확인 실패 (${collectionName}):`, error);
                status.collections[key] = {
                    name: collectionName,
                    documentCount: 0,
                    exists: false,
                    error: error.message
                };
            }
        }
        
        console.log('📊 데이터베이스 상태:', status);
        return status;
    }
    
    /**
     * 테스트 데이터 삭제 (개발용)
     */
    async clearTestData() {
        console.log('🗑️ 테스트 데이터 삭제 중...');
        
        try {
            // 실제 구현에서는 batch delete 사용 권장
            const collections = [
                this.collections.systemLogs,
                this.collections.employeePrivate,
                this.collections.employees,
                this.collections.users,
                this.collections.departments
            ];
            
            for (const collectionName of collections) {
                const querySnapshot = await getDocs(collection(this.db, collectionName));
                console.log(`${collectionName}: ${querySnapshot.size}개 문서 삭제 예정`);
                // 실제 삭제는 Firebase Console에서 수행하거나 별도 스크립트 사용
            }
            
            return { success: true, message: '테스트 데이터 삭제 예약 완료' };
            
        } catch (error) {
            console.error('테스트 데이터 삭제 실패:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 시스템 로그 기록
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
                ipAddress: 'localhost', // 실제 환경에서는 동적 획득
                userAgent: navigator.userAgent
            };
            
            await addDoc(collection(this.db, this.collections.systemLogs), logEntry);
            console.log(`📝 로그 기록: ${action}`);
            
        } catch (error) {
            console.error('로그 기록 실패:', error);
        }
    }
}

/**
 * 데이터베이스 스키마 검증 함수들
 */
export const SchemaValidator = {
    /**
     * 직원 데이터 유효성 검증
     */
    validateEmployee(employeeData) {
        const required = ['name', 'department', 'position', 'status'];
        const missing = required.filter(field => !employeeData[field]);
        
        if (missing.length > 0) {
            throw new Error(`필수 필드 누락: ${missing.join(', ')}`);
        }
        
        if (!['재직', '휴직', '퇴직'].includes(employeeData.status)) {
            throw new Error('유효하지 않은 직원 상태');
        }
        
        if (employeeData.mobile && !employeeData.mobile.match(/^010-[0-9]{4}-[0-9]{4}$/)) {
            throw new Error('유효하지 않은 휴대폰 번호 형식');
        }
        
        if (employeeData.email && !employeeData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            throw new Error('유효하지 않은 이메일 형식');
        }
        
        return true;
    },
    
    /**
     * 사용자 데이터 유효성 검증
     */
    validateUser(userData) {
        const required = ['email', 'displayName', 'securityLevel'];
        const missing = required.filter(field => !userData[field]);
        
        if (missing.length > 0) {
            throw new Error(`필수 필드 누락: ${missing.join(', ')}`);
        }
        
        if (!['일반', '관리자', '최고관리자'].includes(userData.securityLevel)) {
            throw new Error('유효하지 않은 보안 레벨');
        }
        
        if (!userData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            throw new Error('유효하지 않은 이메일 형식');
        }
        
        return true;
    }
};

console.log('🏗️ db-structure.js 모듈 로드 완료');