module.exports = {
  extends: [
    'eslint:recommended'
  ],
  plugins: [
    'security'
  ],
  rules: {
    // 보안 관련 규칙들
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    
    // 일반 보안 규칙들
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-alert': 'warn',
    'no-console': 'off', // 개발 단계에서는 허용
    
    // XSS 방어
    'no-unsafe-innerHTML': 'error',
    'no-unsanitized/method': 'error',
    'no-unsanitized/property': 'error'
  },
  env: {
    browser: true,
    es2021: true,
    node: false
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  globals: {
    console: 'readonly',
    window: 'readonly',
    document: 'readonly',
    navigator: 'readonly',
    alert: 'readonly',
    confirm: 'readonly',
    prompt: 'readonly'
  }
};
