# 🔥 Firebase 문제 해결 가이드

## 현재 상황
- ✅ Firebase 초기화 성공
- ✅ 읽기 권한 정상
- ❌ 쓰기 권한 거부 (400 에러)

## 가능한 원인
1. **Firestore Database 미생성** (가장 가능성 높음)
2. API 키 권한 부족
3. 네트워크/CORS 문제

## 해결 방법

### 1단계: Firestore Database 생성 확인
```
Firebase Console → 프로젝트 kdv-sys → Firestore Database
```
- "데이터베이스 만들기" 버튼이 보이면 → **클릭해서 생성**
- 위치: `asia-northeast3 (서울)` 선택
- 보안 규칙: **테스트 모드로 시작** 선택

### 2단계: 보안 규칙 확인
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3단계: API 키 권한 확인
```
Google Cloud Console → API 및 서비스 → 사용자 인증 정보 
→ API 키 선택 → "Cloud Firestore API" 포함 확인
```

## 테스트 파일
- 📁 `/admin/simple-firebase-test.html` - 간단 진단
- 📁 `/admin/test-firebase-v2.html` - 상세 진단
- 📁 `/admin/db-admin.html` - 메인 관리 페이지

## 다음 단계
1. Firestore Database 생성
2. 테스트 페이지에서 쓰기 테스트 재시도
3. 성공하면 DB 초기화 진행
