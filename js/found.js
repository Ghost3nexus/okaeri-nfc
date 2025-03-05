/**
 * おかえりNFC - 落とし物発見ページのスクリプト
 */

document.addEventListener('DOMContentLoaded', function() {
    // URLからトークンを取得
    const token = getUrlParam('token');
    
    if (token) {
        // トークンがある場合は持ち主情報を取得
        fetchOwnerInfo(token);
    } else {
        // トークンがない場合はエラー表示
        showError();
    }
});

/**
 * 持ち主情報を取得する
 * @param {string} token - サービストークン
 */
async function fetchOwnerInfo(token) {
    const userInfoElement = document.getElementById('userInfo');
    const loadingElement = document.getElementById('loadingInfo');
    const errorElement = document.getElementById('errorInfo');
    
    try {
        const response = await fetchAPI(`/users/found?token=${token}`);
        
        if (response.success && response.data) {
            // 持ち主情報を表示
            displayOwnerInfo(response.data);
            
            // 表示を切り替え
            userInfoElement.classList.remove('d-none');
            loadingElement.classList.add('d-none');
            errorElement.classList.add('d-none');
        } else {
            // エラー表示
            showError();
        }
    } catch (error) {
        console.error('持ち主情報取得エラー:', error);
        showError();
    }
}

/**
 * 持ち主情報を表示する
 * @param {Object} ownerData - 持ち主データ
 */
function displayOwnerInfo(ownerData) {
    // 名前を表示
    const ownerNameElement = document.getElementById('ownerName');
    if (ownerNameElement && ownerData.name) {
        ownerNameElement.textContent = ownerData.name;
    }
    
    // メールアドレスを表示
    const ownerEmailElement = document.getElementById('ownerEmail');
    if (ownerEmailElement && ownerData.email) {
        ownerEmailElement.textContent = ownerData.email;
    }
    
    // メールリンクを設定
    const mailtoLinkElement = document.getElementById('mailtoLink');
    if (mailtoLinkElement && ownerData.email) {
        const subject = encodeURIComponent('【おかえりNFC】落とし物を発見しました');
        const body = encodeURIComponent(
            `${ownerData.name}様\n\nおかえりNFCを通じて、あなたの落とし物を発見しました。\n\n` +
            `発見場所：\n発見日時：\n\n返却方法について相談させてください。\n\n` +
            `よろしくお願いいたします。`
        );
        mailtoLinkElement.href = `mailto:${ownerData.email}?subject=${subject}&body=${body}`;
    }
    
    // 電話リンクを設定（電話番号がある場合のみ）
    const telLinkElement = document.getElementById('telLink');
    if (telLinkElement && ownerData.phone) {
        telLinkElement.href = `tel:${ownerData.phone}`;
        telLinkElement.classList.remove('d-none');
    }
}

/**
 * エラー表示を行う
 */
function showError() {
    const userInfoElement = document.getElementById('userInfo');
    const loadingElement = document.getElementById('loadingInfo');
    const errorElement = document.getElementById('errorInfo');
    
    userInfoElement.classList.add('d-none');
    loadingElement.classList.add('d-none');
    errorElement.classList.remove('d-none');
}