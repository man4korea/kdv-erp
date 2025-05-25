/*
📁 js/auth-utils.js
KDV 시스템 - 인증 유틸리티 모듈
Create at 250525_1900 Ver1.00
*/

/**
 * 사용자 정보 표시 유틸리티 함수
 * @param {object} userData - 사용자 데이터
 * @returns {string} 표시용 사용자 정보
 */
export function formatUserInfo(userData) {
    if (!userData || !userData.user) {
        return '게스트';
    }
    
    const email = userData.user.email;
    const profile = userData.profile;
    
    if (profile) {
        const level = profile.securityLevel || '일반';
        const isAdmin = profile.isAdmin ? ' (관리자)' : '';
        return `${email} [${level}${isAdmin}]`;
    }
    
    return email;
}

/**
 * 사용자 이름 추출 (이메일에서)
 * @param {string} email - 이메일 주소
 * @returns {string} 사용자 이름 부분
 */
export function extractUserName(email) {
    if (!email || typeof email !== 'string') {
        return '알 수 없음';
    }
    
    // @ 앞 부분 추출
    const userName = email.split('@')[0];
    return userName || email;
}

/**
 * 마지막 로그인 시간 포맷팅
 * @param {Date|string} lastLoginAt - 마지막 로그인 시간
 * @returns {string} 포맷된 시간 문자열
 */
export function formatLastLoginTime(lastLoginAt) {
    if (!lastLoginAt) {
        return '처음 로그인';
    }
    
    try {
        const loginDate = new Date(lastLoginAt.toDate ? lastLoginAt.toDate() : lastLoginAt);
        const now = new Date();
        const diffMs = now.getTime() - loginDate.getTime();
        
        // 시간 차이 계산
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) {
            return '방금 전';
        } else if (diffMins < 60) {
            return `${diffMins}분 전`;
        } else if (diffHours < 24) {
            return `${diffHours}시간 전`;
        } else if (diffDays < 7) {
            return `${diffDays}일 전`;
        } else {
            // 일주일 이상이면 날짜로 표시
            return loginDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (error) {
        console.error('❌ 로그인 시간 포맷팅 오류:', error);
        return '알 수 없음';
    }
}

/**
 * 보안 등급 아이콘 반환
 * @param {string} securityLevel - 보안 등급
 export function getSecurityLevelIcon(securityLevel) {
     // 허용된 보안 등급 화이트리스트
     const allowedLevels = ['1급', '2급', '일반'];
     if (!allowedLevels.includes(securityLevel)) {
         return '⚪'; // 기본 아이콘
     }
     
     const icons = new Map([
         ['1급', '🔴'],
         ['2급', '🟡'], 
         ['일반', '🟢']
     ]);
     
     return icons.get(securityLevel) || '⚪';
}

/**
 * 보안 등급 색상 반환
 export function getSecurityLevelColor(securityLevel) {
     // 허용된 보안 등급 화이트리스트
     const allowedLevels = ['1급', '2급', '일반'];
     if (!allowedLevels.includes(securityLevel)) {
         return 'text-gray-600'; // 기본 색상
     }
     
     const colors = new Map([
         ['1급', 'text-red-600'],
         ['2급', 'text-yellow-600'],
         ['일반', 'text-green-600']
     ]);
     
     return colors.get(securityLevel) || 'text-gray-600';
}

/**
 * 사용자 아바타 이니셜 생성
 * @param {string} email - 사용자 이메일
 * @returns {string} 아바타용 이니셜 (최대 2글자)
 */
export function generateUserInitials(email) {
    if (!email) return 'U';
    
    const userName = extractUserName(email);
    
    // 영문인 경우
    if (/^[a-zA-Z]/.test(userName)) {
        const parts = userName.split(/[._-]/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return userName.substring(0, 2).toUpperCase();
    }
    
    // 한글인 경우
    if (/^[가-힣]/.test(userName)) {
        return userName.substring(0, 2);
    }
    
    // 기타 (숫자나 특수문자)
    return userName.substring(0, 2).toUpperCase();
}

/**
 * 세션 만료 시간 계산
 * @param {boolean} rememberMe - 로그인 유지 여부
 * @returns {Date} 세션 만료 시간
 */
export function getSessionExpiryTime(rememberMe = false) {
    const now = new Date();
    
    if (rememberMe) {
        // 30일 후 만료
        now.setDate(now.getDate() + 30);
    } else {
        // 8시간 후 만료
        now.setHours(now.getHours() + 8);
    }
    
    return now;
}

/**
 * 비밀번호 강도 검사
 * @param {string} password - 비밀번호
 * @returns {object} 강도 정보 객체
 */
export function checkPasswordStrength(password) {
    if (!password) {
        return {
            score: 0,
            level: 'very-weak',
            message: '비밀번호를 입력해주세요'
        };
    }
    
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /\d/.test(password),
        symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // 각 조건마다 점수 부여
    Object.values(checks).forEach(check => {
        if (check) score += 20;
    });
    
    // 길이 보너스
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    
    let level, message;
    
    if (score < 40) {
        level = 'very-weak';
        message = '매우 약함 - 더 복잡한 비밀번호를 사용하세요';
    } else if (score < 60) {
        level = 'weak';
        message = '약함 - 숫자와 특수문자를 추가하세요';
    } else if (score < 80) {
        level = 'medium';
        message = '보통 - 대문자를 추가하면 더 안전합니다';
    } else if (score < 100) {
        level = 'strong';
        message = '강함 - 좋은 비밀번호입니다';
    } else {
        level = 'very-strong';
        message = '매우 강함 - 훌륭한 비밀번호입니다';
    }
    
    return {
        score,
        level,
        message,
        checks
    };
}

/**
 * 이메일 유효성 검사
 * @param {string} email - 이메일 주소
 * @returns {boolean} 유효성 여부
 */
export function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 사용자 상태 텍스트 반환
 * @param {object} userData - 사용자 데이터
 * @returns {string} 상태 텍스트
 */
export function getUserStatusText(userData) {
    if (!userData) {
        return '오프라인';
    }
    
    if (!userData.isLoggedIn) {
        return '로그아웃';
    }
    
    const profile = userData.profile;
    if (!profile) {
        return '로그인 중...';
    }
    
    // 최근 활동 시간 기준으로 상태 판단
    const lastLogin = profile.lastLoginAt;
    if (!lastLogin) {
        return '처음 로그인';
    }
    
    try {
        const loginTime = new Date(lastLogin.toDate ? lastLogin.toDate() : lastLogin);
        const now = new Date();
        const diffMins = Math.floor((now.getTime() - loginTime.getTime()) / (1000 * 60));
        
        if (diffMins < 5) {
            return '온라인';
        } else if (diffMins < 30) {
            return '최근 활동';
        } else {
            return '비활성';
        }
    } catch (error) {
        return '활동 상태 불명';
    }
}

/**
 * 로그인 기록 포맷팅
 * @param {Array} loginHistory - 로그인 기록 배열
 * @returns {Array} 포맷된 로그인 기록
 */
export function formatLoginHistory(loginHistory) {
    if (!Array.isArray(loginHistory)) {
        return [];
    }
    
    return loginHistory.map(record => ({
        ...record,
        formattedTime: formatLastLoginTime(record.timestamp),
        deviceInfo: getUserAgent(record.userAgent),
        statusIcon: record.success ? '✅' : '❌'
    }));
}

/**
 * User Agent 파싱하여 기기 정보 추출
 * @param {string} userAgent - User Agent 문자열
 * @returns {string} 기기 정보
 */
export function getUserAgent(userAgent) {
    if (!userAgent) return '알 수 없는 기기';
    
    // 간단한 기기/브라우저 판별
    if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
        return '📱 모바일';
    } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
        return '📱 태블릿';
    } else if (userAgent.includes('Chrome')) {
        return '💻 Chrome';
    } else if (userAgent.includes('Firefox')) {
        return '💻 Firefox';
    } else if (userAgent.includes('Safari')) {
        return '💻 Safari';
    } else if (userAgent.includes('Edge')) {
        return '💻 Edge';
    } else {
        return '💻 데스크톱';
    }
}

console.log('📄 auth-utils.js 모듈 로드 완료');