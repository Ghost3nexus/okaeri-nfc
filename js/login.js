/**
 * おかえりNFC - ログインJavaScript
 */

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // すでにログイン済みの場合はダッシュボードにリダイレクト
    checkLoggedInStatus();
    
    // ログインフォームの初期化
    initLoginForm();
    
    // パスワード表示切替ボタンの初期化
    initPasswordToggle();
});

/**
 * ログイン状態をチェック
 */
function checkLoggedInStatus() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user && user._id) {
        // すでにログイン済みの場合はダッシュボードにリダイレクト
        window.location.href = 'dashboard.html';
    }
}

/**
 * ログインフォームの初期化
 */
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');
    const loginErrorMessage = document.getElementById('loginErrorMessage');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // フォームデータの取得
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // ログインボタンをローディング状態に
            loginButton.disabled = true;
            loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>ログイン中...';
            
            // エラーメッセージを非表示
            loginError.classList.add('d-none');
            
            // APIリクエスト
            fetch(`${getApiBaseUrl()}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => {
                if (!response.ok) {
                    // HTTPエラーの場合
                    return response.json().then(data => {
                        throw new Error(data.message || 'ログインに失敗しました');
                    });
                }
                return response.json();
            })
            .then(data => {
                // ログイン成功
                console.log('ログイン成功:', data);
                
                // JWTトークンとユーザー情報を保存
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                // ログイン状態を保持しない場合のセッションストレージ対応（オプション）
                if (!rememberMe) {
                    // セッションストレージにも保存（ブラウザを閉じると消える）
                    sessionStorage.setItem('token', data.token);
                    sessionStorage.setItem('user', JSON.stringify(data.data.user));
                    
                    // ローカルストレージからは削除
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
                
                // ダッシュボードページにリダイレクト
                window.location.href = 'dashboard.html';
            })
            .catch(error => {
                console.error('ログインエラー:', error);
                
                // ログインボタンを元に戻す
                loginButton.disabled = false;
                loginButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>ログイン';
                
                // エラーメッセージを表示
                loginErrorMessage.textContent = error.message || 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
                loginError.classList.remove('d-none');
            });
        });
    }
}

/**
 * パスワード表示切替ボタンの初期化
 */
function initPasswordToggle() {
    const togglePasswordButton = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePasswordButton && passwordInput) {
        togglePasswordButton.addEventListener('click', function() {
            // パスワードの表示/非表示を切り替え
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // アイコンを切り替え
            const icon = togglePasswordButton.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
}

/**
 * デモ用：ログイン情報の自動入力（開発用）
 */
function fillDemoCredentials() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput && passwordInput) {
        emailInput.value = 'demo@example.com';
        passwordInput.value = 'password123';
    }
}