/**
 * まもタグ - 通知ページのスクリプト
 */

document.addEventListener('DOMContentLoaded', function() {
    // ログイン状態をチェック
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    
    // ユーザー名を表示
    const userDataStr = localStorage.getItem(CONFIG.STORAGE_USER_KEY);
    if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const userNameElement = document.getElementById('userName');
        if (userNameElement && userData.name) {
            userNameElement.textContent = userData.name;
        }
    }
    
    // ログアウトボタンの設定
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // 通知フィルターの設定
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // アクティブクラスを切り替え
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // 通知をフィルタリング
            filterNotifications(this.getAttribute('data-filter'));
        });
    });
    
    // 通知を取得
    fetchNotifications();
});

/**
 * 通知を取得する
 */
async function fetchNotifications() {
    const notificationsLoading = document.getElementById('notificationsLoading');
    const notificationsEmpty = document.getElementById('notificationsEmpty');
    const notificationsList = document.getElementById('notificationsList');
    
    try {
        // 通知APIを呼び出す
        const response = await fetchAPI('/notifications/user');
        console.log('通知取得レスポンス:', response);
        
        // ローディング表示を非表示
        notificationsLoading.classList.add('d-none');
        
        if (response.success && response.data && response.data.notifications) {
            const notifications = response.data.notifications;
            
            if (notifications.length === 0) {
                // 通知がない場合
                notificationsEmpty.classList.remove('d-none');
                notificationsList.classList.add('d-none');
            } else {
                // 通知がある場合
                notificationsEmpty.classList.add('d-none');
                notificationsList.classList.remove('d-none');
                
                // 通知リストを生成
                renderNotifications(notifications);
            }
        } else {
            // エラーの場合
            notificationsEmpty.classList.remove('d-none');
            notificationsList.classList.add('d-none');
            console.error('通知取得エラー:', response);
        }
    } catch (error) {
        // エラーの場合
        notificationsLoading.classList.add('d-none');
        notificationsEmpty.classList.remove('d-none');
        notificationsList.classList.add('d-none');
        console.error('通知取得エラー:', error);
    }
}

/**
 * 通知リストを生成する
 * @param {Array} notifications - 通知データの配列
 */
function renderNotifications(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    notificationsList.innerHTML = '';
    
    notifications.forEach(notification => {
        const notificationElement = createNotificationElement(notification);
        notificationsList.appendChild(notificationElement);
    });
}

/**
 * 通知要素を作成する
 * @param {Object} notification - 通知データ
 * @returns {HTMLElement} 通知要素
 */
function createNotificationElement(notification) {
    const notificationElement = document.createElement('div');
    notificationElement.className = `list-group-item list-group-item-action ${notification.status === '未読' ? 'unread' : 'read'}`;
    notificationElement.setAttribute('data-id', notification._id);
    notificationElement.setAttribute('data-status', notification.status);
    
    // 通知日時をフォーマット
    const notificationDate = new Date(notification.createdAt);
    const formattedDate = notificationDate.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // タグ名を取得
    const tagName = notification.tag ? notification.tag.name : '不明なタグ';
    
    // 通知内容を生成
    notificationElement.innerHTML = `
        <div class="d-flex w-100 justify-content-between align-items-center">
            <h5 class="mb-1">
                ${notification.status === '未読' ? '<span class="badge bg-danger me-2">新着</span>' : ''}
                ${tagName}が見つかりました
            </h5>
            <small class="text-muted">${formattedDate}</small>
        </div>
        <p class="mb-1">発見場所: ${notification.location || '不明'}</p>
        ${notification.details ? `<p class="mb-1">詳細: ${notification.details}</p>` : ''}
        ${notification.message ? `<p class="mb-1">メッセージ: ${notification.message}</p>` : ''}
        <div class="d-flex justify-content-between align-items-center mt-2">
            <small class="text-muted">発見日時: ${new Date(notification.foundDate).toLocaleString('ja-JP')}</small>
            ${notification.status === '未読' ? 
                `<button class="btn btn-sm btn-outline-primary mark-as-read" data-id="${notification._id}">
                    <i class="fas fa-check me-1"></i>既読にする
                </button>` : 
                `<span class="badge bg-secondary">既読</span>`
            }
        </div>
    `;
    
    // 既読ボタンのイベントリスナーを設定
    const markAsReadButton = notificationElement.querySelector('.mark-as-read');
    if (markAsReadButton) {
        markAsReadButton.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const notificationId = this.getAttribute('data-id');
            await markNotificationAsRead(notificationId);
        });
    }
    
    return notificationElement;
}

/**
 * 通知を既読にする
 * @param {string} notificationId - 通知ID
 */
async function markNotificationAsRead(notificationId) {
    try {
        // 通知ステータス更新APIを呼び出す
        const response = await fetchAPI(`/notifications/${notificationId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: '既読' })
        });
        
        if (response.success) {
            // 通知要素を更新
            const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
            if (notificationElement) {
                notificationElement.setAttribute('data-status', '既読');
                notificationElement.classList.remove('unread');
                notificationElement.classList.add('read');
                
                // 既読ボタンを既読バッジに置き換え
                const buttonContainer = notificationElement.querySelector('.mark-as-read').parentNode;
                buttonContainer.innerHTML = '<span class="badge bg-secondary">既読</span>';
                
                // 新着バッジを削除
                const newBadge = notificationElement.querySelector('.badge.bg-danger');
                if (newBadge) {
                    newBadge.remove();
                }
            }
        } else {
            console.error('通知ステータス更新エラー:', response);
        }
    } catch (error) {
        console.error('通知ステータス更新エラー:', error);
    }
}

/**
 * 通知をフィルタリングする
 * @param {string} filter - フィルター（'all', 'unread', 'read'）
 */
function filterNotifications(filter) {
    const notifications = document.querySelectorAll('#notificationsList .list-group-item');
    
    notifications.forEach(notification => {
        const status = notification.getAttribute('data-status');
        
        if (filter === 'all') {
            notification.style.display = '';
        } else if (filter === 'unread' && status === '未読') {
            notification.style.display = '';
        } else if (filter === 'read' && status === '既読') {
            notification.style.display = '';
        } else {
            notification.style.display = 'none';
        }
    });
    
    // フィルタリング後に通知がない場合
    const visibleNotifications = document.querySelectorAll('#notificationsList .list-group-item[style=""]');
    const notificationsEmpty = document.getElementById('notificationsEmpty');
    const notificationsList = document.getElementById('notificationsList');
    
    if (visibleNotifications.length === 0) {
        notificationsEmpty.classList.remove('d-none');
        notificationsList.classList.add('d-none');
    } else {
        notificationsEmpty.classList.add('d-none');
        notificationsList.classList.remove('d-none');
    }
}