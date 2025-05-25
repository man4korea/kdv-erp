/*
📁 js/auth-permissions.js
KDV 시스템 - 권한 제어 모듈
Create at 250525_1910 Ver1.00
*/

// Firestore 관련 함수들 import
import { 
    doc, 
    getDoc, 
    setDoc,
    updateDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

// Firebase 설정에서 db import
import { db } from './firebase-config.js';

/**
 * 권한 제어 클래스
 * 사용자 프로필 관리 및 권한 체계 담당
 */
export class PermissionsManager {
    constructor() {
        this.userProfile = null;
        
        console.log('🔑 PermissionsManager 초기화 완료');
    }
    
    /**
     * 사용자 프로필 정보 로드
     * @param {string} uid - 사용자 UID
     * @param {string} email - 사용자 이메일 (기본 프로필 생성용)
     * @returns {Promise<object|null>} 사용자 프로필 데이터
     */
    async loadUserProfile(uid, email = '') {
        try {
            console.log('📄 사용자 프로필 로드 중:', uid);
            
            // Firestore에서 사용자 정보 조회
            const userDocRef = doc(db, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const profileData = userDocSnap.data();
                this.userProfile = profileData;
                console.log('✅ 사용자 프로필 로드 성공');
                return profileData;
            } else {
                console.warn('⚠️ 사용자 프로필이 존재하지 않음, 기본 프로필 생성');
                
                // 기본 프로필 생성
                const defaultProfile = {
                    email: email,
                    securityLevel: '일반',
                    isAdmin: false,
                    lastLoginAt: null,
                    createdAt: serverTimestamp(),
                    employeeId: null
                };
                
                await setDoc(userDocRef, defaultProfile);
                this.userProfile = defaultProfile;
                return defaultProfile;
            }
            
        } catch (error) {
            console.error('❌ 프로필 로드 실패:', error);
            return null;
        }
    }
    
    /**
     * 최근 로그인 시간 업데이트
     * @param {string} uid - 사용자 UID
     */
    async updateLastLoginTime(uid) {
        try {
            const userDocRef = doc(db, 'users', uid);
            await updateDoc(userDocRef, {
                lastLoginAt: serverTimestamp()
            });
            
            // 로컬 프로필도 업데이트
            if (this.userProfile) {
                this.userProfile.lastLoginAt = new Date();
            }
            
            console.log('📅 최근 로그인 시간 업데이트 완료');
        } catch (error) {
            console.error('❌ 로그인 시간 업데이트 실패:', error);
        }
    }
    
    /**
     * 사용자 프로필 업데이트
     * @param {string} uid - 사용자 UID
     * @param {object} updateData - 업데이트할 데이터
     * @returns {Promise<boolean>} 성공 여부
     */
    async updateUserProfile(uid, updateData) {
        try {
            const userDocRef = doc(db, 'users', uid);
            await updateDoc(userDocRef, updateData);
            
            // 로컬 프로필도 업데이트
            if (this.userProfile) {
                Object.assign(this.userProfile, updateData);
            }
            
            console.log('✅ 사용자 프로필 업데이트 완료');
            return true;
        } catch (error) {
            console.error('❌ 프로필 업데이트 실패:', error);
            return false;
        }
    }
    
    /**
     * 현재 사용자 정보 반환 (프로필 포함)
     * @param {object} basicUserInfo - 기본 사용자 정보 (uid, email)
     * @returns {object|null} 현재 사용자 정보
     */
    getCurrentUser(basicUserInfo = null) {
        return {
            user: basicUserInfo,
            profile: this.userProfile,
            isLoggedIn: !!basicUserInfo
        };
    }
    
    /**
     * 관리자 권한 확인
     * @returns {boolean} 관리자 여부
     */
    isAdmin() {
        return this.userProfile?.isAdmin === true;
    }
    
    /**
     * 보안 등급 확인
     * @returns {string} 보안 등급 ('일반', '관리자', 'VIP' 등)
     */
    getSecurityLevel() {
        return this.userProfile?.securityLevel || '일반';
    }
    
    /**
     * 직원 ID 확인
     * @returns {string|null} 직원 ID
     */
    getEmployeeId() {
        return this.userProfile?.employeeId || null;
    }
    
    /**
     * 특정 권한 확인
     * @param {string} permission - 확인할 권한명
     * @returns {boolean} 권한 보유 여부
     */
    hasPermission(permission) {
        if (!this.userProfile) return false;
        
        // 관리자는 모든 권한 보유
        if (this.isAdmin()) return true;
        
        // 프로필에 permissions 배열이 있는 경우
        if (this.userProfile.permissions && Array.isArray(this.userProfile.permissions)) {
            return this.userProfile.permissions.includes(permission);
        }
        
        // 기본 권한 체계 (보안 등급 기반) - 보안 강화
        const securityLevel = this.getSecurityLevel();
        
        // 허용된 보안 등급 화이트리스트
        const allowedSecurityLevels = ['일반', '관리자', 'VIP'];
        if (!allowedSecurityLevels.includes(securityLevel)) {
            return false; // 허용되지 않은 보안 등급
        }
        
        const basicPermissions = new Map([
            ['일반', ['read']],
            ['관리자', ['read', 'write', 'delete']],
            ['VIP', ['read', 'write']]
        ]);
        
        const userPermissions = basicPermissions.get(securityLevel) || [];
        return userPermissions.includes(permission);
    }
    
    /**
     * 사용자 권한 목록 반환
     * @returns {array} 권한 목록
     */
    getUserPermissions() {
        if (!this.userProfile) return [];
        
        // 관리자는 모든 권한
        if (this.isAdmin()) {
            return ['read', 'write', 'delete', 'admin'];
        }
        
        // 프로필에 직접 정의된 권한
        if (this.userProfile.permissions) {
            return this.userProfile.permissions;
        }
        
        // 보안 등급 기반 기본 권한 - 보안 강화
        const securityLevel = this.getSecurityLevel();
        
        // 허용된 보안 등급 화이트리스트
        const allowedSecurityLevels = ['일반', '관리자', 'VIP'];
        if (!allowedSecurityLevels.includes(securityLevel)) {
            return ['read']; // 기본 권한
        }
        
        const basicPermissions = new Map([
            ['일반', ['read']],
            ['관리자', ['read', 'write', 'delete']],
            ['VIP', ['read', 'write']]
        ]);
        
        return basicPermissions.get(securityLevel) || ['read'];
    }
    
    /**
     * 프로필 초기화
     */
    clearProfile() {
        this.userProfile = null;
        console.log('🧹 사용자 프로필 초기화 완료');
    }
}

console.log('📄 auth-permissions.js 모듈 로드 완료');
