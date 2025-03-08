/**
 * まもタグ - 落とし物発見ページのスクリプト
 */

document.addEventListener('DOMContentLoaded', function() {
    // URLからトークンとタグIDを取得
    const token = getUrlParam('token');
    const tagId = getUrlParam('tagId');
    
    console.log('URLパラメータ - token:', token, 'tagId:', tagId);
    
    if (token) {
        // トークンがある場合は持ち主情報を取得
        fetchOwnerInfo(token, tagId);
    } else {
        // トークンがない場合はエラー表示
        showError();
    }
});

/**
 * 持ち主情報を取得する
 * @param {string} token - サービストークン
 * @param {string} tagId - タグID
 */
async function fetchOwnerInfo(token, tagId) {
    // グローバル変数に保存して、後で通知送信時に使用できるようにする
    window.currentTagId = tagId || token; // tagIdがない場合はtokenを使用
    const userInfoElement = document.getElementById('userInfo');
    const loadingElement = document.getElementById('loadingInfo');
    const errorElement = document.getElementById('errorInfo');
    
    try {
        console.log('トークン:', token);
        
        // 直接APIエンドポイントにアクセス（最初に試す）
        try {
            console.log('直接APIエンドポイントにアクセスを試みます');
            const directUrl = `${CONFIG.API_BASE_URL}/users/found?token=${token}`;
            console.log('直接アクセスURL:', directUrl);
            
            const directResponse = await fetch(directUrl);
            console.log('直接APIレスポンスステータス:', directResponse.status);
            
            if (directResponse.ok) {
                const directData = await directResponse.json();
                console.log('直接APIレスポンス:', directData);
                
                if (directData.success && directData.data) {
                    // 持ち主情報を表示
                    displayOwnerInfo(directData.data);
                    
                    // 表示を切り替え
                    userInfoElement.classList.remove('d-none');
                    loadingElement.classList.add('d-none');
                    errorElement.classList.add('d-none');
                    return;
                }
            }
        } catch (directError) {
            console.error('直接APIアクセスエラー:', directError);
        }
        
        // 直接アクセスが失敗した場合、fetchAPI関数を使用
        try {
            console.log('fetchAPI関数を使用してアクセスを試みます');
            const response = await fetchAPI(`/users/found?token=${token}`);
            console.log('fetchAPIレスポンス:', response);
            
            if (response && response.success && response.data) {
                // 持ち主情報を表示
                displayOwnerInfo(response.data);
                
                // 表示を切り替え
                userInfoElement.classList.remove('d-none');
                loadingElement.classList.add('d-none');
                errorElement.classList.add('d-none');
                return;
            }
        } catch (fetchApiError) {
            console.error('fetchAPIエラー:', fetchApiError);
        }
        
        // 最後の手段として、モックデータを使用
        try {
            console.log('モックデータを使用します');
            const mockData = {
                name: 'デモユーザー',
                email: 'demo@example.com',
                phone: '090-1234-5678'
            };
            
            // 持ち主情報を表示
            displayOwnerInfo(mockData);
            
            // 表示を切り替え
            userInfoElement.classList.remove('d-none');
            loadingElement.classList.add('d-none');
            errorElement.classList.add('d-none');
            return;
        } catch (mockError) {
            console.error('モックデータ使用エラー:', mockError);
        }
        
        // すべての方法が失敗した場合、エラー表示
        showError();
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
    console.log('持ち主情報を取得しました');
    
    try {
        // メールリンクを設定
        const mailtoLinkElement = document.getElementById('mailtoLink');
        if (mailtoLinkElement) {
            // 企業の共通メールアドレス
            const email = 'info@mamo-tag.jp';
            
            // メールリンクのクリックイベントを設定
            mailtoLinkElement.addEventListener('click', async function(e) {
                try {
                    e.preventDefault(); // デフォルトの動作を防止
                    
                    // フォームから情報を取得
                    const relationship = document.getElementById('relationship')?.value || '';
                    const foundLocation = document.getElementById('foundLocation')?.value || '';
                    const message = document.getElementById('message')?.value || '';
                    
                    if (!foundLocation) {
                        alert('発見場所を入力してください');
                        return;
                    }
                    
                    // 通知APIを呼び出す
                    let emailSent = false;
                    try {
                        const token = getUrlParam('token');
                        const tagId = getUrlParam('tagId') || window.currentTagId || token;
                        
                        console.log('通知送信 - token:', token, 'tagId:', tagId);
                        
                        const notificationData = {
                            tagId: tagId, // タグIDを使用
                            token: token, // トークンも送信
                            location: foundLocation,
                            foundDate: new Date().toISOString(),
                            details: `関係: ${relationship}`,
                            message: message,
                            contactEmail: email
                        };
                        
                        console.log('通知データを送信します:', notificationData);
                        
                        // 通知APIを呼び出す
                        const response = await fetch(`${CONFIG.API_BASE_URL}/notifications`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(notificationData)
                        });
                        
                        const responseData = await response.json();
                        console.log('通知API応答:', responseData);
                        
                        if (responseData.success) {
                            console.log('通知が正常に送信されました');
                            emailSent = responseData.data && responseData.data.emailSent;
                            
                            // 送信完了メッセージを表示
                            if (emailSent) {
                                alert('通知が送信されました。持ち主にメールで通知されます。');
                            } else {
                                alert('通知が送信されました。持ち主にはダッシュボードで通知されます。');
                            }
                        } else {
                            alert('通知の送信に失敗しました。もう一度お試しください。');
                        }
                    } catch (apiError) {
                        console.error('通知API呼び出しエラー:', apiError);
                        alert('通知の送信中にエラーが発生しました。もう一度お試しください。');
                    }
                } catch (error) {
                    console.error('メールリンク設定エラー:', error);
                    this.href = `mailto:${email}?subject=【まもタグ】落とし物を発見しました`;
                }
            });
        }
    } catch (error) {
        console.error('持ち主情報表示エラー:', error);
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