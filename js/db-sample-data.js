/*
📁 js/db-sample-data.js
KDV ERP 시스템 - 샘플 데이터 생성 및 암호화
Create at 250525_2200 Ver1.00
*/

import { db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    setDoc, 
    addDoc, 
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

/**
 * 샘플 데이터 생성 클래스
 */
export class SampleDataGenerator {
    constructor() {
        this.db = db;
        this.collections = {
            users: 'users',
            employees: 'employees', 
            employeePrivate: 'employee_private',
            systemLogs: 'system_logs',
            departments: 'departments'
        };
        
        console.log('📊 SampleDataGenerator 초기화 완료');
    }
    
    /**
     * 모든 샘플 데이터 생성
     */
    async generateAllSampleData() {
        try {
            console.log('🚀 샘플 데이터 생성 시작...');
            
            // 1. 사용자 데이터 생성  
            await this.createUsers();
            
            // 2. 직원 데이터 생성
            await this.createEmployees();
            
            console.log('✅ 샘플 데이터 생성 완료!');
            return { success: true, message: '샘플 데이터가 성공적으로 생성되었습니다.' };
            
        } catch (error) {
            console.error('❌ 샘플 데이터 생성 실패:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 사용자 데이터 생성
     */
    async createUsers() {
        console.log('👤 사용자 데이터 생성 중...');
        
        const users = [
            {
                // NOTE: UID는 Firebase Auth에서 실제 사용자가 생성될 때 할당됨.
                // 초기화 시에는 임시 값을 사용하고 실제 배포/사용 시에는 Auth 연동 필요
                uid: 'initial-admin-uid', // 임시 UID, 실제 Auth UID로 대체 필요
                email: 'man4korea@gmail.com',
                displayName: '이인규', // 직원 이름과 연결
                // securityLevel: '최고관리자', // 기존 최고관리자 등급
                securityLevel: '1급', // 요청하신 1급 등급 적용
                isAdmin: true, // 요청하신 관리자 여부 true 적용
                isActive: true,
                department: '임원',
                position: '총괄이사',
                lastLoginAt: null, // 로그인 시 업데이트
                loginCount: 0, // 로그인 시 업데이트
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            {
                uid: 'test-user-uid', // 임시 UID
                email: 'test@kdv.co.kr',
                displayName: '테스트 사용자',
                securityLevel: '일반', // 일반 등급
                isAdmin: false,
                isActive: true,
                department: '개발팀',
                position: '개발자',
                lastLoginAt: null,
                loginCount: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
        ];
        
        // 사용자 데이터는 이메일을 기준으로 Firestore 문서 ID를 사용하거나,
        // Firebase Authentication에서 생성된 UID를 사용하는 것이 일반적입니다.
        // 여기서는 초기 데이터 생성을 위해 임시 UID를 사용하고 이메일로 조회 가능하게 합니다.
        // 실제 시스템에서는 Firebase Authentication 사용자 생성 후 해당 UID로 Firestore 문서 생성 필요.

        for (const user of users) {
            // 사용자 UID를 문서 ID로 사용 (임시 UID 사용)
            // TODO: 실제 배포 시에는 Firebase Authentication 사용자 생성 후 반환된 UID를 사용하도록 수정해야 합니다.
            const docRef = doc(collection(this.db, this.collections.users), user.uid);
            await setDoc(docRef, user);
            console.log(`✅ 사용자 생성 완료: ${user.displayName} (${user.email})`);
        }
    }
    
    /**
     * 직원 데이터 생성
     */
    async createEmployees() {
        console.log('👥 직원 데이터 생성 중...');
        
        // 업데이트된 직원 데이터 구조 및 이인규 총괄이사 전체 데이터
        const employees = [
            {
                // 기본 정보
                name: '이인규',
                department: '임원',
                position: '총괄이사',
                status: '재직', // 재직, 휴직, 퇴직
                joinDate: new Date('2025-05-22'),
                quitDate: null, // 퇴사일자

                // 연락처 및 식별 정보 (민감 정보 제외)
                mobile: '010-2604-5679',
                officialEmail: 'man4korea@gmail.com', // 공식 이메일
                employeeNumber: 'EMP001', // 사번 또는 식별자
                avatar: null, // 아바타 이미지 URL
                notes: 'KDV 시스템 총괄 담당',

                // 생성 및 업데이트 정보
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: 'system-init' // 또는 초기화 실행 사용자 ID
            },
            {
                name: '김개발',
                department: '개발팀',
                position: '선임 개발자',
                status: '재직',
                joinDate: new Date('2022-03-15'),
                quitDate: null,
                mobile: '010-1234-5678',
                officialEmail: 'dev@kdv.co.kr',
                employeeNumber: 'EMP002',
                avatar: null,
                notes: '웹 개발 전담',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: 'system-init'
            },
            {
                name: '박영업',
                department: '영업팀',
                position: '영업 대리',
                status: '재직',
                joinDate: new Date('2023-01-10'),
                quitDate: null,
                mobile: '010-2345-6789',
                officialEmail: 'sales@kdv.co.kr',
                employeeNumber: 'EMP003',
                avatar: null,
                notes: '신규 고객 개발 전담',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: 'system-init'
            },
            {
                name: '최관리',
                department: '관리팀',
                position: '주임',
                status: '재직',
                joinDate: new Date('2021-07-01'),
                quitDate: null,
                mobile: '010-3456-7890',
                officialEmail: 'admin@kdv.co.kr',
                employeeNumber: 'EMP004',
                avatar: null,
                notes: '인사 및 총무 업무',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: 'system-init'
            }
        ];
        
        const employeeIds = [];
        
        for (const employee of employees) {
            const docRef = await addDoc(collection(this.db, this.collections.employees), employee);
            employeeIds.push({ 
                id: docRef.id, 
                name: employee.name, 
                department: employee.department, 
                officialEmail: employee.officialEmail 
            });
            console.log(`✅ 직원 생성 완료: ${employee.name} (${employee.position})`);
        }
        
        // 민감한 개인정보는 별도 컬렉션에 저장 (암호화 적용)
        await this.createEmployeePrivateData(employeeIds);
        
        return employeeIds;
    }
    
    /**
     * 직원 민감정보 생성 (암호화)
     */
    async createEmployeePrivateData(employeeIds) {
        console.log('🔒 직원 민감정보 생성 중...');
        
        // 이인규 총괄이사의 민감 정보
        const inkgyuEmployee = employeeIds.find(emp => emp.officialEmail === 'man4korea@gmail.com');

        const privateData = [];

        if (inkgyuEmployee) {
             privateData.push({
                employeeId: inkgyuEmployee.id, 
                personalEmail: this.encryptData('man4korea@hotmail.com'), // 개인 이메일
                residentRegistrationNumber: this.encryptData('600915-1566812'), // 주민등록번호
                homeAddress: this.encryptData('경기도 의정부시 회룡로 254 장암주공7단지 707동 202호'), // 집주소
                emergencyContact: { // 비상 전화번호
                    name: this.encryptData('비공개'), // 실제 데이터에 맞춰 수정 필요
                    relationship: '가족', // 실제 데이터에 맞춰 수정 필요
                    phone: this.encryptData('010-9507-2421')
                },
                birthDate: this.encryptData('1960-09-15'), // 생년월일 (주민번호 앞자리)
                bankAccount: { // 은행 계좌 정보
                    bank: this.encryptData('국민은행'),
                    accountNumber: this.encryptData('123456-78-901234'), // 예시 계좌
                    accountHolder: this.encryptData('이인규')
                },
                salary: {
                    baseSalary: this.encryptData('5000000'),
                    allowances: this.encryptData('500000'),
                    lastUpdated: serverTimestamp()
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        
        for (const data of privateData) {
            const docRef = doc(collection(this.db, this.collections.employeePrivate), data.employeeId);
            await setDoc(docRef, data);
            console.log(`🔒 민감정보 생성 완료: ${data.employeeId}`);
        }
    }
    
    /**
     * 간단한 데이터 암호화 함수 (실제 환경에서는 더 강력한 암호화 사용)
     */
    encryptData(data) {
        if (!data) return null;
        
        // Base64 인코딩을 이용한 간단한 암호화 (실제로는 AES 등 사용 권장)
        try {
            return btoa(unescape(encodeURIComponent(data + '_encrypted_' + Date.now())));
        } catch (error) {
            console.error('암호화 실패:', error);
            return data; // 암호화 실패 시 원본 반환
        }
    }
    
    /**
     * 데이터 복호화 함수
     */
    decryptData(encryptedData) {
        if (!encryptedData || !encryptedData.includes('_encrypted_')) {
            return encryptedData; // 암호화되지 않은 데이터
        }
        
        try {
            const decoded = decodeURIComponent(escape(atob(encryptedData)));
            return decoded.split('_encrypted_')[0];
        } catch (error) {
            console.error('복호화 실패:', error);
            return encryptedData; // 복호화 실패 시 원본 반환
        }
    }
    
    /**
     * 추가 테스트 데이터 생성 (개발용)
     */
    async generateAdditionalTestData(count = 10) {
        console.log(`📊 추가 테스트 데이터 ${count}개 생성 중...`);
        
        const departments = ['개발팀', '영업팀', '관리팀'];
        const positions = ['사원', '대리', '과장', '차장', '부장'];
        const statuses = ['재직', '휴직'];
        
        const additionalEmployees = [];
        
        for (let i = 1; i <= count; i++) {
            const randomDept = departments[Math.floor(Math.random() * departments.length)];
            const randomPosition = positions[Math.floor(Math.random() * positions.length)];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            const employee = {
                name: `테스트직원${String(i).padStart(2, '0')}`,
                department: randomDept,
                position: randomPosition,
                status: randomStatus,
                joinDate: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                quitDate: null,
                mobile: `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
                officialEmail: `test${i}@kdv.co.kr`,
                employeeNumber: `TEST${String(i).padStart(3, '0')}`,
                avatar: null,
                notes: `테스트용 직원 데이터 ${i}`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                createdBy: 'system-test-data'
            };
            
            additionalEmployees.push(employee);
        }
        
        // 배치로 추가
        for (const employee of additionalEmployees) {
            await addDoc(collection(this.db, this.collections.employees), employee);
            console.log(`✅ 테스트 직원 생성: ${employee.name}`);
        }
        
        console.log(`✅ 추가 테스트 데이터 ${count}개 생성 완료`);
    }
}

console.log('📊 db-sample-data.js 모듈 로드 완료');