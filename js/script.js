/**
 * おかえりNFC - メインJavaScriptファイル
 */

// APIのベースURL
const API_BASE_URL = '/api';

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // フォーム送信処理の初期化
    initFormSubmission();
    
    // NFCタグ読み取り機能の初期化（対応ブラウザのみ）
    initNfcReader();
    
    // 現在日時をフォームにセット
    setCurrentDateTime();
    
    // アニメーション要素の初期化
    initAnimations();
    
    // ログインフォームの初期化
    initLoginForm();
    
    // 登録フォームの初期化
    initSignupForm();
});

/**
 * フォーム送信処理の初期化
 */
function initFormSubmission() {
    const foundItemForm = document.getElementById('foundItemForm');
    
    // フォームが存在する場合のみ処理
    if (foundItemForm) {
        foundItemForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // フォームデータの取得
            const formData = new FormData(foundItemForm);
            const formDataObj = {};
            
            // FormDataオブジェクトを通常のオブジェクトに変換
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // ローディング表示
            showLoading(true);
            
            // APIエンドポイントに送信
            fetch(`${API_BASE_URL}/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formDataObj)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('通知の送信に失敗しました');
                }
                return response.json();
            })
            .then(data => {
                showLoading(false);
                
                // mailtoリンクがある場合は表示
                if (data.data.mailtoLink) {
                    const mailtoLinkContainer = document.getElementById('mailtoLinkContainer');
                    const mailtoLinkElement = document.getElementById('mailtoLink');
                    
                    if (mailtoLinkContainer && mailtoLinkElement) {
                        mailtoLinkContainer.classList.remove('d-none');
                        mailtoLinkElement.href = data.data.mailtoLink;
                    }
                }
                
                // 成功モーダルを表示
                const successModal = new bootstrap.Modal(document.getElementById('successModal'));
                successModal.show();
                
                // フォームをリセット
                foundItemForm.reset();
                
                // 現在日時を再セット
                setCurrentDateTime();
                
                console.log('送信成功:', data);
            })
            .catch(error => {
                showLoading(false);
                console.error('送信エラー:', error);
                showToast('送信に失敗しました。もう一度お試しください。', 'error');
            });
        });
    }
}

/**
 * ログインフォームの初期化
 */
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // ローディング表示
            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>ログイン中...';
            
            // APIエンドポイントに送信
            fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('ログインに失敗しました');
                }
                return response.json();
            })
            .then(data => {
                // トークンをローカルストレージに保存
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                // ダッシュボードページにリダイレクト
                window.location.href = '/dashboard.html';
            })
            .catch(error => {
                submitButton.disabled = false;
                submitButton.innerHTML = 'ログイン';
                
                console.error('ログインエラー:', error);
                showToast('メールアドレスまたはパスワードが正しくありません', 'error');
            });
        });
    }
}

/**
 * 登録フォームの初期化
 */
function initSignupForm() {
    const signupForm = document.getElementById('signupForm');
    
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // ローディング表示
            const submitButton = signupForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>登録中...';
            
            // APIエンドポイントに送信
            fetch(`${API_BASE_URL}/users/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('登録に失敗しました');
                }
                return response.json();
            })
            .then(data => {
                // トークンをローカルストレージに保存
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                
                // ダッシュボードページにリダイレクト
                window.location.href = '/dashboard.html';
            })
            .catch(error => {
                submitButton.disabled = false;
                submitButton.innerHTML = '登録する';
                
                console.error('登録エラー:', error);
                showToast('登録に失敗しました。もう一度お試しください。', 'error');
            });
        });
    }
}

/**
 * NFCタグ読み取り機能の初期化
 */
function initNfcReader() {
    // URLパラメータを取得
    const urlParams = new URLSearchParams(window.location.search);
    const tagId = urlParams.get('tagId');
    const token = urlParams.get('token');
    
    // URLパラメータにtagIdが存在する場合、フォームの隠しフィールドにセット
    if (tagId && document.getElementById('tagId')) {
        document.getElementById('tagId').value = tagId;
        
        // タグ情報を取得して表示（オプション）
        if (token) {
            fetchTagInfo(tagId, token);
        }
    }
    
    // Web NFC APIが利用可能かチェック（Chrome for Android 89+のみ対応）
    if ('NDEFReader' in window) {
        // NFCスキャンボタンがあれば処理を追加
        const scanButton = document.getElementById('nfcScanButton');
        if (scanButton) {
            scanButton.addEventListener('click', async () => {
                try {
                    const ndef = new NDEFReader();
                    await ndef.scan();
                    
                    // NFCタグが読み取られたときの処理
                    ndef.addEventListener('reading', ({ message, serialNumber }) => {
                        // シリアル番号（タグID）を取得
                        if (serialNumber && document.getElementById('tagId')) {
                            document.getElementById('tagId').value = serialNumber;
                            
                            // 成功メッセージを表示
                            showToast('NFCタグを読み取りました');
                            
                            // タグ情報を取得（オプション）
                            try {
                                // メッセージからURLトークンを抽出
                                const records = message.records;
                                for (const record of records) {
                                    if (record.recordType === "url") {
                                        const decoder = new TextDecoder();
                                        const url = decoder.decode(record.data);
                                        const urlObj = new URL(url);
                                        const urlParams = new URLSearchParams(urlObj.search);
                                        const tokenFromUrl = urlParams.get('token');
                                        
                                        if (tokenFromUrl) {
                                            fetchTagInfo(serialNumber, tokenFromUrl);
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error('URL抽出エラー:', error);
                            }
                        }
                    });
                    
                    showToast('NFCタグをスキャンしてください');
                } catch (error) {
                    console.error('NFCスキャンエラー:', error);
                    showToast('NFCの読み取りに失敗しました', 'error');
                }
            });
            
            // NFCスキャンボタンを表示
            scanButton.style.display = 'block';
        }
    } else {
        // Web NFC APIが利用できない場合、スキャンボタンを非表示
        const scanButton = document.getElementById('nfcScanButton');
        if (scanButton) {
            scanButton.style.display = 'none';
        }
    }
}

/**
 * タグ情報を取得して表示
 * @param {string} tagId - タグID
 * @param {string} token - URLトークン
 */
function fetchTagInfo(tagId, token) {
    fetch(`${API_BASE_URL}/tags/public/${tagId}?token=${token}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('タグ情報の取得に失敗しました');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.data.verified) {
                // タグ情報を表示
                const tagInfoElement = document.getElementById('tagInfo');
                if (tagInfoElement) {
                    tagInfoElement.innerHTML = `
                        <div class="alert alert-info mb-4">
                            <h5 class="alert-heading"><i class="fas fa-tag me-2"></i>${data.data.name}</h5>
                            <p class="mb-0">このアイテムは「${data.data.itemType}」として登録されています。</p>
                            ${data.data.ownerVerified ? '<p class="mb-0 mt-2"><i class="fas fa-check-circle text-success me-1"></i> 持ち主が確認済みです</p>' : ''}
                        </div>
                    `;
                    tagInfoElement.classList.remove('d-none');
                }
            }
        })
        .catch(error => {
            console.error('タグ情報取得エラー:', error);
        });
}

/**
 * 現在の日時をフォームにセット
 */
function setCurrentDateTime() {
    const foundDateInput = document.getElementById('foundDate');
    if (foundDateInput) {
        // 現在の日時を取得
        const now = new Date();
        
        // YYYY-MM-DDThh:mm 形式にフォーマット
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        // 入力フィールドにセット
        foundDateInput.value = formattedDateTime;
    }
}

/**
 * アニメーション要素の初期化
 */
function initAnimations() {
    // アニメーション対象の要素を取得
    const animateElements = document.querySelectorAll('.animate-fade-in');
    
    // Intersection Observerの設定
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 要素が表示領域に入ったらアニメーションクラスを追加
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                // 一度表示されたら監視を解除
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // 10%表示されたらトリガー
    });
    
    // 各要素を監視対象に追加
    animateElements.forEach(element => {
        // 初期状態を設定
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        // 監視を開始
        observer.observe(element);
    });
}

/**
 * ローディング表示の切り替え
 * @param {boolean} show - ローディングを表示するかどうか
 */
function showLoading(show) {
    // 送信ボタンを取得
    const submitButton = document.querySelector('#foundItemForm button[type="submit"]');
    
    if (submitButton) {
        if (show) {
            // ボタンを無効化してローディング表示
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>送信中...';
        } else {
            // ボタンを有効化して元の表示に戻す
            submitButton.disabled = false;
            submitButton.innerHTML = '通知を送信する';
        }
    }
}

/**
 * トースト通知を表示
 * @param {string} message - 表示するメッセージ
 * @param {string} type - 通知タイプ（success, error, warning, info）
 */
function showToast(message, type = 'success') {
    // トースト要素がなければ作成
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // トーストのHTMLを作成
    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'error' ? 'bg-danger' : 
                   type === 'warning' ? 'bg-warning' : 
                   type === 'info' ? 'bg-info' : 'bg-success';
    
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} text-white">
                <strong class="me-auto">おかえりNFC</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // トースト要素を追加
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Bootstrapのトースト機能を初期化して表示
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 3000
    });
    
    toast.show();
    
    // 表示後、一定時間経過後に要素を削除
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

/**
 * URLパラメータを解析
 * @returns {Object} パラメータをキーと値のペアで持つオブジェクト
 */
function getUrlParameters() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return params;
}