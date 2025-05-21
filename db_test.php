<?php
/*
📁 db_test.php
KDV 시스템 - 데이터베이스 연결 테스트
Create at 250521_1120 Ver1.1
*/

// 오류 표시 설정
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 로그 파일 경로 설정
$logFile = 'C:/xampp/htdocs/mysite/logs/db_errors.log';

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
    error_log("환경 변수 로드 실패, 기본 설정 사용", 3, $logFile);
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
    <title>DB 연결 테스트</title>
    <link rel="stylesheet" href="css/styles.css">
    <style>
        .test-container {
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
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 10px;
            border: 1px solid var(--border-primary);
            text-align: left;
        }
        th {
            background-color: var(--bg-secondary);
        }
    </style>
</head>
<body>
    <div class="app-container">
        <div class="test-container">
            <h1>데이터베이스 연결 테스트</h1>';

// PDO를 사용한 DB 연결 테스트
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
    echo '<p>연결 정보: ' . $host . '/' . $dbname . '</p>';
    echo '</div>';
    
    // 테이블 목록 조회
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (count($tables) > 0) {
        echo '<h2>데이터베이스 테이블 목록</h2>';
        echo '<ul>';
        foreach ($tables as $table) {
            echo '<li>' . htmlspecialchars($table) . '</li>';
        }
        echo '</ul>';
        
        // 첫 번째 테이블의 구조 표시
        if (!empty($tables)) {
            $firstTable = $tables[0];
            echo '<h2>테이블 구조: ' . htmlspecialchars($firstTable) . '</h2>';
            
            $stmt = $pdo->query("DESCRIBE " . $firstTable);
            $columns = $stmt->fetchAll();
            
            echo '<table>';
            echo '<tr><th>필드</th><th>타입</th><th>NULL</th><th>키</th><th>기본값</th><th>추가</th></tr>';
            
            foreach ($columns as $column) {
                echo '<tr>';
                echo '<td>' . htmlspecialchars($column['Field']) . '</td>';
                echo '<td>' . htmlspecialchars($column['Type']) . '</td>';
                echo '<td>' . htmlspecialchars($column['Null']) . '</td>';
                echo '<td>' . htmlspecialchars($column['Key']) . '</td>';
                echo '<td>' . (isset($column['Default']) ? htmlspecialchars($column['Default']) : 'NULL') . '</td>';
                echo '<td>' . htmlspecialchars($column['Extra']) . '</td>';
                echo '</tr>';
            }
            
            echo '</table>';
            
            // 샘플 데이터 몇 개 표시
            echo '<h2>샘플 데이터: ' . htmlspecialchars($firstTable) . '</h2>';
            
            $stmt = $pdo->query("SELECT * FROM " . $firstTable . " LIMIT 5");
            $rows = $stmt->fetchAll();
            
            if (count($rows) > 0) {
                echo '<table>';
                
                // 테이블 헤더
                echo '<tr>';
                foreach (array_keys($rows[0]) as $key) {
                    echo '<th>' . htmlspecialchars($key) . '</th>';
                }
                echo '</tr>';
                
                // 테이블 데이터
                foreach ($rows as $row) {
                    echo '<tr>';
                    foreach ($row as $value) {
                        echo '<td>' . (is_null($value) ? 'NULL' : htmlspecialchars($value)) . '</td>';
                    }
                    echo '</tr>';
                }
                
                echo '</table>';
            } else {
                echo '<p>테이블에 데이터가 없습니다.</p>';
            }
        }
    } else {
        echo '<p>데이터베이스에 테이블이 없습니다.</p>';
    }
    
} catch (PDOException $e) {
    // 연결 실패 시 오류 메시지
    echo '<div class="result error">';
    echo '<p>❌ 데이터베이스 연결 실패!</p>';
    echo '<p>오류 메시지: ' . htmlspecialchars($e->getMessage()) . '</p>';
    echo '</div>';
    
    // 오류 로그 기록
    error_log("DB 연결 실패: " . $e->getMessage(), 3, $logFile);
}

// HTML 푸터
echo '
        </div>
    </div>
</body>
</html>';
?>