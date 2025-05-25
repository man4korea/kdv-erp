/*
📁 js/db-init.js
KDV ERP 시스템 - 데이터베이스 초기화 통합 모듈 (모듈화 버전)
Create at 250525_2200 Ver2.00
*/

import { DatabaseStructure, SchemaValidator } from './db-structure.js';
import { SampleDataGenerator } from './db-sample-data.js';

/**
 * 통합 데이터베이스 초기화 클래스
 * 구조 초기화와 샘플 데이터 생성을 조합하여 완전한 기능 제공
 */
class DatabaseInitializer {
    constructor() {
        // 구조 초기화 모듈
        this.structure = new DatabaseStructure();
        
        // 샘플 데이터 생성 모듈
        this.sampleData = new SampleDataGenerator();
        
        // 기존 호환성을 위한 프로퍼티들
        this.db = this.structure.db;
        this.collections = this.structure.collections;
        
        console.log('🔧 DatabaseInitializer (통합 버전) 초기화 완료');
    }
    
    /**
     * 전체 데이터베이스 초기화 실행
     */
    async initializeDatabase() {
        try {
            console.log('🚀 데이터베이스 전체 초기화 시작...');
            
            // 1. 구조 초기화
            const structureResult = await this.structure.initializeStructure();
            if (!structureResult.success) {
                throw new Error('구조 초기화 실패: ' + structureResult.error);
            }
            
            // 2. 샘플 데이터 생성
            const sampleDataResult = await this.sampleData.generateAllSampleData();
            if (!sampleDataResult.success) {
                throw new Error('샘플 데이터 생성 실패: ' + sampleDataResult.error);
            }
            
            console.log('✅ 데이터베이스 전체 초기화 완료!');
            return { success: true, message: '데이터베이스가 성공적으로 초기화되었습니다.' };
            
        } catch (error) {
            console.error('❌ 데이터베이스 초기화 실패:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========================================================================
    // 구조 관련 메서드 위임 (기존 호환성)
    // ========================================================================
    
    /**
     * 부서 데이터 생성
     */
    async createDepartments() {
        return await this.structure.createDepartments();
    }
    
    /**
     * 컬렉션 존재 여부 확인
     */
    async checkCollectionExists(collectionName) {
        return await this.structure.checkCollectionExists(collectionName);
    }
    
    /**
     * 데이터베이스 상태 확인
     */
    async checkDatabaseStatus() {
        return await this.structure.checkDatabaseStatus();
    }
    
    /**
     * 테스트 데이터 삭제 (개발용)
     */
    async clearTestData() {
        return await this.structure.clearTestData();
    }
    
    /**
     * 시스템 로그 기록
     */
    async logActivity(action, userId, targetCollection = null, targetDocumentId = null, details = {}) {
        return await this.structure.logActivity(action, userId, targetCollection, targetDocumentId, details);
    }
    
    // ========================================================================
    // 샘플 데이터 관련 메서드 위임 (기존 호환성)
    // ========================================================================
    
    /**
     * 사용자 데이터 생성
     */
    async createUsers() {
        return await this.sampleData.createUsers();
    }
    
    /**
     * 직원 데이터 생성
     */
    async createEmployees() {
        return await this.sampleData.createEmployees();
    }
    
    /**
     * 직원 민감정보 생성 (암호화)
     */
    async createEmployeePrivateData(employeeIds) {
        return await this.sampleData.createEmployeePrivateData(employeeIds);
    }
    
    /**
     * 간단한 데이터 암호화 함수
     */
    encryptData(data) {
        return this.sampleData.encryptData(data);
    }
    
    /**
     * 데이터 복호화 함수
     */
    decryptData(encryptedData) {
        return this.sampleData.decryptData(encryptedData);
    }
    
    /**
     * 추가 테스트 데이터 생성 (개발용)
     */
    async generateAdditionalTestData(count = 10) {
        return await this.sampleData.generateAdditionalTestData(count);
    }
    
    // ========================================================================
    // 초기 시스템 로그 생성 (기존 호환성)
    // ========================================================================
    
    /**
     * 초기 시스템 로그 생성
     */
    async createInitialSystemLog() {
        return await this.structure.createInitialSystemLog();
    }
}

// 전역 인스턴스 생성 및 export (기존 호환성 유지)
const dbInitializer = new DatabaseInitializer();

export { DatabaseInitializer, dbInitializer, SchemaValidator };

console.log('🔧 db-init.js (통합 모듈) 로드 완료');