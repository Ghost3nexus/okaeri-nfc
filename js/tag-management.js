/**
 * おかえりNFC - タグ管理JavaScript
 */

// APIのベースURL
const API_BASE_URL = '/api';

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // ユーザー認証チェック
    checkAuthentication();
    
    // タグ選択の初期化
    initTagSelect();
    
    // イベントリスナーの設定
    setupEventListeners();
});

/**
 * ユーザー認証チェック
 */
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user) {
        // 認証情報がない場合はログインページにリダイレクト
        window.location.href = 'login.html';
        return;
    }
    
    // ユーザー名を表示
    const userNameElement = document.getElementById('userName');
    if (userNameElement && user.name) {
        userNameElement.textContent = user.name;
    }
    
    // ログアウトボタンの処理
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            
            // ローカルストレージから認証情報を削除
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // ログインページにリダイレクト
            window.location.href = 'login.html';
        });
    }
}

/**
 * タグ選択の初期化
 */
function initTagSelect() {
    const tagSelect = document.getElementById('tagSelect');
    
    if (tagSelect) {
        // ユーザーのタグ一覧を取得
        fetchUserTags()
            .then(tags => {
                // タグがない場合
                if (tags.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'タグが登録されていません';
                    tagSelect.appendChild(option);
                    tagSelect.disabled = true;
                    return;
                }
                
                // タグ選択肢を追加
                tags.forEach(tag => {
                    const option = document.createElement('option');
                    option.value = tag._id;
                    option.textContent = `${tag.name} (${tag.tagId})`;
                    tagSelect.appendChild(option);
                });
                
                // タグ選択時の処理
                tagSelect.addEventListener('change', function() {
                    const selectedTagId = this.value;
                    
                    if (selectedTagId) {
                        // 選択されたタグの詳細情報を取得
                        const selectedTag = tags.find(tag => tag._id === selectedTagId);
                        
                        if (selectedTag) {
                            // タグ詳細情報を表示
                            displayTagDetails(selectedTag);
                            
                            // サービスURL情報を取得
                            fetchTagServiceUrl(selectedTagId);
                        }
                    } else {
                        // タグが選択されていない場合は詳細情報を非表示
                        document.getElementById('tagDetails').classList.add('d-none');
                    }
                });
            })
            .catch(error => {
                console.error('タグ一覧取得エラー:', error);
                
                // エラーメッセージを表示
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'タグの読み込みに失敗しました';
                tagSelect.appendChild(option);
                tagSelect.disabled = true;
            });
    }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // URLコピーボタン
    const copyUrlButton = document.getElementById('copyUrlButton');
    if (copyUrlButton) {
        copyUrlButton.addEventListener('click', function() {
            const serviceUrlInput = document.getElementById('serviceUrl');
            if (serviceUrlInput) {
                // URLをクリップボードにコピー
                serviceUrlInput.select();
                document.execCommand('copy');
                
                // コピー成功メッセージ
                showToast('URLをコピーしました');
            }
        });
    }
    
    // URL再生成ボタン
    const regenerateUrlButton = document.getElementById('regenerateUrlButton');
    if (regenerateUrlButton) {
        regenerateUrlButton.addEventListener('click', function() {
            const tagSelect = document.getElementById('tagSelect');
            const selectedTagId = tagSelect.value;
            
            if (selectedTagId) {
                // 確認ダイアログ
                if (confirm('URLトークンを再生成すると、既存のQRコードやNFCタグは使用できなくなります。\n本当に再生成しますか？')) {
                    regenerateTagToken(selectedTagId);
                }
            }
        });
    }
    
    // NFC書き込みステータス更新ボタン
    const updateNfcStatusButton = document.getElementById('updateNfcStatusButton');
    if (updateNfcStatusButton) {
        updateNfcStatusButton.addEventListener('click', function() {
            const tagSelect = document.getElementById('tagSelect');
            const selectedTagId = tagSelect.value;
            
            if (selectedTagId) {
                updateNfcWrittenStatus(selectedTagId);
            }
        });
    }
}

/**
 * ユーザーのタグ一覧を取得
 * @returns {Promise<Array>} タグ一覧
 */
async function fetchUserTags() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/tags/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('タグ一覧の取得に失敗しました');
        }
        
        const data = await response.json();
        return data.data.tags;
    } catch (error) {
        console.error('タグ一覧取得エラー:', error);
        throw error;
    }
}

/**
 * タグ詳細情報を表示
 * @param {Object} tag - タグ情報
 */
function displayTagDetails(tag) {
    // タグ詳細エリアを表示
    const tagDetailsElement = document.getElementById('tagDetails');
    if (tagDetailsElement) {
        tagDetailsElement.classList.remove('d-none');
    }
    
    // タグ基本情報を表示
    document.getElementById('tagName').textContent = tag.name || '-';
    document.getElementById('tagId').textContent = tag.tagId || '-';
    document.getElementById('tagType').textContent = tag.itemType || '-';
    document.getElementById('tagStatus').textContent = tag.isActive ? 'アクティブ' : '非アクティブ';
    
    // 日付の表示
    const registeredAt = tag.registeredAt ? new Date(tag.registeredAt).toLocaleString('ja-JP') : '-';
    document.getElementById('tagRegisteredAt').textContent = registeredAt;
    
    const lastFoundAt = tag.lastFoundAt ? new Date(tag.lastFoundAt).toLocaleString('ja-JP') : '-';
    document.getElementById('tagLastFoundAt').textContent = lastFoundAt;
}

/**
 * タグのサービスURL情報を取得
 * @param {string} tagId - タグID
 */
async function fetchTagServiceUrl(tagId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/tags/${tagId}/service-url`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('サービスURL情報の取得に失敗しました');
        }
        
        const data = await response.json();
        
        // サービスURL情報を表示
        displayServiceUrlInfo(data.data);
    } catch (error) {
        console.error('サービスURL取得エラー:', error);
        showToast('サービスURL情報の取得に失敗しました', 'error');
    }
}

/**
 * サービスURL情報を表示
 * @param {Object} urlInfo - URL情報
 */
function displayServiceUrlInfo(urlInfo) {
    // サービスURLを表示
    const serviceUrlInput = document.getElementById('serviceUrl');
    if (serviceUrlInput && urlInfo.serviceUrl) {
        serviceUrlInput.value = urlInfo.serviceUrl;
    }
    
    // QRコードを表示
    const qrCodeImage = document.getElementById('qrCodeImage');
    if (qrCodeImage && urlInfo.qrCodeUrl) {
        qrCodeImage.src = urlInfo.qrCodeUrl;
        qrCodeImage.alt = `${urlInfo.tagId}のQRコード`;
    }
    
    // NFC書き込みステータスを表示
    updateNfcStatusDisplay(urlInfo.nfcWritten, urlInfo.nfcWrittenAt);
}

/**
 * NFC書き込みステータス表示を更新
 * @param {boolean} isWritten - 書き込み済みかどうか
 * @param {string} writtenAt - 書き込み日時
 */
function updateNfcStatusDisplay(isWritten, writtenAt) {
    const nfcWrittenStatus = document.getElementById('nfcWrittenStatus');
    
    if (nfcWrittenStatus) {
        if (isWritten) {
            // 書き込み済みの場合
            const writtenDate = writtenAt ? new Date(writtenAt).toLocaleString('ja-JP') : '不明';
            
            nfcWrittenStatus.innerHTML = `
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-circle text-success me-2"></i>
                    <span>書き込み済み（${writtenDate}）</span>
                </div>
                <button class="btn btn-outline-secondary w-100" disabled>
                    <i class="fas fa-check-circle me-1"></i>書き込み完了済み
                </button>
            `;
        } else {
            // 未書き込みの場合
            nfcWrittenStatus.innerHTML = `
                <div class="d-flex align-items-center mb-2">
                    <i class="fas fa-circle text-warning me-2"></i>
                    <span>未書き込み</span>
                </div>
                <button class="btn btn-primary w-100" id="updateNfcStatusButton">
                    <i class="fas fa-check-circle me-1"></i>書き込み完了をマーク
                </button>
            `;
            
            // イベントリスナーを再設定
            const updateNfcStatusButton = document.getElementById('updateNfcStatusButton');
            if (updateNfcStatusButton) {
                updateNfcStatusButton.addEventListener('click', function() {
                    const tagSelect = document.getElementById('tagSelect');
                    const selectedTagId = tagSelect.value;
                    
                    if (selectedTagId) {
                        updateNfcWrittenStatus(selectedTagId);
                    }
                });
            }
        }
    }
}

/**
 * NFC書き込みステータスを更新
 * @param {string} tagId - タグID
 */
async function updateNfcWrittenStatus(tagId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/tags/${tagId}/nfc-status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('NFC書き込みステータスの更新に失敗しました');
        }
        
        const data = await response.json();
        
        // NFC書き込みステータス表示を更新
        updateNfcStatusDisplay(data.data.tag.nfcWritten, data.data.tag.nfcWrittenAt);
        
        // 成功メッセージ
        showToast('NFC書き込みステータスを更新しました');
    } catch (error) {
        console.error('NFC書き込みステータス更新エラー:', error);
        showToast('NFC書き込みステータスの更新に失敗しました', 'error');
    }
}

/**
 * URLトークンを再生成
 * @param {string} tagId - タグID
 */
async function regenerateTagToken(tagId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/tags/${tagId}/regenerate-token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('URLトークンの再生成に失敗しました');
        }
        
        const data = await response.json();
        
        // サービスURLを更新
        const serviceUrlInput = document.getElementById('serviceUrl');
        if (serviceUrlInput && data.data.tag.serviceUrl) {
            serviceUrlInput.value = data.data.tag.serviceUrl;
        }
        
        // QRコードをリセット（再取得が必要）
        const qrCodeImage = document.getElementById('qrCodeImage');
        if (qrCodeImage) {
            qrCodeImage.src = '';
            qrCodeImage.alt = 'QRコードを生成中...';
        }
        
        // サービスURL情報を再取得
        fetchTagServiceUrl(tagId);
        
        // 成功メッセージ
        showToast('URLトークンを再生成しました');
    } catch (error) {
        console.error('URLトークン再生成エラー:', error);
        showToast('URLトークンの再生成に失敗しました', 'error');
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