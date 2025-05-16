/**
 * 移動版醫療語音輸入系統 - 專為手機和平板優化
 * 提供簡單直接的語音輸入體驗
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化移動版語音輸入系統...');
    
    // 檢查瀏覽器支持
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('瀏覽器不支持語音識別');
        return;
    }

    // 語音識別對象
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // 配置
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-TW'; // 預設繁體中文
    
    // 狀態變量
    let isRecording = false;
    let currentField = null;
    
    // 創建UI元素
    const voiceButton = document.createElement('button');
    voiceButton.id = 'mobile-voice-button';
    voiceButton.className = 'btn btn-primary position-fixed';
    voiceButton.style.bottom = '20px';
    voiceButton.style.right = '20px';
    voiceButton.style.zIndex = '9999';
    voiceButton.style.width = '60px';
    voiceButton.style.height = '60px';
    voiceButton.style.borderRadius = '50%';
    voiceButton.style.fontSize = '24px';
    voiceButton.style.padding = '0';
    voiceButton.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
    document.body.appendChild(voiceButton);
    
    // 狀態顯示
    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'mobile-voice-status';
    statusDisplay.className = 'position-fixed d-none';
    statusDisplay.style.bottom = '85px';
    statusDisplay.style.right = '20px';
    statusDisplay.style.padding = '8px 12px';
    statusDisplay.style.zIndex = '9999';
    statusDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
    statusDisplay.style.color = 'white';
    statusDisplay.style.borderRadius = '4px';
    statusDisplay.style.maxWidth = '250px';
    statusDisplay.style.fontSize = '14px';
    statusDisplay.textContent = '點擊輸入欄位後開始語音輸入';
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
        #mobile-voice-button .pulse-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: rgba(40, 167, 69, 0.3);
            z-index: -1;
            pointer-events: none;
            animation: pulse-ring 1.5s ease-out infinite;
            top: 0;
            left: 0;
        }
        @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.7; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        .field-toast {
            position: absolute;
            background-color: rgba(40, 167, 69, 0.85);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            pointer-events: none;
            transition: opacity 0.3s;
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
            
            // 顯示已選擇的欄位
            showFieldToast(this, `已選擇: ${getFieldLabel(this.id)}`);
            
            statusDisplay.textContent = `已選擇: ${getFieldLabel(this.id)}`;
            statusDisplay.className = 'position-fixed';
            setTimeout(() => {
                if (!isRecording) {
                    statusDisplay.className = 'position-fixed d-none';
                }
            }, 2000);
        });
    });
    
    // 顯示欄位提示
    function showFieldToast(element, message) {
        const rect = element.getBoundingClientRect();
        const toast = document.createElement('div');
        toast.className = 'field-toast';
        toast.textContent = message;
        toast.style.top = `${rect.top - 25}px`;
        toast.style.left = `${rect.left}px`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 1500);
    }
    
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
                statusDisplay.textContent = '請先點擊要輸入的文本欄位';
                statusDisplay.className = 'position-fixed';
                statusDisplay.style.backgroundColor = 'rgba(255,193,7,0.8)';
                
                // 閃爍提示用戶選擇欄位
                const inputFields = document.querySelectorAll('input[type="text"], textarea');
                inputFields.forEach(field => {
                    field.classList.add('voice-target');
                    setTimeout(() => {
                        field.classList.remove('voice-target');
                    }, 1000);
                });
                
                setTimeout(() => {
                    statusDisplay.className = 'position-fixed d-none';
                    statusDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
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
            voiceButton.innerHTML = '<div class="pulse-ring"></div><i class="fas fa-stop"></i>';
            voiceButton.style.backgroundColor = '#dc3545';
            
            statusDisplay.textContent = `正在聆聽...`;
            statusDisplay.className = 'position-fixed';
            statusDisplay.style.backgroundColor = 'rgba(220,53,69,0.8)';
            
            // 高亮當前選中的欄位
            if (currentField) {
                currentField.classList.add('voice-target');
            }
            
            console.log('語音識別已啟動');
        } catch (e) {
            console.error('啟動語音識別失敗:', e);
            isRecording = false;
            
            statusDisplay.textContent = '啟動失敗，請重試';
            statusDisplay.style.backgroundColor = 'rgba(255,193,7,0.8)';
            setTimeout(() => {
                statusDisplay.className = 'position-fixed d-none';
                statusDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
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
            voiceButton.style.backgroundColor = '';
            
            statusDisplay.textContent = '已停止錄音';
            statusDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
            
            setTimeout(() => {
                statusDisplay.className = 'position-fixed d-none';
            }, 2000);
            
            // 移除欄位高亮
            if (currentField) {
                currentField.classList.remove('voice-target');
            }
            
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
                console.log(`識別結果: "${transcript}"`);
                
                // 如果是最終結果，更新字段
                updateFieldWithTranscript(transcript);
                
                // 視覺反饋
                const shortTranscript = transcript.length > 20 ? 
                    transcript.substring(0, 20) + '...' : transcript;
                statusDisplay.textContent = `已識別: "${shortTranscript}"`;
                statusDisplay.style.backgroundColor = 'rgba(40,167,69,0.8)';
                
                // 顯示在欄位附近的小提示
                showFieldToast(currentField, shortTranscript);
                
                setTimeout(() => {
                    if (isRecording) {
                        statusDisplay.style.backgroundColor = 'rgba(220,53,69,0.8)';
                        statusDisplay.textContent = '正在聆聽...';
                    }
                }, 2000);
            } else {
                // 如果是中間結果，顯示狀態
                const shortTranscript = transcript.length > 20 ? 
                    transcript.substring(0, 20) + '...' : transcript;
                statusDisplay.textContent = `正在識別: "${shortTranscript}"`;
            }
        }
    };
    
    // 更新字段內容
    function updateFieldWithTranscript(transcript) {
        if (!currentField) return;
        
        // 儲存原始值以便檢測變化
        const originalValue = currentField.value;
        
        // 將識別的文本添加到字段
        if (currentField.value) {
            // 如果已有內容，添加到末尾
            currentField.value += ' ' + transcript;
        } else {
            // 如果沒有內容，直接設置
            currentField.value = transcript;
        }
        
        // 只有當內容確實改變時才觸發事件
        if (originalValue !== currentField.value) {
            // 觸發變更事件，以便其他腳本可以響應
            const changeEvent = new Event('change', { bubbles: true });
            currentField.dispatchEvent(changeEvent);
            
            // 同時觸發input事件，許多現代框架使用這個事件
            const inputEvent = new Event('input', { bubbles: true });
            currentField.dispatchEvent(inputEvent);
            
            console.log(`已更新欄位 ${currentField.id}: ${transcript}`);
        }
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
        statusDisplay.style.backgroundColor = 'rgba(255,193,7,0.8)';
        
        setTimeout(() => {
            if (isRecording) {
                statusDisplay.style.backgroundColor = 'rgba(220,53,69,0.8)';
                statusDisplay.textContent = '正在聆聽...';
            } else {
                statusDisplay.className = 'position-fixed d-none';
                statusDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
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
                voiceButton.style.backgroundColor = '';
                
                statusDisplay.textContent = '識別已停止';
                statusDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
                setTimeout(() => {
                    statusDisplay.className = 'position-fixed d-none';
                }, 2000);
                
                // 移除欄位高亮
                if (currentField) {
                    currentField.classList.remove('voice-target');
                }
            }
        }
    };
    
    // 語言選擇
    const langSelector = document.createElement('div');
    langSelector.className = 'position-fixed';
    langSelector.style.bottom = '20px';
    langSelector.style.right = '90px';
    langSelector.style.zIndex = '9998';
    langSelector.innerHTML = `
        <div class="btn-group dropup">
            <button type="button" class="btn btn-sm btn-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-language"></i>
            </button>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item lang-option" data-lang="zh-TW" href="#">繁體中文</a></li>
                <li><a class="dropdown-item lang-option" data-lang="zh-CN" href="#">简体中文</a></li>
                <li><a class="dropdown-item lang-option" data-lang="en-US" href="#">English</a></li>
                <li><a class="dropdown-item lang-option" data-lang="ja-JP" href="#">日本語</a></li>
            </ul>
        </div>
    `;
    document.body.appendChild(langSelector);
    
    // 語言選擇事件
    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.getAttribute('data-lang');
            recognition.lang = lang;
            
            // 顯示語言變更提示
            let langName = '未知語言';
            switch(lang) {
                case 'zh-TW': langName = '繁體中文'; break;
                case 'zh-CN': langName = '简体中文'; break;
                case 'en-US': langName = 'English'; break;
                case 'ja-JP': langName = '日本語'; break;
            }
            
            statusDisplay.textContent = `語言已變更: ${langName}`;
            statusDisplay.className = 'position-fixed';
            statusDisplay.style.backgroundColor = 'rgba(0,123,255,0.8)';
            setTimeout(() => {
                if (!isRecording) {
                    statusDisplay.className = 'position-fixed d-none';
                    statusDisplay.style.backgroundColor = 'rgba(0,0,0,0.7)';
                }
            }, 2000);
            
            console.log(`語音識別語言已變更為: ${lang}`);
        });
    });
    
    console.log('移動版語音輸入系統已初始化完成');
});