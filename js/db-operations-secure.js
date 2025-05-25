/*
📁 js/db-operations-secure.js  
KDV ERP 시스템 - 보안 강화 데이터베이스 작업
Create at 250525_1940 Ver1.00
*/

import { db } from './firebase-config.js';
import { SecurityUtils } from './security-utils.js';
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
 * 보안 강화된 데이터베이스 작업 클래스
 * 입력 검증, 권한 확인, Rate Limiting 등 보안 기능 통합
 */
export class SecureDatabaseOperations {
    constructor() {
        this.db = db;
        this.collections = {
            users: 'users',
            employees: 'employees',
            employeePrivate: 'employee_private', 
            systemLogs: 'system_logs',
            departments: 'departments',
            securityLogs: 'security_logs'
        };
        
        // 보안 설정
        this.maxPageSize = 100;
        this.defaultPageSize = 20;
    }
    
    /**
     * 사용자 권한 확인
     * @param {string} userId - 사용자 ID
     * @param {string} action - 작업 유형 ('read', 'write', 'delete')
     * @param {Object} resource - 리소스 정보
     * @returns {Promise<boolean>} 권한 보유 여부
     */
    async checkPermission(userId, action, resource = null) {
        try {
            if (!userId || typeof userId !== 'string') {
                this.logSecurityEvent('permission_check_failed', userId, 'Invalid user ID');
                return false;
            }
            
            // 사용자 정보 조회
            const userDoc = await getDoc(doc(this.db, this.collections.users, userId));
            if (!userDoc.exists()) {
                this.logSecurityEvent('permission_check_failed', userId, 'User not found');
                return false;
            }
            
            const userData = userDoc.data();
            const userLevel = userData.securityLevel || '일반';
            const isAdmin = userData.isAdmin === true;
            
            // 관리자는 모든 권한 보유
            if (isAdmin) return true;
            
            // 권한별 허용 작업 정의
            const permissions = {
                '일반': ['read'],
                '관리자': ['read', 'write'],
                'VIP': ['read', 'write', 'delete']
            };
            
            const allowedActions = permissions[userLevel] || ['read'];
            const hasPermission = allowedActions.includes(action);
            
            if (!hasPermission) {
                this.logSecurityEvent('permission_denied', userId, `Action: ${action}, Level: ${userLevel}`);
            }
            
            return hasPermission;
            
        } catch (error) {
            console.error('권한 확인 실패:', error);
            this.logSecurityEvent('permission_error', userId, error.message);
            return false;
        }
    }
    
    /**
     * Rate limiting 확인
     * @param {string} userId - 사용자 ID
     * @param {string} operation - 작업 유형
     * @returns {boolean} 요청 허용 여부
     */
    checkRateLimit(userId, operation = 'general') {
        const key = `${userId}:${operation}`;
        
        // 작업별 다른 제한 설정
        const limits = {
            'read': { max: 100, window: 60000 },    // 1분에 100회
            'write': { max: 20, window: 60000 },    // 1분에 20회
            'delete': { max: 5, window: 60000 },    // 1분에 5회
            'general': { max: 50, window: 60000 }   // 1분에 50회
        };
        
        const config = limits[operation] || limits.general;
        const allowed = SecurityUtils.checkRateLimit(key, config.max, config.window);
        
        if (!allowed) {
            this.logSecurityEvent('rate_limit_exceeded', userId, `Operation: ${operation}`);
        }
        
        return allowed;
    }
    
    /**
     * 보안 로그 기록
     * @param {string} event - 이벤트 유형
     * @param {string} userId - 사용자 ID
     * @param {string} details - 상세 정보
     */
    async logSecurityEvent(event, userId, details) {
        try {
            const logData = {
                event,
                userId: userId || 'anonymous',
                details: details || '',
                timestamp: serverTimestamp(),
                userAgent: navigator.userAgent,
                ip: 'client-side', // 클라이언트에서는 실제 IP 확인 불가
                sessionId: SecurityUtils.generateCSRFToken().substr(0, 16)
            };
            
            await addDoc(collection(this.db, this.collections.securityLogs), logData);
            console.log('🔒 보안 이벤트 로그:', event);
            
        } catch (error) {
            console.error('보안 로그 기록 실패:', error);
        }
    }
    
    /**
     * 입력 데이터 검증 및 정제
     * @param {Object} data - 검증할 데이터
     * @param {string} type - 데이터 유형 ('employee', 'user', etc.)
     * @returns {Object} 검증 결과 {isValid: boolean, sanitizedData: Object, errors: Array}
     */
    validateAndSanitizeData(data, type = 'employee') {
        if (type === 'employee') {
            const validation = SecurityUtils.validateEmployeeData(data);
            if (!validation.isValid) {
                return validation;
            }
            
            // 데이터 정제
            const sanitizedData = {};
            Object.keys(data).forEach(key => {
                if (typeof data[key] === 'string') {
                    sanitizedData[key] = SecurityUtils.stripHtml(data[key]).trim();
                } else {
                    sanitizedData[key] = data[key];
                }
            });
            
            return {
                isValid: true,
                sanitizedData,
                errors: []
            };
        }
        
        return { isValid: false, errors: ['지원되지 않는 데이터 유형'] };
    }
    
    /**
     * 보안 강화된 직원 목록 조회
     * @param {string} userId - 요청자 ID
     * @param {Object} options - 검색 옵션
     * @returns {Promise<Object>} 직원 목록 및 메타데이터
     */
    async getEmployees(userId, options = {}) {
        try {
            // 권한 확인
            if (!await this.checkPermission(userId, 'read')) {
                throw new Error('접근 권한이 없습니다.');
            }
            
            // Rate limiting 확인
            if (!this.checkRateLimit(userId, 'read')) {
                throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
            }
            
            // 입력 매개변수 검증 및 정제
            const {
                department = null,
                status = null,
                searchTerm = null,
                orderField = 'name',
                orderDirection = 'asc',
                pageSize = this.defaultPageSize,
                lastDoc = null
            } = options;
            
            // 페이지 크기 제한
            const safePageSize = Math.min(Math.max(1, pageSize || this.defaultPageSize), this.maxPageSize);
            
            // 정렬 필드 허용 목록 확인
            const allowedOrderFields = ['name', 'department', 'position', 'createdAt', 'updatedAt'];
            const safeOrderField = allowedOrderFields.includes(orderField) ? orderField : 'name';
            const safeOrderDirection = ['asc', 'desc'].includes(orderDirection) ? orderDirection : 'asc';
            
            // 검색어 정제
            let safeSearchTerm = null;
            if (searchTerm && typeof searchTerm === 'string') {
                safeSearchTerm = SecurityUtils.stripHtml(searchTerm.trim());
                if (SecurityUtils.hasSqlInjectionRisk(safeSearchTerm)) {
                    throw new Error('검색어에 허용되지 않은 문자가 포함되어 있습니다.');
                }
            }
            
            let q = collection(this.db, this.collections.employees);
            const constraints = [];
            
            // 부서 필터 (정제)
            if (department) {
                const safeDepartment = SecurityUtils.stripHtml(department.trim());
                constraints.push(where('department', '==', safeDepartment));
            }
            
            // 재직 상태 필터 (정제)
            if (status) {
                const safeStatus = SecurityUtils.stripHtml(status.trim());
                constraints.push(where('status', '==', safeStatus));
            }
            
            // 정렬
            constraints.push(orderBy(safeOrderField, safeOrderDirection));
            
            // 페이징
            constraints.push(limit(safePageSize));
            
            if (lastDoc) {
                constraints.push(startAfter(lastDoc));
            }
            
            q = query(q, ...constraints);
            const querySnapshot = await getDocs(q);
            
            const employees = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                employees.push({
                    id: doc.id,
                    ...data,
                    // 민감 정보 제거
                    internalNotes: undefined,
                    privateData: undefined,
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                    joinDate: data.joinDate?.toDate()
                });
            });
            
            // 클라이언트 사이드 검색 (안전한 검색어만)
            let filteredEmployees = employees;
            if (safeSearchTerm && safeSearchTerm.length >= 2) {
                const term = safeSearchTerm.toLowerCase();
                filteredEmployees = employees.filter(emp => 
                    (emp.name && emp.name.toLowerCase().includes(term)) ||
                    (emp.position && emp.position.toLowerCase().includes(term)) ||
                    (emp.email && emp.email.toLowerCase().includes(term)) ||
                    (emp.mobile && emp.mobile.includes(term))
                );
            }
            
            // 액세스 로그
            await this.logSecurityEvent('data_access', userId, `Employees query: ${filteredEmployees.length} results`);
            
            return {
                employees: filteredEmployees,
                lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
                hasMore: querySnapshot.docs.length === safePageSize,
                total: querySnapshot.size
            };
            
        } catch (error) {
            console.error('직원 목록 조회 실패:', error);
            
            // 보안 이벤트 로그
            await this.logSecurityEvent('data_access_failed', userId, error.message);
            
            // 안전한 에러 메시지 반환
            const safeError = new Error(SecurityUtils.sanitizeErrorMessage(error, false));
            throw safeError;
        }
    }
    
    /**
     * 보안 강화된 직원 생성
     * @param {string} userId - 생성자 ID
     * @param {Object} employeeData - 직원 데이터
     * @param {string} csrfToken - CSRF 토큰
     * @returns {Promise<string>} 생성된 직원 ID
     */
    async createEmployee(userId, employeeData, csrfToken) {
        try {
            // CSRF 토큰 검증
            if (!SecurityUtils.validateCSRFToken(csrfToken)) {
                throw new Error('유효하지 않은 요청입니다.');
            }
            
            // 권한 확인
            if (!await this.checkPermission(userId, 'write')) {
                throw new Error('생성 권한이 없습니다.');
            }
            
            // Rate limiting 확인
            if (!this.checkRateLimit(userId, 'write')) {
                throw new Error('요청 한도를 초과했습니다.');
            }
            
            // 입력 데이터 검증 및 정제
            const validation = this.validateAndSanitizeData(employeeData, 'employee');
            if (!validation.isValid) {
                throw new Error(`입력 데이터 오류: ${validation.errors.join(', ')}`);
            }
            
            const employeeDoc = {
                ...validation.sanitizedData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: userId,
                status: '재직' // 기본값
            };
            
            const docRef = await addDoc(collection(this.db, this.collections.employees), employeeDoc);
            
            // 성공 로그
            await this.logSecurityEvent('employee_created', userId, `Employee ID: ${docRef.id}`);
            
            console.log('✅ 보안 검증된 직원 생성 완료:', docRef.id);
            return docRef.id;
            
        } catch (error) {
            console.error('직원 생성 실패:', error);
            
            // 실패 로그
            await this.logSecurityEvent('employee_create_failed', userId, error.message);
            
            // 안전한 에러 메시지 반환
            const safeError = new Error(SecurityUtils.sanitizeErrorMessage(error, false));
            throw safeError;
        }
    }
    
    /**
     * 보안 강화된 직원 수정
     * @param {string} userId - 수정자 ID
     * @param {string} employeeId - 직원 ID
     * @param {Object} updateData - 수정할 데이터
     * @param {string} csrfToken - CSRF 토큰
     * @returns {Promise<boolean>} 성공 여부
     */
    async updateEmployee(userId, employeeId, updateData, csrfToken) {
        try {
            // CSRF 토큰 검증
            if (!SecurityUtils.validateCSRFToken(csrfToken)) {
                throw new Error('유효하지 않은 요청입니다.');
            }
            
            // 권한 확인
            if (!await this.checkPermission(userId, 'write')) {
                throw new Error('수정 권한이 없습니다.');
            }
            
            // Rate limiting 확인
            if (!this.checkRateLimit(userId, 'write')) {
                throw new Error('요청 한도를 초과했습니다.');
            }
            
            // 직원 ID 검증
            if (!SecurityUtils.isValidEmployeeId(employeeId)) {
                throw new Error('올바르지 않은 직원 ID입니다.');
            }
            
            // 입력 데이터 검증 및 정제
            const validation = this.validateAndSanitizeData(updateData, 'employee');
            if (!validation.isValid) {
                throw new Error(`입력 데이터 오류: ${validation.errors.join(', ')}`);
            }
            
            // 기존 직원 정보 확인
            const docRef = doc(this.db, this.collections.employees, employeeId);
            const existingDoc = await getDoc(docRef);
            
            if (!existingDoc.exists()) {
                throw new Error('직원 정보를 찾을 수 없습니다.');
            }
            
            const updateDoc = {
                ...validation.sanitizedData,
                updatedAt: serverTimestamp(),
                updatedBy: userId
            };
            
            await updateDoc(docRef, updateDoc);
            
            // 성공 로그
            await this.logSecurityEvent('employee_updated', userId, `Employee ID: ${employeeId}`);
            
            console.log('✅ 보안 검증된 직원 수정 완료:', employeeId);
            return true;
            
        } catch (error) {
            console.error('직원 수정 실패:', error);
            
            // 실패 로그
            await this.logSecurityEvent('employee_update_failed', userId, error.message);
            
            // 안전한 에러 메시지 반환
            const safeError = new Error(SecurityUtils.sanitizeErrorMessage(error, false));
            throw safeError;
        }
    }
    
    /**
     * 보안 강화된 직원 삭제
     * @param {string} userId - 삭제자 ID
     * @param {string} employeeId - 직원 ID
     * @param {string} csrfToken - CSRF 토큰
     * @returns {Promise<boolean>} 성공 여부
     */
    async deleteEmployee(userId, employeeId, csrfToken) {
        try {
            // CSRF 토큰 검증
            if (!SecurityUtils.validateCSRFToken(csrfToken)) {
                throw new Error('유효하지 않은 요청입니다.');
            }
            
            // 권한 확인 (삭제는 높은 권한 필요)
            if (!await this.checkPermission(userId, 'delete')) {
                throw new Error('삭제 권한이 없습니다.');
            }
            
            // Rate limiting 확인
            if (!this.checkRateLimit(userId, 'delete')) {
                throw new Error('요청 한도를 초과했습니다.');
            }
            
            // 직원 ID 검증
            if (!SecurityUtils.isValidEmployeeId(employeeId)) {
                throw new Error('올바르지 않은 직원 ID입니다.');
            }
            
            // 기존 직원 정보 확인 (삭제 전 백업용)
            const employeeRef = doc(this.db, this.collections.employees, employeeId);
            const employeeDoc = await getDoc(employeeRef);
            
            if (!employeeDoc.exists()) {
                throw new Error('직원 정보를 찾을 수 없습니다.');
            }
            
            const employeeData = employeeDoc.data();
            
            const batch = writeBatch(this.db);
            
            // 직원 정보 삭제
            batch.delete(employeeRef);
            
            // 민감정보도 함께 삭제
            const privateRef = doc(this.db, this.collections.employeePrivate, employeeId);
            batch.delete(privateRef);
            
            await batch.commit();
            
            // 삭제 로그 (복원을 위해 중요 정보 포함)
            await this.logSecurityEvent('employee_deleted', userId, 
                `Employee: ${employeeData.name} (${employeeId}), Department: ${employeeData.department}`);
            
            console.log('✅ 보안 검증된 직원 삭제 완료:', employeeId);
            return true;
            
        } catch (error) {
            console.error('직원 삭제 실패:', error);
            
            // 실패 로그
            await this.logSecurityEvent('employee_delete_failed', userId, error.message);
            
            // 안전한 에러 메시지 반환
            const safeError = new Error(SecurityUtils.sanitizeErrorMessage(error, false));
            throw safeError;
        }
    }
}

console.log('🔒 db-operations-secure.js 모듈 로드 완료');
