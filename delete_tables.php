<?php
/*
📁 delete_tables.php
KDV 시스템 - 기존 테이블 삭제
Create at 250521_1135 Ver1.0
*/

// 오류 표시 설정
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 로그 파일 경로 설정 (가능한 여러 경로 중 쓸 수 있는 경로 선택)
function getLogPath() {
    // 가능한 로그 파일 경로 목록
    $possiblePaths = [
        'C:/xampp/htdocs/mysite/logs/db_errors.log',         // 로컬 환경
        '/hosting/kdvsys/html/logs/db_errors.log',          // dothome 호스팅 경로
        '/home/kdvsys/public_html/logs/db_errors.log',      // 다른 호스팅 경로
        __DIR__ . '/logs/db_errors.log',                    // 현재 디렉토리
        sys_get_temp_dir() . '/db_errors.log'              // 임시 디렉토리
    ];
    
    // 각 경로를 순회하며 쓸 수 있는 디렉토리 확인
    foreach ($possiblePaths as $path) {
        $dir = dirname($path);
        
        // 디렉토리가 존재하면 해당 경로 사용
        if (is_dir($dir) && is_writable($dir)) {
            return $path;
        }
        
        // 디렉토리가 없지만 생성 가능한 경우
        if (!is_dir($dir) && is_writable(dirname($dir))) {
            if (@mkdir($dir, 0755, true)) {
                return $path;
            }
        }
    }
    
    // 모든 경로가 사용 불가능한 경우 표준 오류 로그 사용
    return null;
}

// 로그 파일 경로 가져오기
$logFile = getLogPath();

// 사용자 정의 로그 함수
function writeLog($message) {
    global $logFile;
    
    if ($logFile !== null) {
        // 로그 파일이 존재하면 파일에 기록
        error_log($message . "\n", 3, $logFile);
    } else {
        // 로그 파일이 없으면 PHP 기본 오류 로그에 기록
        error_log($message);
    }
}

// 환경 변수 로드 함수
function loadEnv($path) {
    if (!file_exists($path)) {
        // 파일이 존재하지 않으면 false 반환 (오류 발생 X)
        return false;
    }
    
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // 주석이거나 빈 줄이면 건너뜁니다
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // 환경 변수 정의를 파싱합니다
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        // 환경 변수를 설정합니다
        $_ENV[$name] = $value;
    }
    return true;
}

// 다양한 경로에서 .env 파일 로드 시도
$envLoaded = false;

// 가능한 .env 파일 경로들
$envPaths = [
    __DIR__ . '/.env',                     // 현재 디렉토리
    '/hosting/kdvsys/html/.env',           // dothome 호스팅 경로
    dirname(__DIR__) . '/.env',            // 한 단계 상위 디렉토리
    '/home/kdvsys/public_html/.env'        // 다른 호스팅 환경
];

// 각 경로를 순회하며 .env 파일 오픈 시도
foreach ($envPaths as $envPath) {
    if (loadEnv($envPath)) {
        $envLoaded = true;
        break;
    }
}

// .env 파일을 읽을 수 없을 경우 기본값 사용
if (!$envLoaded) {
    // 기본 DB 정보 사용
    writeLog("환경 변수 로드 실패, 기본 설정 사용");
    $_ENV['DB_HOST'] = 'localhost';
    $_ENV['DB_NAME'] = 'kdvsys';
    $_ENV['DB_USER'] = 'kdvsys';
    $_ENV['DB_PASS'] = 'dmlwjdqn!24';
}

// HTML 헤더
echo '<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>기존 테이블 삭제</title>
    <link rel="stylesheet" href="css/styles.css">
    <style>
        .container {
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: var(--bg-primary);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-md);
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: var(--radius-md);
        }
        .success {
            background-color: var(--bg-success);
            color: var(--success);
        }
        .error {
            background-color: var(--bg-danger);
            color: var(--danger);
        }
        .warning {
            background-color: var(--bg-warning);
            color: var(--warning);
        }
        .log {
            background-color: var(--bg-secondary);
            padding: 15px;
            border-radius: var(--radius-md);
            margin-top: 20px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <div class="container">
            <h1>기존 테이블 삭제</h1>';

// 삭제 로그를 저장할 변수
$log = "";

// PDO를 사용한 DB 연결 및 테이블 삭제
try {
    // DB 연결 정보
    $host = $_ENV['DB_HOST'] ?? 'localhost';
    $dbname = $_ENV['DB_NAME'] ?? 'kdvsys';
    $username = $_ENV['DB_USER'] ?? 'kdvsys';
    $password = $_ENV['DB_PASS'] ?? 'dmlwjdqn!24';
    
    // PDO 객체 생성
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
    // 연결 성공 메시지
    echo '<div class="result success">';
    echo '<p>✅ 데이터베이스 연결 성공!</p>';
    echo '</div>';
    
    // 테이블 목록 조회
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (count($tables) > 0) {
        echo '<div class="result warning">';
        echo '<p>⚠️ 삭제할 테이블 목록:</p>';
        echo '<ul>';
        foreach ($tables as $table) {
            echo '<li>' . htmlspecialchars($table) . '</li>';
        }
        echo '</ul>';
        echo '</div>';
        
        // 외래 키 검사 비활성화
        $log .= "외래 키 검사 비활성화...\n";
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        
        // 각 테이블 삭제
        foreach ($tables as $table) {
            try {
                $log .= "테이블 {$table} 삭제 중...\n";
                $pdo->exec("DROP TABLE `{$table}`");
                $log .= "테이블 {$table} 삭제 완료\n";
            } catch (PDOException $e) {
                $log .= "오류: 테이블 {$table} 삭제 실패: " . $e->getMessage() . "\n";
                writeLog("테이블 {$table} 삭제 실패: " . $e->getMessage());
            }
        }
        
        // 외래 키 검사 다시 활성화
        $log .= "외래 키 검사 다시 활성화...\n";
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        // 테이블 삭제 확인
        $stmt = $pdo->query("SHOW TABLES");
        $remainingTables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($remainingTables) === 0) {
            echo '<div class="result success">';
            echo '<p>✅ 모든 테이블이 성공적으로 삭제되었습니다!</p>';
            echo '</div>';
        } else {
            echo '<div class="result error">';
            echo '<p>❌ 일부 테이블이 삭제되지 않았습니다:</p>';
            echo '<ul>';
            foreach ($remainingTables as $table) {
                echo '<li>' . htmlspecialchars($table) . '</li>';
            }
            echo '</ul>';
            echo '</div>';
        }
    } else {
        echo '<div class="result warning">';
        echo '<p>⚠️ 데이터베이스에 테이블이 없습니다!</p>';
        echo '</div>';
    }
    
    // 로그 표시
    echo '<h2>실행 로그</h2>';
    echo '<div class="log">' . htmlspecialchars($log) . '</div>';
    
} catch (PDOException $e) {
    // 연결 실패 시 오류 메시지
    echo '<div class="result error">';
    echo '<p>❌ 데이터베이스 연결 실패!</p>';
    echo '<p>오류 메시지: ' . htmlspecialchars($e->getMessage()) . '</p>';
    echo '</div>';
    
    // 오류 로그 기록
    writeLog("DB 연결 실패: " . $e->getMessage());
}

// HTML 푸터
echo '
        </div>
    </div>
</body>
</html>';
?>