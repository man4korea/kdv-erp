// 📁 js/firebase-config.js
// KDV 시스템 - Firebase 설정 및 초기화

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';

function loadFirebaseConfig() {
    // 운영 환경 - 환경변수 사용
    if (typeof process !== 'undefined' && process.env) {
        return {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID
        };
    }

    // 개발 환경 - 하드코딩 (주의 필요)
    return {
        apiKey: "AIzaSyAfSlSi4pNlKvMU-NBpQ3ZWSeG4QNpZiCk",
        authDomain: "kdv-sys.firebaseapp.com",
        projectId: "kdv-sys",
        storageBucket: "kdv-sys.firebasestorage.app",
        messagingSenderId: "352925761129",
        appId: "1:352925761129:web:a9c9cf2e1154d745faecf8"
    };
}

const firebaseConfig = loadFirebaseConfig();

let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('🔥 Firebase 초기화 성공!');
} catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
    if (typeof alert !== 'undefined') {
        alert('Firebase 연결 실패! 페이지 새로고침을 시도해주세요.');
    }
    throw error;
}

export { app, db, auth };
