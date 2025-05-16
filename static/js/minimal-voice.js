/**
 * 最簡單的語音輸入系統 - 專注於穩定性和直接性
 * 使用最精簡的代碼，確保在移動設備上可靠運行
 */

document.addEventListener('DOMContentLoaded', function() {
    // 檢查瀏覽器支持
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('瀏覽器不支持語音識別');
        return;
    }
    
    console.log('初始化最簡語音輸入系統...');
    
    // 創建按鈕
    const voiceButton = document.createElement('button');
    voiceButton.id = 'minimal-voice-button';
    voiceButton.className = 'btn btn-lg btn-primary rounded-circle';
    voiceButton.style.position = 'fixed';
    voiceButton.style.bottom = '20px';
    voiceButton.style.right = '20px';
    voiceButton.style.zIndex = '9999';
    voiceButton.style.width = '60px';
    voiceButton.style.height = '60px';
    voiceButton.style.fontSize = '24px';
    voiceButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
    document.body.appendChild(voiceButton);
    
    // 狀態指示器
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'voice-status-indicator';
    statusIndicator.style.position = 'fixed';
    statusIndicator.style.bottom = '90px';
    statusIndicator.style.right = '20px';
    statusIndicator.style.zIndex = '9999';
    statusIndicator.style.padding = '8px 12px';
    statusIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
    statusIndicator.style.color = 'white';
    statusIndicator.style.borderRadius = '4px';
    statusIndicator.style.display = 'none';
    statusIndicator.textContent = '請點擊任意欄位後開始語音輸入';
    document.body.appendChild(statusIndicator);
    
    // 目標欄位高亮樣式
    const style = document.createElement('style');
    style.textContent = `
        .voice-target {
            border: 2px solid #28a745 !important;
            box-shadow: 0 0 8px rgba(40, 167, 69, 0.5) !important;
        }
        @keyframes recording-pulse {
            0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
            100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
        }
        .recording {
            background-color: #dc3545 !important;
            animation: recording-pulse 1.5s infinite;
        }
    `;
    document.head.appendChild(style);
    
    // 語音識別變量
    let recognition = null;
    let isRecording = false;
    let currentField = null;
    
    // 設置所有輸入欄位事件
    document.querySelectorAll('input[type="text"], textarea').forEach(field => {
        field.addEventListener('click', function() {
            // 移除之前的目標高亮
            document.querySelectorAll('.voice-target').forEach(el => {
                el.classList.remove('voice-target');
            });
            
            // 設置新目標
            currentField = this;
            currentField.classList.add('voice-target');
            
            // 顯示狀態
            statusIndicator.textContent = `已選擇: ${getFieldLabel(currentField.id)}`;
            statusIndicator.style.display = 'block';
            
            // 3秒後隱藏
            setTimeout(() => {
                if (!isRecording) {
                    statusIndicator.style.display = 'none';
                }
            }, 3000);
        });
    });
    
    // 獲取欄位標籤
    function getFieldLabel(fieldId) {
        const label = document.querySelector(`label[for="${fieldId}"]`);
        return label ? label.textContent : fieldId;
    }
    
    // 按鈕點擊事件
    voiceButton.addEventListener('click', function() {
        if (isRecording) {
            stopRecording();
        } else {
            if (!currentField) {
                statusIndicator.textContent = '請先點擊要輸入的欄位';
                statusIndicator.style.display = 'block';
                
                // 閃爍提示所有可能的欄位
                document.querySelectorAll('input[type="text"], textarea').forEach(field => {
                    field.classList.add('voice-target');
                    setTimeout(() => {
                        field.classList.remove('voice-target');
                    }, 1000);
                });
                
                setTimeout(() => {
                    statusIndicator.style.display = 'none';
                }, 3000);
                return;
            }
            startRecording();
        }
    });
    
    // 開始錄音
    function startRecording() {
        // 創建新的識別對象
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        // 基本配置
        recognition.continuous = false;  // 簡化為單次識別
        recognition.interimResults = true;
        recognition.lang = 'zh-TW';
        
        // 結果處理
        recognition.onresult = function(event) {
            const result = event.results[0];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
                // 添加到欄位
                if (currentField.value) {
                    currentField.value += ', ' + transcript;
                } else {
                    currentField.value = transcript;
                }
                
                // 顯示結果
                statusIndicator.textContent = `已添加: "${transcript.substring(0, 20)}${transcript.length > 20 ? '...' : ''}"`;
                statusIndicator.style.background = 'rgba(40, 167, 69, 0.7)';
                
                // 日誌
                console.log(`已添加內容: "${transcript}"`);
                
                // 觸發變更事件
                const event = new Event('input', { bubbles: true });
                currentField.dispatchEvent(event);
                
                // 自動繼續下一次錄音
                setTimeout(() => {
                    if (isRecording) {
                        try {
                            statusIndicator.textContent = '繼續聽取中...';
                            statusIndicator.style.background = 'rgba(220, 53, 69, 0.7)';
                            recognition.start();
                        } catch (e) {
                            console.error('重新啟動錄音失敗', e);
                            stopRecording();
                        }
                    }
                }, 1000);
            } else {
                // 臨時結果
                statusIndicator.textContent = `識別中: "${transcript.substring(0, 20)}${transcript.length > 20 ? '...' : ''}"`;
            }
        };
        
        // 錯誤處理
        recognition.onerror = function(event) {
            console.error('語音識別錯誤:', event.error);
            
            // 只有在非用戶中斷的情況下顯示錯誤
            if (event.error !== 'aborted') {
                statusIndicator.textContent = `錯誤: ${event.error}`;
                statusIndicator.style.background = 'rgba(255, 193, 7, 0.7)';
                
                // 嘗試重啟
                setTimeout(() => {
                    if (isRecording) {
                        try {
                            recognition.start();
                            statusIndicator.textContent = '繼續聽取中...';
                            statusIndicator.style.background = 'rgba(220, 53, 69, 0.7)';
                        } catch (e) {
                            console.error('重啟失敗', e);
                            stopRecording();
                        }
                    }
                }, 1000);
            }
        };
        
        // 結束處理
        recognition.onend = function() {
            console.log('單次語音識別結束');
            // 已在onresult中處理重啟
        };
        
        // 開始錄音
        try {
            recognition.start();
            isRecording = true;
            
            // 更新UI
            voiceButton.classList.add('recording');
            voiceButton.innerHTML = '<i class="fas fa-stop"></i>';
            
            // 更新狀態
            statusIndicator.textContent = '開始說話...';
            statusIndicator.style.display = 'block';
            statusIndicator.style.background = 'rgba(220, 53, 69, 0.7)';
            
            console.log('語音識別已啟動');
        } catch (e) {
            console.error('啟動語音識別失敗:', e);
            isRecording = false;
        }
    }
    
    // 停止錄音
    function stopRecording() {
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {
                console.error('停止語音識別失敗:', e);
            }
        }
        
        isRecording = false;
        
        // 更新UI
        voiceButton.classList.remove('recording');
        voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
        
        // 更新狀態
        statusIndicator.textContent = '語音輸入已停止';
        statusIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
        
        // 3秒後隱藏
        setTimeout(() => {
            statusIndicator.style.display = 'none';
        }, 3000);
        
        // 移除目標高亮
        if (currentField) {
            currentField.classList.remove('voice-target');
        }
        
        console.log('語音識別已停止');
    }
    
    console.log('最簡語音輸入系統初始化完成');
});