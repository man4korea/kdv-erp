/*
📁 js/db-operations.js  
KDV ERP 시스템 - 데이터베이스 핵심 CRUD 작업
Create at 250525_2200 Ver1.00
*/

import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    getDoc,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    serverTimestamp,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

/**
 * 데이터베이스 핵심 CRUD 작업 클래스
 */
export class DatabaseOperations {
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
    // 직원 관련 CRUD 함수들
    // ========================================================================
    
    /**
     * 직원 목록 조회 (페이징 지원)
     * @param {Object} options - 검색 옵션
     * @returns {Promise<Object>} 직원 목록 및 메타데이터
     */
    async getEmployees(options = {}) {
        try {
            const {
                department = null,
                status = null,
                searchTerm = null,
                orderField = 'name',
                orderDirection = 'asc',
                pageSize = 20,
                lastDoc = null
            } = options;
            
            let q = collection(this.db, this.collections.employees);
            const constraints = [];
            
            // 부서 필터
            if (department) {
                constraints.push(where('department', '==', department));
            }
            
            // 재직 상태 필터
            if (status) {
                constraints.push(where('status', '==', status));
            }
            
            // 정렬
            constraints.push(orderBy(orderField, orderDirection));
            
            // 페이징
            if (pageSize) {
                constraints.push(limit(pageSize));
            }
            
            if (lastDoc) {
                constraints.push(startAfter(lastDoc));
            }
            
            q = query(q, ...constraints);
            const querySnapshot = await getDocs(q);
            
            const employees = [];
            querySnapshot.forEach(doc => {
                employees.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate(),
                    joinDate: doc.data().joinDate?.toDate()
                });
            });
            
            // 이름으로 검색 (클라이언트 사이드 필터링)
            let filteredEmployees = employees;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredEmployees = employees.filter(emp => 
                    emp.name.toLowerCase().includes(term) ||
                    emp.position.toLowerCase().includes(term) ||
                    (emp.email && emp.email.toLowerCase().includes(term)) ||
                    (emp.mobile && emp.mobile.includes(term))
                );
            }
            
            return {
                employees: filteredEmployees,
                lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
                hasMore: querySnapshot.docs.length === pageSize,
                total: querySnapshot.size
            };
            
        } catch (error) {
            console.error('직원 목록 조회 실패:', error);
            throw error;
        }
    }
    
    /**
     * 직원 상세 정보 조회
     * @param {string} employeeId - 직원 ID
     * @returns {Promise<Object>} 직원 정보
     */
    async getEmployee(employeeId) {
        try {
            const docRef = doc(this.db, this.collections.employees, employeeId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                throw new Error('직원을 찾을 수 없습니다.');
            }
            
            const employeeData = {
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: docSnap.data().createdAt?.toDate(),
                updatedAt: docSnap.data().updatedAt?.toDate(),
                joinDate: docSnap.data().joinDate?.toDate()
            };
            
            return employeeData;
            
        } catch (error) {
            console.error('직원 정보 조회 실패:', error);
            throw error;
        }
    }
    
    /**
     * 직원 정보 생성
     * @param {Object} employeeData - 직원 데이터
     * @param {string} userId - 생성자 ID
     * @returns {Promise<string>} 생성된 직원 ID
     */
    async createEmployee(employeeData, userId) {
        try {
            const employeeDoc = {
                ...employeeData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: userId
            };
            
            const docRef = await addDoc(collection(this.db, this.collections.employees), employeeDoc);
            
            console.log('✅ 직원 생성 완료:', docRef.id);
            return docRef.id;
            
        } catch (error) {
            console.error('직원 생성 실패:', error);
            throw error;
        }
    }
    
    /**
     * 직원 정보 수정
     * @param {string} employeeId - 직원 ID
     * @param {Object} updateData - 수정할 데이터
     * @param {string} userId - 수정자 ID
     * @returns {Promise<boolean>} 성공 여부
     */
    async updateEmployee(employeeId, updateData, userId) {
        try {
            const docRef = doc(this.db, this.collections.employees, employeeId);
            const updateDoc = {
                ...updateData,
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(docRef, updateDoc);
            
            console.log('✅ 직원 수정 완료:', employeeId);
            return true;
            
        } catch (error) {
            console.error('직원 수정 실패:', error);
            throw error;
        }
    }
    
    /**
     * 직원 삭제
     * @param {string} employeeId - 직원 ID
     * @param {string} userId - 삭제자 ID
     * @returns {Promise<boolean>} 성공 여부
     */
    async deleteEmployee(employeeId, userId) {
        try {
            // 직원 정보 조회 (로그용)
            const employee = await this.getEmployee(employeeId);
            
            const batch = writeBatch(this.db);
            
            // 직원 정보 삭제
            const employeeRef = doc(this.db, this.collections.employees, employeeId);
            batch.delete(employeeRef);
            
            // 민감정보도 함께 삭제
            const privateRef = doc(this.db, this.collections.employeePrivate, employeeId);
            batch.delete(privateRef);
            
            await batch.commit();
            
            console.log('✅ 직원 삭제 완료:', employeeId);
            return true;
            
        } catch (error) {
            console.error('직원 삭제 실패:', error);
            throw error;
        }
    }
    
    // ========================================================================
    // 부서 관련 함수들
    // ========================================================================
    
    /**
     * 부서 목록 조회
     * @returns {Promise<Array>} 부서 목록
     */
    async getDepartments() {
        try {
            const querySnapshot = await getDocs(
                query(
                    collection(this.db, this.collections.departments),
                    where('isActive', '==', true),
                    orderBy('name')
                )
            );
            
            const departments = [];
            querySnapshot.forEach(doc => {
                departments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return departments;
            
        } catch (error) {
            console.error('부서 목록 조회 실패:', error);
            throw error;
        }
    }
    
    /**
     * 부서별 직원 수 조회
     * @returns {Promise<Object>} 부서별 통계
     */
    async getDepartmentStats() {
        try {
            const employees = await this.getEmployees({ 
                status: '재직',
                pageSize: null // 모든 데이터 조회
            });
            
            const stats = {};
            employees.employees.forEach(emp => {
                if (!stats[emp.department]) {
                    stats[emp.department] = 0;
                }
                stats[emp.department]++;
            });
            
            return stats;
            
        } catch (error) {
            console.error('부서별 통계 조회 실패:', error);
            throw error;
        }
    }
}

console.log('🗄️ db-operations.js 모듈 로드 완료');