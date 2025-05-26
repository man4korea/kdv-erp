// Firebase SDK CDN 로드 (공식 버전 11.8.1)
// ... existing code ...

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyAfSlSi4pNlKvMU-NBpQ3ZWSeG4QNpZiCk",
    authDomain: "kdv-sys.firebaseapp.com",
    projectId: "kdv-sys",
    storageBucket: "kdv-sys.firebasestorage.app",
    messagingSenderId: "352925761129",
    appId: "1:352925761129:web:a9c9cf2e1154d745faecf8"
};

// Firebase 초기화
if (typeof firebase !== 'undefined') {
    try {
        const app = firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        // 전역 변수로 등록
        window.firebaseApp = app;
        window.firebaseAuth = auth;
        window.firebaseDb = db;
        
        console.log('🔥 Firebase 즉시 초기화 성공!');
        console.log('Auth:', !!auth);
        console.log('Firestore:', !!db);
    } catch (error) {
        console.error('❌ Firebase 초기화 실패:', error);
    }
} else {
    console.error('❌ Firebase SDK가 로드되지 않았습니다.');
} 