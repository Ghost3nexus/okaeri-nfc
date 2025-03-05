/**
 * おかえりNFC - マイタグJavaScript
 */

// 選択中のタグID
let selectedTagId = null;

// DOMが完全に読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // ユーザー認証チェック
    checkAuthentication();
    
    // タグ一覧の読み込み
    loadUserTags();
    
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
 * イベントリスナーの設定
 */
function setupEventListeners() {
    // 一覧に戻るボタン
    const backToListButton = document.getElementById('backToList');
    if (backToListButton) {
        backToListButton.addEventListener('click', function() {
            showTagsList();
        });
    }
    
    // URLコピーボタン
    const copyUrlButton = document.getElementById('detailCopyUrlButton');
    if (copyUrlButton) {
        copyUrlButton.addEventListener('click', function() {
            const serviceUrlInput = document.getElementById('detailServiceUrl');
            if (serviceUrlInput) {
                // URLをクリップボードにコピー
                serviceUrlInput.select();
                document.execCommand('copy');
                
                // コピー成功メッセージ
                showToast('URLをコピーしました');
            }
        });
    }
    
    // NFC書き込みステータス更新ボタン
    document.addEventListener('click', function(event) {
        if (event.target && event.target.id === 'detailUpdateNfcStatusButton') {
            if (selectedTagId) {
                updateNfcWrittenStatus(selectedTagId);
            }
        }
    });
    
    // タグ削除ボタン
    const deleteTagButton = document.getElementById('deleteTagButton');
    if (deleteTagButton) {
        deleteTagButton.addEventListener('click', function() {
            if (selectedTagId) {
                showDeleteConfirmModal(selectedTagId);
            }
        });
    }
    
    // タグ削除確認ボタン
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', function() {
            if (selectedTagId) {
                deleteTag(selectedTagId);
            }
        });
    }
    
    // NFC設定ボタン
    const setupNfcButton = document.getElementById('setupNfcButton');
    if (setupNfcButton) {
        setupNfcButton.addEventListener('click', function() {
            if (selectedTagId) {
                window.location.href = `nfc-setup.html?tagId=${selectedTagId}`;
            }
        });
    }
}

/**
 * ユーザーのタグ一覧を読み込む
 */
async function loadUserTags() {
    try {
        // ローディング表示
        document.getElementById('tagsLoading').classList.remove('d-none');
        document.getElementById('tagsEmpty').classList.add('d-none');
        document.getElementById('tagsTable').classList.add('d-none');
        
        // タグ一覧を取得
        const tags = await fetchUserTags();
        
        // ローディング非表示
        document.getElementById('tagsLoading').classList.add('d-none');
        
        if (tags.length === 0) {
            // タグがない場合
            document.getElementById('tagsEmpty').classList.remove('d-none');
        } else {
            // タグがある場合
            document.getElementById('tagsTable').classList.remove('d-none');
            
            // タグ一覧を表示
            displayTagsList(tags);
        }
    } catch (error) {
        console.error('タグ一覧読み込みエラー:', error);
        
        // ローディング非表示
        document.getElementById('tagsLoading').classList.add('d-none');
        
        // エラーメッセージを表示
        showToast('タグ一覧の読み込みに失敗しました', 'error');
    }
}

/**
 * ユーザーのタグ一覧を取得
 * @returns {Promise<Array>} タグ一覧
 */
async function fetchUserTags() {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${getApiBaseUrl()}/tags/user`, {
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
 * タグ一覧を表示
 * @param {Array} tags - タグ一覧
 */
function displayTagsList(tags) {
    const tagsTableBody = document.getElementById('tagsTableBody');
    
    if (tagsTableBody) {
        // テーブルをクリア
        tagsTableBody.innerHTML = '';
        
        // タグごとに行を追加
        tags.forEach(tag => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            
            // クリックイベント
            row.addEventListener('click', function() {
                showTagDetails(tag);
            });
            
            // タグ名
            const nameCell = document.createElement('td');
            nameCell.textContent = tag.name || '-';
            row.appendChild(nameCell);
            
            // タグID
            const idCell = document.createElement('td');
            idCell.textContent = tag.tagId || '-';
            row.appendChild(idCell);
            
            // 種類
            const typeCell = document.createElement('td');
            typeCell.textContent = tag.itemType || '-';
            row.appendChild(typeCell);
            
            // ステータス
            const statusCell = document.createElement('td');
            if (tag.isActive) {
                statusCell.innerHTML = '<span class="badge bg-success">アクティブ</span>';
            } else {
                statusCell.innerHTML = '<span class="badge bg-secondary">非アクティブ</span>';
            }
            row.appendChild(statusCell);
            
            // NFC書き込み
            const nfcCell = document.createElement('td');
            if (tag.nfcWritten) {
                nfcCell.innerHTML = '<span class="badge bg-success">書き込み済み</span>';
            } else {
                nfcCell.innerHTML = '<span class="badge bg-warning text-dark">未書き込み</span>';
            }
            row.appendChild(nfcCell);
            
            // 操作
            const actionCell = document.createElement('td');
            actionCell.innerHTML = `
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-primary setup-nfc-btn" data-tag-id="${tag._id}">
                        <i class="fas fa-wifi"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary edit-tag-btn" data-tag-id="${tag._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger delete-tag-btn" data-tag-id="${tag._id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            row.appendChild(actionCell);
            
            // 行をテーブルに追加
            tagsTableBody.appendChild(row);
        });
        
        // NFC設定ボタンのイベント
        document.querySelectorAll('.setup-nfc-btn').forEach(button => {
            button.addEventListener('click', function(event) {
                event.stopPropagation();
                const tagId = this.getAttribute('data-tag-id');
                window.location.href = `nfc-setup.html?tagId=${tagId}`;
            });
        });
        
        // 編集ボタンのイベント
        document.querySelectorAll('.edit-tag-btn').forEach(button => {
            button.addEventListener('click', function(event) {
                event.stopPropagation();
                const tagId = this.getAttribute('data-tag-id');
                // 編集機能は今後実装
                showToast('タグ編集機能は準備中です', 'info');
            });
        });
        
        // 削除ボタンのイベント
        document.querySelectorAll('.delete-tag-btn').forEach(button => {
            button.addEventListener('click', function(event) {
                event.stopPropagation();
                const tagId = this.getAttribute('data-tag-id');
                showDeleteConfirmModal(tagId);
            });
        });
    }
}

/**
 * タグ詳細情報を表示
 * @param {Object} tag - タグ情報
 */
function showTagDetails(tag) {
    // 選択中のタグIDを保存
    selectedTagId = tag._id;
    
    // タグ一覧を非表示
    document.querySelector('.card.shadow-sm.mb-4').classList.add('d-none');
    
    // タグ詳細を表示
    document.getElementById('tagDetails').classList.remove('d-none');
    
    // タグ基本情報を表示
    document.getElementById('detailTagName').textContent = tag.name || '-';
    document.getElementById('detailTagId').textContent = tag.tagId || '-';
    document.getElementById('detailTagType').textContent = tag.itemType || '-';
    document.getElementById('detailTagStatus').textContent = tag.isActive ? 'アクティブ' : '非アクティブ';
    
    // 日付の表示
    const registeredAt = tag.registeredAt ? new Date(tag.registeredAt).toLocaleString('ja-JP') : '-';
    document.getElementById('detailTagRegisteredAt').textContent = registeredAt;
    
    const lastFoundAt = tag.lastFoundAt ? new Date(tag.lastFoundAt).toLocaleString('ja-JP') : '-';
    document.getElementById('detailTagLastFoundAt').textContent = lastFoundAt;
    
    // 削除確認モーダルのタグ名を設定
    document.getElementById('deleteTagName').textContent = tag.name;
    
    // サービスURL情報を取得
    fetchTagServiceUrl(tag._id);
    
    // 通知履歴を取得
    fetchTagNotifications(tag._id);
}

/**
 * タグ一覧を表示
 */
function showTagsList() {
    // 選択中のタグIDをリセット
    selectedTagId = null;
    
    // タグ詳細を非表示
    document.getElementById('tagDetails').classList.add('d-none');
    
    // タグ一覧を表示
    document.querySelector('.card.shadow-sm.mb-4').classList.remove('d-none');
}

/**
 * タグのサービスURL情報を取得
 * @param {string} tagId - タグID
 */
async function fetchTagServiceUrl(tagId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${getApiBaseUrl()}/tags/${tagId}/service-url`, {
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
    const serviceUrlInput = document.getElementById('detailServiceUrl');
    if (serviceUrlInput && urlInfo.serviceUrl) {
        serviceUrlInput.value = urlInfo.serviceUrl;
    }
    
    // QRコードを表示
    const qrCodeImage = document.getElementById('detailQrCodeImage');
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
    const nfcWrittenStatus = document.getElementById('detailNfcWrittenStatus');
    
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
                <button class="btn btn-primary w-100" id="detailUpdateNfcStatusButton">
                    <i class="fas fa-check-circle me-1"></i>書き込み完了をマーク
                </button>
            `;
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
        
        const response = await fetch(`${getApiBaseUrl()}/tags/${tagId}/nfc-status`, {
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
        
        // タグ一覧を再読み込み
        loadUserTags();
    } catch (error) {
        console.error('NFC書き込みステータス更新エラー:', error);
        showToast('NFC書き込みステータスの更新に失敗しました', 'error');
    }
}

/**
 * タグの通知履歴を取得
 * @param {string} tagId - タグID
 */
async function fetchTagNotifications(tagId) {
    try {
        // ローディング表示
        document.getElementById('notificationsLoading').classList.remove('d-none');
        document.getElementById('notificationsEmpty').classList.add('d-none');
        document.getElementById('notificationsList').classList.add('d-none');
        
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${getApiBaseUrl()}/tags/${tagId}/notifications`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('通知履歴の取得に失敗しました');
        }
        
        const data = await response.json();
        
        // ローディング非表示
        document.getElementById('notificationsLoading').classList.add('d-none');
        
        if (data.data.notifications.length === 0) {
            // 通知がない場合
            document.getElementById('notificationsEmpty').classList.remove('d-none');
        } else {
            // 通知がある場合
            document.getElementById('notificationsList').classList.remove('d-none');
            
            // 通知一覧を表示
            displayNotificationsList(data.data.notifications);
        }
    } catch (error) {
        console.error('通知履歴取得エラー:', error);
        
        // ローディング非表示
        document.getElementById('notificationsLoading').classList.add('d-none');
        
        // エラーメッセージを表示
        showToast('通知履歴の取得に失敗しました', 'error');
    }
}

/**
 * 通知一覧を表示
 * @param {Array} notifications - 通知一覧
 */
function displayNotificationsList(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    
    if (notificationsList) {
        // リストをクリア
        notificationsList.innerHTML = '';
        
        // 最新5件のみ表示
        const recentNotifications = notifications.slice(0, 5);
        
        // 通知ごとにリストアイテムを追加
        recentNotifications.forEach(notification => {
            const notificationDate = new Date(notification.createdAt).toLocaleString('ja-JP');
            
            const listItem = document.createElement('div');
            listItem.className = 'list-group-item';
            listItem.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">発見場所: ${notification.location || '不明'}</h6>
                    <small class="text-muted">${notificationDate}</small>
                </div>
                <p class="mb-1">${notification.details || '詳細情報なし'}</p>
                <small class="text-muted">
                    <i class="fas fa-map-marker-alt me-1"></i>${notification.location || '不明'}
                    ${notification.contactEmail ? `<span class="ms-2"><i class="fas fa-envelope me-1"></i>${notification.contactEmail}</span>` : ''}
                    ${notification.contactPhone ? `<span class="ms-2"><i class="fas fa-phone me-1"></i>${notification.contactPhone}</span>` : ''}
                </small>
            `;
            
            notificationsList.appendChild(listItem);
        });
    }
}

/**
 * 削除確認モーダルを表示
 * @param {string} tagId - タグID
 */
function showDeleteConfirmModal(tagId) {
    selectedTagId = tagId;
    
    // タグ名を取得
    const tagName = document.getElementById('detailTagName').textContent;
    document.getElementById('deleteTagName').textContent = tagName;
    
    // モーダルを表示
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

/**
 * タグを削除
 * @param {string} tagId - タグID
 */
async function deleteTag(tagId) {
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${getApiBaseUrl()}/tags/${tagId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('タグの削除に失敗しました');
        }
        
        // モーダルを閉じる
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();
        
        // 成功メッセージ
        showToast('タグを削除しました');
        
        // タグ一覧に戻る
        showTagsList();
        
        // タグ一覧を再読み込み
        loadUserTags();
    } catch (error) {
        console.error('タグ削除エラー:', error);
        showToast('タグの削除に失敗しました', 'error');
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