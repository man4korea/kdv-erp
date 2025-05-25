// 📁 js/firebase-config.js
// KDV 시스템 - Firebase 설정 및 초기화 (공식 버전 11.8.1 호환)
// Create at 250525_0945 Ver1.03

let app, db, auth;

// Firebase 설정 객체 (공식 설정)
function getFirebaseConfig() {
    return {
        apiKey: "AIzaSyAfSlSi4pNlKvMU-NBpQ3ZWSeG4QNpZiCk",
        authDomain: "kdv-sys.firebaseapp.com",
        projectId: "kdv-sys",
        storageBucket: "kdv-sys.firebasestorage.app",
        messagingSenderId: "352925761129",
        appId: "1:352925761129:web:a9c9cf2e1154d745faecf8"
    };
}

// Firebase 초기화 함수 (CDN 호환 버전)
function initializeFirebase() {
    try {
        // Firebase SDK가 로드되었는지 확인
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK가 로드되지 않았습니다.');
        }

        const config = getFirebaseConfig();
        
        // Firebase 앱 초기화
        app = firebase.initializeApp(config);
        
        // 서비스 초기화
        db = firebase.firestore();
        auth = firebase.auth();
        
        // 전역 객체로 등록 (디버깅 및 호환성용)
        window.firebaseApp = app;
        window.firebaseDb = db;
        window.firebaseAuth = auth;
        
        console.log('🔥 Firebase 초기화 성공!');
        console.log('📱 앱:', app.name);
        console.log('🗄️ Firestore:', !!db);
        console.log('🔐 Auth:', !!auth);
        
        return { app, db, auth };
        
    } catch (error) {
        console.error('❌ Firebase 초기화 실패:', error);
        
        // 사용자에게 오류 알림
        if (typeof showFirebaseError === 'function') {
            showFirebaseError('Firebase 연결에 실패했습니다: ' + error.message);
        }
        
        throw error;
    }
}

// Firebase SDK 로드 대기 및 초기화
function waitForFirebaseAndInitialize() {
    return new Promise((resolve, reject) => {
        if (typeof firebase !== 'undefined') {
            // Firebase SDK가 이미 로드됨
            try {
                const result = initializeFirebase();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        } else {
            // Firebase SDK 로드 대기
            console.log('⏳ Firebase SDK 로드 대기 중...');
            let attempts = 0;
            const maxAttempts = 100; // 10초 대기
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (typeof firebase !== 'undefined') {
                    clearInterval(checkInterval);
                    try {
                        const result = initializeFirebase();
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    const error = new Error('Firebase SDK 로드 시간 초과 (10초)');
                    console.error('❌', error.message);
                    reject(error);
                }
            }, 100);
        }
    });
}

// 즉시 실행 (DOM 로드 확인)
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM 로드 완료 - Firebase 초기화 준비');
            // 초기화는 main script에서 수동으로 호출하도록 함
        });
    } else {
        console.log('📄 DOM 이미 로드됨 - Firebase 초기화 준비 완료');
    }
}

// 브라우저 환경에서 전역 함수로 등록
if (typeof window !== 'undefined') {
    window.initializeFirebase = initializeFirebase;
    window.waitForFirebaseAndInitialize = waitForFirebaseAndInitialize;
    window.getFirebaseConfig = getFirebaseConfig;
    
    console.log('🔧 firebase-config.js 로드 완료 - Ver1.03');
}

// Node.js 환경 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        initializeFirebase, 
        waitForFirebaseAndInitialize,
        getFirebaseConfig 
    };
}
