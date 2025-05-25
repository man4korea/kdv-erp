/*
📁 js/auth-validators.js
KDV 시스템 - 인증 검증 모듈
Create at 250525_1900 Ver1.00
*/

/**
 * 사용자 권한 확인 함수
 * @param {object} userProfile - 사용자 프로필 정보
 * @param {string} requiredLevel - 필요한 보안 등급
 * @returns {boolean} 권한 여부
 */
export function checkUserPermission(userProfile, requiredLevel) {
    if (!userProfile) {
        console.warn('⚠️ 사용자 프로필이 없습니다');
        return false;
    }
    
    const userLevel = userProfile.securityLevel;
    const isAdmin = userProfile.isAdmin;
    
    // 관리자는 모든 권한 보유
    if (isAdmin) {
        console.log('👑 관리자 권한으로 접근 허용');
        return true;
    }
    
    // 보안 등급별 권한 확인
    const levelHierarchy = {
        '1급': 3,
        '2급': 2,
        '일반': 1
    };
    
    const userLevelValue = levelHierarchy[userLevel] || 0;
    const requiredLevelValue = levelHierarchy[requiredLevel] || 0;
    
    const hasPermission = userLevelValue >= requiredLevelValue;
    
    console.log('🔍 권한 검사:', {
        userLevel: userLevel,
        requiredLevel: requiredLevel,
        userLevelValue: userLevelValue,
        requiredLevelValue: requiredLevelValue,
        hasPermission: hasPermission
    });
    
    return hasPermission;
}

/**
 * 페이지 접근 권한 확인 유틸리티 함수
 * @param {object} currentUser - 현재 사용자 정보
 * @param {string} requiredLevel - 필요한 보안 등급
 * @param {string} redirectUrl - 권한 없을 때 리디렉션할 URL
 * @returns {boolean} 접근 권한 여부
 */
export function checkPageAccess(currentUser, requiredLevel = '일반', redirectUrl = 'login.html') {
    // 로그인하지 않은 경우
    if (!currentUser || !currentUser.isLoggedIn) {
        console.warn('⚠️ 로그인이 필요한 페이지입니다');
        
        // 현재 페이지 URL을 저장하여 로그인 후 돌아갈 수 있도록
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath !== '/login.html' && currentPath !== '/') {
            sessionStorage.setItem('kdv_redirect_after_login', currentPath);
        }
        
        window.location.href = redirectUrl;
        return false;
    }
    
    // 권한 확인
    if (!checkUserPermission(currentUser.profile, requiredLevel)) {
        console.warn('⚠️ 접근 권한이 부족합니다. 필요 등급:', requiredLevel);
        
        // 사용자에게 권한 부족 알림
        const userLevel = currentUser.profile?.securityLevel || '알 수 없음';
        alert(`이 페이지에 접근하려면 ${requiredLevel} 이상의 권한이 필요합니다.\n현재 권한: ${userLevel}`);
        
        // 메인 페이지로 리디렉션
        window.location.href = 'index.html';
        return false;
    }
    
    console.log('✅ 페이지 접근 권한 확인 완료');
    return true;
}

/**
 * 관리자 권한 확인
 * @param {object} currentUser - 현재 사용자 정보
 * @returns {boolean} 관리자 권한 여부
 */
export function isAdmin(currentUser) {
    if (!currentUser || !currentUser.isLoggedIn || !currentUser.profile) {
        return false;
    }
    
    return currentUser.profile.isAdmin === true;
}

/**
 * 특정 기능에 대한 권한 확인
 * @param {object} currentUser - 현재 사용자 정보
 * @param {string} feature - 기능명
 * @returns {boolean} 기능 사용 권한 여부
 */
export function checkFeaturePermission(currentUser, feature) {
    if (!currentUser || !currentUser.isLoggedIn) {
        return false;
    }
    
    // 관리자는 모든 기능 사용 가능
    if (isAdmin(currentUser)) {
        return true;
    }
    
    // 기능별 권한 매트릭스
    const featurePermissions = {
        // 인사관리 기능들
        'employee_view': ['일반', '2급', '1급'],
        'employee_edit': ['2급', '1급'],
        'employee_delete': ['1급'],
        
        // 급여 관리
        'salary_view': ['2급', '1급'], 
        'salary_edit': ['1급'],
        
        // 시스템 관리
        'system_config': ['1급'],
        'user_management': ['1급'],
        
        // 보고서 기능
        'report_basic': ['일반', '2급', '1급'],
        'report_advanced': ['2급', '1급'],
        'report_confidential': ['1급']
    };
    
    const allowedLevels = featurePermissions[feature];
    if (!allowedLevels) {
        console.warn('⚠️ 알 수 없는 기능:', feature);
        return false;
    }
    
    const userLevel = currentUser.profile.securityLevel;
    const hasPermission = allowedLevels.includes(userLevel);
    
    console.log('🔐 기능 권한 검사:', {
        feature: feature,
        userLevel: userLevel,
        allowedLevels: allowedLevels,
        hasPermission: hasPermission
    });
    
    return hasPermission;
}

/**
 * 데이터 접근 권한 확인 (행 레벨 보안)
 * @param {object} currentUser - 현재 사용자 정보
 * @param {object} dataRecord - 데이터 레코드
 * @returns {boolean} 데이터 접근 권한 여부
 */
export function checkDataAccess(currentUser, dataRecord) {
    if (!currentUser || !currentUser.isLoggedIn || !dataRecord) {
        return false;
    }
    
    // 관리자는 모든 데이터 접근 가능
    if (isAdmin(currentUser)) {
        return true;
    }
    
    // 자신의 데이터는 항상 접근 가능
    if (dataRecord.createdBy === currentUser.user.uid || 
        dataRecord.assignedTo === currentUser.user.uid) {
        return true;
    }
    
    // 부서별 접근 권한 (추후 구현 예정)
    // if (dataRecord.department === currentUser.profile.department) {
    //     return true;
    // }
    
    // 보안 등급에 따른 접근 권한
    const dataSecurityLevel = dataRecord.securityLevel || '일반';
    return checkUserPermission(currentUser.profile, dataSecurityLevel);
}

/**
 * IP 기반 접근 제한 확인 (추후 서버 사이드 구현 예정)
 * @param {string} userIP - 사용자 IP 주소
 * @returns {boolean} IP 접근 허용 여부
 */
export function checkIPAccess(userIP) {
    // 클라이언트에서는 실제 IP 확인이 어려우므로
    // 서버 사이드에서 구현해야 할 기능
    console.log('ℹ️ IP 접근 확인은 서버에서 처리됩니다');
    return true;
}

/**
 * 시간 기반 접근 제한 확인
 * @param {object} currentUser - 현재 사용자 정보
 * @returns {boolean} 시간대 접근 허용 여부
 */
export function checkTimeAccess(currentUser) {
    if (!currentUser || !currentUser.profile) {
        return true; // 기본적으로 허용
    }
    
    // 관리자는 시간 제한 없음
    if (isAdmin(currentUser)) {
        return true;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // 일반 사용자는 업무 시간 내에만 접근 가능 (9시-18시)
    const businessHourStart = 9;
    const businessHourEnd = 18;
    
    const isBusinessHour = currentHour >= businessHourStart && currentHour < businessHourEnd;
    
    if (!isBusinessHour) {
        console.warn('⚠️ 업무 시간 외 접근 시도:', {
            currentHour: currentHour,
            businessHours: `${businessHourStart}:00 - ${businessHourEnd}:00`
        });
    }
    
    return isBusinessHour;
}

console.log('📄 auth-validators.js 모듈 로드 완료');