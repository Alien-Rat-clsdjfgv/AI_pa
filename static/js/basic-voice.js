/**
 * 極簡版醫療語音輸入系統
 * 專注於穩定性和直接性
 */

document.addEventListener('DOMContentLoaded', function() {
    // 檢查瀏覽器支持
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.log('瀏覽器不支持語音識別');
        return;
    }

    // 語音識別對象
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // 配置
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-TW'; // 繁體中文
    
    // 狀態變量
    let isRecording = false;
    let currentField = null;
    
    // 創建UI元素
    const voiceButton = document.createElement('button');
    voiceButton.id = 'voice-button';
    voiceButton.className = 'btn btn-primary position-fixed';
    voiceButton.style.bottom = '20px';
    voiceButton.style.right = '20px';
    voiceButton.style.zIndex = '9999';
    voiceButton.style.width = '60px';
    voiceButton.style.height = '60px';
    voiceButton.style.borderRadius = '50%';
    voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
    document.body.appendChild(voiceButton);
    
    // 狀態顯示
    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'voice-status';
    statusDisplay.className = 'badge bg-secondary position-fixed d-none';
    statusDisplay.style.bottom = '85px';
    statusDisplay.style.right = '20px';
    statusDisplay.style.padding = '8px 12px';
    statusDisplay.style.zIndex = '9999';
    statusDisplay.textContent = '點擊文本區域後開始語音輸入';
    document.body.appendChild(statusDisplay);
    
    // 欄位選擇器動畫樣式
    const style = document.createElement('style');
    style.textContent = `
        .voice-target {
            box-shadow: 0 0 0 2px #28a745 !important;
            transition: box-shadow 0.3s ease;
        }
        .recording {
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(0.95); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(0.95); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // 設置所有可輸入字段的事件
    const inputFields = document.querySelectorAll('input[type="text"], textarea');
    inputFields.forEach(field => {
        field.addEventListener('click', function() {
            // 移除之前選擇的字段高亮
            document.querySelectorAll('.voice-target').forEach(el => {
                el.classList.remove('voice-target');
            });
            
            // 設置當前字段
            currentField = this;
            this.classList.add('voice-target');
            
            statusDisplay.textContent = `已選擇: ${getFieldLabel(this.id)}`;
            statusDisplay.classList.remove('d-none');
            setTimeout(() => {
                if (!isRecording) {
                    statusDisplay.classList.add('d-none');
                }
            }, 3000);
        });
    });
    
    // 獲取字段標籤文本
    function getFieldLabel(fieldId) {
        const labelElement = document.querySelector(`label[for="${fieldId}"]`);
        return labelElement ? labelElement.textContent : fieldId;
    }
    
    // 按鈕點擊事件
    voiceButton.addEventListener('click', function() {
        if (isRecording) {
            stopRecording();
        } else {
            if (!currentField) {
                statusDisplay.textContent = '請先點擊要輸入的文本區域';
                statusDisplay.classList.remove('d-none', 'bg-danger', 'bg-success');
                statusDisplay.classList.add('bg-warning');
                setTimeout(() => {
                    statusDisplay.classList.add('d-none');
                }, 3000);
                return;
            }
            startRecording();
        }
    });
    
    // 開始錄音
    function startRecording() {
        try {
            recognition.start();
            isRecording = true;
            
            // 更新UI
            voiceButton.classList.add('recording');
            voiceButton.innerHTML = '<i class="fas fa-stop"></i>';
            
            statusDisplay.textContent = `正在聆聽...`;
            statusDisplay.classList.remove('d-none', 'bg-secondary', 'bg-success', 'bg-warning');
            statusDisplay.classList.add('bg-danger');
            
            console.log('語音識別已啟動');
        } catch (e) {
            console.error('啟動語音識別失敗:', e);
            isRecording = false;
            statusDisplay.textContent = '啟動失敗，請重試';
            statusDisplay.classList.remove('bg-secondary', 'bg-success');
            statusDisplay.classList.add('bg-warning');
            setTimeout(() => {
                statusDisplay.classList.add('d-none');
            }, 3000);
        }
    }
    
    // 停止錄音
    function stopRecording() {
        try {
            recognition.stop();
            isRecording = false;
            
            // 更新UI
            voiceButton.classList.remove('recording');
            voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
            
            statusDisplay.textContent = '已停止錄音';
            statusDisplay.classList.remove('bg-danger');
            statusDisplay.classList.add('bg-secondary');
            
            setTimeout(() => {
                statusDisplay.classList.add('d-none');
            }, 2000);
            
            console.log('語音識別已停止');
        } catch (e) {
            console.error('停止語音識別失敗:', e);
        }
    }
    
    // 識別結果處理
    recognition.onresult = function(event) {
        const results = event.results;
        const lastResult = results[results.length - 1];
        const transcript = lastResult[0].transcript.trim();
        
        if (currentField && transcript) {
            if (lastResult.isFinal) {
                // 如果是最終結果，更新字段
                updateFieldWithTranscript(transcript);
                
                // 視覺反饋
                statusDisplay.textContent = `已識別: "${transcript.substring(0, 20)}${transcript.length > 20 ? '...' : ''}"`;
                statusDisplay.classList.remove('bg-danger');
                statusDisplay.classList.add('bg-success');
                
                setTimeout(() => {
                    if (isRecording) {
                        statusDisplay.classList.remove('bg-success');
                        statusDisplay.classList.add('bg-danger');
                        statusDisplay.textContent = '正在聆聽...';
                    }
                }, 2000);
            } else {
                // 如果是中間結果，顯示狀態
                statusDisplay.textContent = `正在識別: "${transcript.substring(0, 20)}${transcript.length > 20 ? '...' : ''}"`;
            }
        }
    };
    
    // 更新字段內容
    function updateFieldWithTranscript(transcript) {
        if (!currentField) return;
        
        // 將識別的文本添加到字段
        if (currentField.value) {
            // 如果已有內容，添加到末尾
            currentField.value += ' ' + transcript;
        } else {
            // 如果沒有內容，直接設置
            currentField.value = transcript;
        }
        
        // 觸發變更事件
        const event = new Event('change', { bubbles: true });
        currentField.dispatchEvent(event);
        
        console.log(`已更新字段 ${currentField.id}: ${transcript}`);
    }
    
    // 錯誤處理
    recognition.onerror = function(event) {
        console.error('語音識別錯誤:', event.error);
        
        if (event.error === 'no-speech') {
            statusDisplay.textContent = '未檢測到語音';
        } else if (event.error === 'audio-capture') {
            statusDisplay.textContent = '無法訪問麥克風';
            stopRecording();
        } else if (event.error === 'not-allowed') {
            statusDisplay.textContent = '麥克風訪問被拒絕';
            stopRecording();
        } else if (event.error === 'network') {
            statusDisplay.textContent = '網絡錯誤';
            // 嘗試重新啟動
            if (isRecording) {
                setTimeout(() => {
                    try {
                        recognition.start();
                    } catch (e) {
                        stopRecording();
                    }
                }, 1000);
            }
        } else if (event.error === 'aborted') {
            // 用戶或系統中斷，不顯示錯誤
            console.log('語音識別被中斷');
        } else {
            statusDisplay.textContent = `錯誤: ${event.error}`;
        }
        
        // 短暫顯示錯誤，然後恢復正常狀態
        statusDisplay.classList.remove('bg-danger', 'bg-success');
        statusDisplay.classList.add('bg-warning');
        
        setTimeout(() => {
            if (isRecording) {
                statusDisplay.classList.remove('bg-warning');
                statusDisplay.classList.add('bg-danger');
                statusDisplay.textContent = '正在聆聽...';
            } else {
                statusDisplay.classList.add('d-none');
            }
        }, 3000);
    };
    
    // 識別結束事件
    recognition.onend = function() {
        console.log('語音識別結束');
        
        // 如果仍在錄音狀態，嘗試重新啟動
        if (isRecording) {
            try {
                recognition.start();
                console.log('語音識別已重新啟動');
            } catch (e) {
                console.error('重新啟動失敗:', e);
                isRecording = false;
                voiceButton.classList.remove('recording');
                voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
                
                statusDisplay.textContent = '識別已停止';
                statusDisplay.classList.remove('bg-danger');
                statusDisplay.classList.add('bg-secondary');
                setTimeout(() => {
                    statusDisplay.classList.add('d-none');
                }, 2000);
            }
        }
    };
    
    console.log('極簡版語音輸入系統已初始化');
});