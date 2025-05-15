/**
 * 醫療語音輸入系統 - 新版本
 * 
 * 功能特點:
 * 1. 更穩定的語音連續監聽
 * 2. 更清晰的狀態管理
 * 3. 智能文本分類與填充
 * 4. 清晰的視覺反饋
 */

document.addEventListener('DOMContentLoaded', function() {
    // 確保瀏覽器支持語音識別
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error('您的瀏覽器不支持語音識別功能');
        return;
    }

    // ===== 系統狀態變量 =====
    let voiceSystem = {
        recognition: null,        // 語音識別實例
        isRecording: false,       // 錄音狀態
        isAutoMode: true,         // 自動分類模式 vs 目標模式
        isFullyStopped: true,     // 是否完全停止（防止重啟）
        autoRestartTimer: null,   // 自動重啟計時器
        recordingTimer: null,     // 錄音計時器
        recordingStartTime: null, // 錄音開始時間
        currentTarget: null,      // 當前輸入目標（僅目標模式）
        lastState: null,          // 最後一次狀態（用於恢復）
        currentLanguage: 'zh-TW'  // 默認語言
    };

    // ===== 核心UI元素 =====
    let ui = {
        voiceButton: null,         // 語音按鈕
        voiceStatus: null,         // 語音狀態指示器
        languageSelect: null,      // 語言選擇器
        languageContainer: null,   // 語言選擇容器
        autoModeSwitch: null,      // 自動/目標模式切換
        autoModeBadge: null,       // 模式顯示標籤
        timerElement: null,        // 計時器元素
        pulseIndicator: null,      // 脈衝指示器
        overlayElement: null       // 目標選擇覆蓋層
    };

    // ===== 初始化函數 =====
    function initialize() {
        createUIElements();
        setupListeners();
        
        // 初始化語音識別
        createRecognitionInstance();
        
        console.log('語音系統初始化完成');
    }
    
    // 創建語音識別實例
    function createRecognitionInstance() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        voiceSystem.recognition = new SpeechRecognition();
        voiceSystem.recognition.continuous = true;
        voiceSystem.recognition.interimResults = true;
        voiceSystem.recognition.maxAlternatives = 5;
        voiceSystem.recognition.lang = voiceSystem.currentLanguage;
        
        // 設置事件處理
        voiceSystem.recognition.onresult = handleResult;
        voiceSystem.recognition.onerror = handleError;
        voiceSystem.recognition.onend = handleEnd;
    }

    // ===== UI創建函數 =====
    function createUIElements() {
        // 尋找或創建語音按鈕
        ui.voiceButton = document.getElementById('voice-input-button');
        if (!ui.voiceButton) {
            ui.voiceButton = document.createElement('button');
            ui.voiceButton.id = 'voice-input-button';
            ui.voiceButton.className = 'btn btn-primary position-fixed';
            ui.voiceButton.style.bottom = '20px';
            ui.voiceButton.style.right = '20px';
            ui.voiceButton.style.borderRadius = '50%';
            ui.voiceButton.style.width = '60px';
            ui.voiceButton.style.height = '60px';
            ui.voiceButton.style.zIndex = '1000';
            ui.voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
            ui.voiceButton.title = '開始語音輸入';
            document.body.appendChild(ui.voiceButton);
        }

        // 語音狀態顯示器
        ui.voiceStatus = document.getElementById('voice-status');
        if (!ui.voiceStatus) {
            ui.voiceStatus = document.createElement('div');
            ui.voiceStatus.id = 'voice-status';
            ui.voiceStatus.className = 'badge bg-dark d-none position-fixed';
            ui.voiceStatus.style.bottom = '85px';
            ui.voiceStatus.style.right = '20px';
            ui.voiceStatus.style.zIndex = '1000';
            ui.voiceStatus.textContent = '已停止';
            document.body.appendChild(ui.voiceStatus);
        }

        // 語言選擇器
        ui.languageContainer = document.getElementById('voice-language-container');
        if (!ui.languageContainer) {
            ui.languageContainer = document.createElement('div');
            ui.languageContainer.id = 'voice-language-container';
            ui.languageContainer.className = 'd-none position-fixed';
            ui.languageContainer.style.bottom = '110px';
            ui.languageContainer.style.right = '20px';
            ui.languageContainer.style.zIndex = '1000';
            document.body.appendChild(ui.languageContainer);
            
            ui.languageSelect = document.createElement('select');
            ui.languageSelect.id = 'voice-language-select';
            ui.languageSelect.className = 'form-select form-select-sm';
            ui.languageSelect.style.width = '110px';
            
            // 添加常用語言選項
            const languages = [
                { code: 'zh-TW', name: '中文 (台灣)' },
                { code: 'zh-CN', name: '中文 (簡體)' },
                { code: 'en-US', name: 'English (US)' },
                { code: 'ja-JP', name: '日本語' }
            ];
            
            languages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.code;
                option.textContent = lang.name;
                ui.languageSelect.appendChild(option);
            });
            
            ui.languageContainer.appendChild(ui.languageSelect);
        }
        
        // 模式切換開關
        ui.autoModeSwitch = document.getElementById('voice-mode-switch');
        if (!ui.autoModeSwitch) {
            const switchContainer = document.createElement('div');
            switchContainer.id = 'voice-mode-container';
            switchContainer.className = 'd-none position-fixed';
            switchContainer.style.bottom = '140px';
            switchContainer.style.right = '20px';
            switchContainer.style.zIndex = '1000';
            
            ui.autoModeSwitch = document.createElement('div');
            ui.autoModeSwitch.id = 'voice-mode-switch';
            ui.autoModeSwitch.className = 'form-check form-switch';
            
            const switchInput = document.createElement('input');
            switchInput.className = 'form-check-input';
            switchInput.type = 'checkbox';
            switchInput.id = 'voice-mode-checkbox';
            switchInput.checked = voiceSystem.isAutoMode;
            
            const switchLabel = document.createElement('label');
            switchLabel.className = 'form-check-label';
            switchLabel.htmlFor = 'voice-mode-checkbox';
            switchLabel.textContent = '自動分類模式';
            
            ui.autoModeSwitch.appendChild(switchInput);
            ui.autoModeSwitch.appendChild(switchLabel);
            
            switchContainer.appendChild(ui.autoModeSwitch);
            document.body.appendChild(switchContainer);
            
            // 模式指示標籤
            ui.autoModeBadge = document.createElement('span');
            ui.autoModeBadge.id = 'voice-mode-badge';
            ui.autoModeBadge.className = 'badge bg-info d-none position-fixed';
            ui.autoModeBadge.style.bottom = '170px';
            ui.autoModeBadge.style.right = '20px';
            ui.autoModeBadge.style.zIndex = '1000';
            document.body.appendChild(ui.autoModeBadge);
        }
        
        // 添加脈衝動畫CSS
        if (!document.getElementById('voice-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'voice-pulse-style';
            style.innerHTML = `
                @keyframes voice-pulse {
                    0% { transform: scale(0.8); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                    100% { transform: scale(0.8); opacity: 1; }
                }
                .voice-input-active {
                    transition: all 0.3s ease;
                }
                .flash-effect {
                    animation: flash 0.5s;
                }
                @keyframes flash {
                    0% { background-color: rgba(255, 193, 7, 0.2); }
                    100% { background-color: transparent; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ===== 事件監聽設置 =====
    function setupListeners() {
        // 語音按鈕點擊
        ui.voiceButton.addEventListener('click', function() {
            if (voiceSystem.isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });
        
        // 語言選擇更改
        if (ui.languageSelect) {
            ui.languageSelect.addEventListener('change', function() {
                voiceSystem.currentLanguage = this.value;
                // 如果正在錄音，重新啟動語音識別以應用新語言
                if (voiceSystem.isRecording) {
                    try {
                        voiceSystem.recognition.stop();
                        voiceSystem.recognition.lang = voiceSystem.currentLanguage;
                        voiceSystem.recognition.start();
                    } catch (e) {
                        console.error('語言切換時重啟失敗:', e);
                    }
                }
            });
        }
        
        // 模式切換
        const modeCheckbox = document.getElementById('voice-mode-checkbox');
        if (modeCheckbox) {
            modeCheckbox.addEventListener('change', function() {
                voiceSystem.isAutoMode = this.checked;
                updateModeUI();
                
                // 如果切換到目標模式且正在錄音，顯示目標選擇
                if (!voiceSystem.isAutoMode && voiceSystem.isRecording) {
                    showTargetSelector();
                }
            });
        }
        
        // 監聽可能的動態內容更新
        document.addEventListener('contentChanged', function() {
            console.log('檢測到內容變更，更新語音輸入目標');
        });
        
        // 監聽專科按鈕更新事件
        document.addEventListener('specialty-buttons-updated', function() {
            console.log('檢測到專科按鈕更新');
        });
    }

    // ===== 錄音控制函數 =====
    function startRecording() {
        if (!voiceSystem.recognition || voiceSystem.isFullyStopped === false) return;
        
        try {
            // 重置停止標誌
            voiceSystem.isFullyStopped = false;
            
            // 顯示UI元素
            ui.languageContainer.classList.remove('d-none');
            document.getElementById('voice-mode-container').classList.remove('d-none');
            ui.autoModeBadge.classList.remove('d-none');
            
            // 更新按鈕
            ui.voiceButton.innerHTML = '<i class="fas fa-stop"></i>';
            ui.voiceButton.classList.remove('btn-primary');
            ui.voiceButton.classList.add('btn-danger');
            ui.voiceButton.title = '停止語音輸入';
            
            // 更新狀態
            ui.voiceStatus.textContent = '正在聆聽...';
            ui.voiceStatus.classList.remove('d-none', 'bg-dark');
            ui.voiceStatus.classList.add('bg-danger');
            
            // 創建脈衝指示器
            createPulseIndicator();
            
            // 如果是目標模式，顯示選擇器
            if (!voiceSystem.isAutoMode) {
                showTargetSelector();
            }
            
            updateModeUI();
            
            // 開始語音識別
            voiceSystem.isRecording = true;
            voiceSystem.recognition.lang = voiceSystem.currentLanguage;
            voiceSystem.recognition.start();
            
            // 啟動計時器
            startRecordingTimer();
            
            console.log('語音識別啟動成功');
        } catch (e) {
            console.error('語音識別啟動失敗:', e);
            resetVoiceSystem();
        }
    }
    
    function stopRecording() {
        if (!voiceSystem.recognition) return;
        
        console.log('用戶請求停止錄音');
        
        try {
            // 停止所有計時器
            clearAllTimers();
            
            // 移除視覺元素
            removePulseIndicator();
            resetTargetHighlight();
            
            // 更新按鈕
            ui.voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
            ui.voiceButton.classList.remove('btn-danger');
            ui.voiceButton.classList.add('btn-primary');
            ui.voiceButton.title = '開始語音輸入';
            
            // 更新狀態
            ui.voiceStatus.textContent = '已停止';
            ui.voiceStatus.classList.remove('bg-danger');
            ui.voiceStatus.classList.add('bg-dark');
            
            // 隱藏UI元素
            setTimeout(() => {
                ui.voiceStatus.classList.add('d-none');
                ui.languageContainer.classList.add('d-none');
                document.getElementById('voice-mode-container').classList.add('d-none');
                ui.autoModeBadge.classList.add('d-none');
            }, 2000);
            
            // 停止識別
            voiceSystem.isRecording = false;
            voiceSystem.isFullyStopped = true; // 防止自動重啟
            
            try {
                voiceSystem.recognition.abort();
            } catch (e) {
                console.error('停止識別失敗，嘗試替代方法:', e);
                try { 
                    voiceSystem.recognition.stop(); 
                } catch (e2) { 
                    console.error('替代方法也失敗:', e2);
                }
            }
            
            // 完全重建語音識別實例
            voiceSystem.recognition = null;
            createRecognitionInstance();
            
            console.log('語音識別已完全停止');
        } catch (e) {
            console.error('停止語音識別時發生錯誤:', e);
            // 強制重置
            resetVoiceSystem();
        }
    }
    
    // 完全重置系統
    function resetVoiceSystem() {
        // 清除所有計時器
        clearAllTimers();
        
        // 重置UI
        ui.voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
        ui.voiceButton.classList.remove('btn-danger');
        ui.voiceButton.classList.add('btn-primary');
        ui.voiceButton.title = '開始語音輸入';
        
        ui.voiceStatus.textContent = '已停止';
        ui.voiceStatus.classList.remove('bg-danger');
        ui.voiceStatus.classList.add('bg-dark', 'd-none');
        
        ui.languageContainer.classList.add('d-none');
        document.getElementById('voice-mode-container').classList.add('d-none');
        ui.autoModeBadge.classList.add('d-none');
        
        // 重置狀態
        voiceSystem.isRecording = false;
        voiceSystem.isFullyStopped = true;
        voiceSystem.currentTarget = null;
        
        // 重建語音識別
        try {
            if (voiceSystem.recognition) {
                try { voiceSystem.recognition.abort(); } catch (e) { }
                voiceSystem.recognition = null;
            }
            createRecognitionInstance();
        } catch (e) {
            console.error('重置語音系統失敗:', e);
        }
        
        console.log('語音系統已完全重置');
    }

    // ===== 語音識別事件處理 =====
    function handleResult(event) {
        if (!voiceSystem.isRecording) return;
        
        // 獲取識別結果
        const results = event.results;
        const lastResult = results[results.length - 1];
        const transcript = lastResult[0].transcript.trim();
        
        if (lastResult.isFinal) {
            console.log(`最終識別結果: "${transcript}"`);
            
            // 視覺反饋
            flashVoiceButton();
            
            // 分類處理文本
            if (voiceSystem.isAutoMode) {
                intelligentMatch(transcript);
            } else if (voiceSystem.currentTarget) {
                appendTextToTextarea(voiceSystem.currentTarget, transcript);
            }
        }
    }
    
    function handleError(event) {
        console.error('語音識別錯誤:', event.error);
        
        // 特定錯誤處理
        if (event.error === 'no-speech') {
            ui.voiceStatus.textContent = '未檢測到語音，請說話...';
        } else if (event.error === 'audio-capture') {
            ui.voiceStatus.textContent = '無法訪問麥克風';
            stopRecording();
        } else if (event.error === 'not-allowed') {
            ui.voiceStatus.textContent = '麥克風權限被拒絕';
            stopRecording();
        } else if (event.error === 'network') {
            ui.voiceStatus.textContent = '網絡錯誤，嘗試重新連接...';
        } else {
            ui.voiceStatus.textContent = `錯誤: ${event.error}`;
        }
    }
    
    function handleEnd() {
        console.log('語音識別自動結束');
        
        // 如果設置了完全停止，不要重啟
        if (voiceSystem.isFullyStopped) {
            console.log('檢測到完全停止標誌，不進行重啟');
            return;
        }
        
        // 如果仍處於錄音狀態，嘗試重啟
        if (voiceSystem.isRecording) {
            console.log('嘗試自動重新啟動語音識別');
            ui.voiceStatus.textContent = '重新連接中...';
            
            // 視覺反饋 - 閃爍橙色表示重連
            flashPulseIndicator();
            
            // 立即重啟
            voiceSystem.autoRestartTimer = setTimeout(() => {
                if (voiceSystem.isRecording && !voiceSystem.isFullyStopped) {
                    try {
                        voiceSystem.recognition.start();
                        ui.voiceStatus.textContent = '繼續聆聽中...';
                    } catch (e) {
                        console.error('自動重啟失敗:', e);
                        // 如果失敗，嘗試重建實例再重啟
                        try {
                            createRecognitionInstance();
                            voiceSystem.recognition.start();
                        } catch (e2) {
                            console.error('重建實例後重啟仍然失敗:', e2);
                            // 最後嘗試停止後重新開始
                            resetVoiceSystem();
                        }
                    }
                }
            }, 100);
        }
    }

    // ===== 計時器相關函數 =====
    function startRecordingTimer() {
        // 創建或重置計時器
        if (voiceSystem.recordingTimer) {
            clearInterval(voiceSystem.recordingTimer);
        }
        
        // 記錄開始時間
        voiceSystem.recordingStartTime = new Date();
        
        // 創建計時器元素
        if (!ui.timerElement) {
            ui.timerElement = document.createElement('div');
            ui.timerElement.id = 'voice-recording-timer';
            ui.timerElement.className = 'badge bg-secondary position-fixed';
            ui.timerElement.style.bottom = '85px';
            ui.timerElement.style.right = '85px';
            ui.timerElement.style.zIndex = '1000';
            ui.timerElement.style.fontSize = '0.8rem';
            document.body.appendChild(ui.timerElement);
        }
        
        // 顯示計時器
        ui.timerElement.style.display = 'block';
        
        // 更新計時器
        voiceSystem.recordingTimer = setInterval(() => {
            if (!voiceSystem.recordingStartTime) return;
            
            const now = new Date();
            const duration = Math.floor((now - voiceSystem.recordingStartTime) / 1000);
            const minutes = Math.floor(duration / 60).toString().padStart(2, '0');
            const seconds = (duration % 60).toString().padStart(2, '0');
            
            ui.timerElement.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
    
    function clearAllTimers() {
        // 清除自動重啟計時器
        if (voiceSystem.autoRestartTimer) {
            clearTimeout(voiceSystem.autoRestartTimer);
            voiceSystem.autoRestartTimer = null;
        }
        
        // 清除錄音計時器
        if (voiceSystem.recordingTimer) {
            clearInterval(voiceSystem.recordingTimer);
            voiceSystem.recordingTimer = null;
            
            // 隱藏計時器元素
            if (ui.timerElement) {
                ui.timerElement.style.display = 'none';
            }
        }
        
        voiceSystem.recordingStartTime = null;
    }

    // ===== 視覺反饋功能 =====
    function createPulseIndicator() {
        // 創建脈衝指示器
        if (!ui.pulseIndicator) {
            ui.pulseIndicator = document.createElement('div');
            ui.pulseIndicator.id = 'voice-pulse-indicator';
            ui.pulseIndicator.style.position = 'absolute';
            ui.pulseIndicator.style.top = '-5px';
            ui.pulseIndicator.style.right = '-5px';
            ui.pulseIndicator.style.width = '15px';
            ui.pulseIndicator.style.height = '15px';
            ui.pulseIndicator.style.background = 'red';
            ui.pulseIndicator.style.borderRadius = '50%';
            ui.pulseIndicator.style.animation = 'voice-pulse 1.5s infinite';
            
            ui.voiceButton.style.position = 'relative';
            ui.voiceButton.appendChild(ui.pulseIndicator);
        } else {
            ui.pulseIndicator.style.display = 'block';
        }
    }
    
    function removePulseIndicator() {
        if (ui.pulseIndicator) {
            ui.pulseIndicator.style.display = 'none';
        }
    }
    
    function flashPulseIndicator() {
        if (ui.pulseIndicator) {
            const originalColor = ui.pulseIndicator.style.backgroundColor;
            ui.pulseIndicator.style.backgroundColor = 'orange';
            setTimeout(() => {
                if (ui.pulseIndicator) ui.pulseIndicator.style.backgroundColor = originalColor;
            }, 300);
        }
    }
    
    function flashVoiceButton() {
        ui.voiceButton.classList.add('flash-effect');
        setTimeout(() => {
            ui.voiceButton.classList.remove('flash-effect');
        }, 500);
    }

    // ===== 模式相關功能 =====
    function updateModeUI() {
        if (voiceSystem.isAutoMode) {
            ui.autoModeBadge.textContent = '自動分類模式';
            ui.autoModeBadge.classList.remove('bg-warning');
            ui.autoModeBadge.classList.add('bg-info');
        } else {
            ui.autoModeBadge.textContent = '目標輸入模式';
            ui.autoModeBadge.classList.remove('bg-info');
            ui.autoModeBadge.classList.add('bg-warning');
        }
    }
    
    function showTargetSelector() {
        // 創建覆蓋層
        ui.overlayElement = document.createElement('div');
        ui.overlayElement.className = 'modal-backdrop fade show';
        ui.overlayElement.style.opacity = '0.7';
        ui.overlayElement.style.zIndex = '1050';
        document.body.appendChild(ui.overlayElement);
        
        // 顯示提示
        const instructionBox = document.createElement('div');
        instructionBox.className = 'alert alert-warning text-center position-fixed';
        instructionBox.style.top = '20%';
        instructionBox.style.left = '50%';
        instructionBox.style.transform = 'translateX(-50%)';
        instructionBox.style.zIndex = '1060';
        instructionBox.style.maxWidth = '80%';
        instructionBox.innerHTML = '<b>請選擇要輸入的文本框</b><p>點擊任何文本框作為語音輸入目標</p>';
        document.body.appendChild(instructionBox);
        
        // 標記所有可用的文本框
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.classList.add('potential-target');
            textarea.style.border = '2px dashed #ffc107';
            
            // 為每個文本框添加一次性點擊事件
            const clickHandler = function() {
                selectTarget(textarea);
                // 清理
                textareas.forEach(t => {
                    t.classList.remove('potential-target');
                    t.style.border = '';
                    t.removeEventListener('click', clickHandler);
                });
                document.body.removeChild(ui.overlayElement);
                document.body.removeChild(instructionBox);
                ui.overlayElement = null;
            };
            
            textarea.addEventListener('click', clickHandler);
        });
    }
    
    function selectTarget(target) {
        voiceSystem.currentTarget = target;
        
        // 高亮所選目標
        target.style.border = '2px solid var(--bs-danger)';
        target.style.boxShadow = '0 0 8px rgba(255, 107, 107, 0.4)';
        target.classList.add('voice-input-active');
        
        // 更新狀態
        ui.voiceStatus.textContent = `正在聆聽 (目標: ${getTargetName(target)})`;
    }
    
    function resetTargetHighlight() {
        if (voiceSystem.currentTarget) {
            voiceSystem.currentTarget.style.border = '';
            voiceSystem.currentTarget.style.boxShadow = '';
            voiceSystem.currentTarget.classList.remove('voice-input-active');
            voiceSystem.currentTarget = null;
        }
    }
    
    function getTargetName(target) {
        // 嘗試獲取目標的標籤或名稱
        if (target.id) {
            // 尋找相關標籤
            const label = document.querySelector(`label[for="${target.id}"]`);
            if (label) return label.textContent;
            
            // 使用ID的可讀形式
            return target.id.replace(/[-_]/g, ' ').replace(/([A-Z])/g, ' $1')
                        .toLowerCase().replace(/^\w/, c => c.toUpperCase());
        }
        
        // 使用父元素中的標籤作為名稱
        const parent = target.closest('.form-group');
        if (parent) {
            const label = parent.querySelector('label');
            if (label) return label.textContent;
        }
        
        return '選中的文本框';
    }

    // ===== 文本處理功能 =====
    function intelligentMatch(text) {
        // 如果文本為空，直接返回
        if (!text || text.trim() === '') return;
        
        console.log(`智能匹配文本: "${text}"`);
        
        // 獲取所有可用文本區域
        const textareas = document.querySelectorAll('textarea');
        if (textareas.length === 0) return;
        
        // 將長文本拆分成句子進行處理
        if (text.length > 100 || text.includes('。') || text.includes('.')) {
            const sentences = splitTextIntoSentences(text);
            sentences.forEach(sentence => {
                if (sentence.trim()) classifySingleText(sentence, textareas, true);
            });
        } else {
            classifySingleText(text, textareas);
        }
    }
    
    function splitTextIntoSentences(text) {
        // 根據常見句子終止符拆分
        return text.split(/(?<=[。.!?！？])\s*/);
    }
    
    function classifySingleText(text, textareas, isSentence = false) {
        const lowerText = text.toLowerCase();
        
        // 字段信息定義 - 每個字段包含相關關鍵詞和對應的表單ID
        const fieldInfo = [
            {
                name: '主訴',
                keywords: ['主訴', '抱怨', '不舒服', '困擾', '麻煩', '感覺不適', '感到', '覺得'],
                id: 'chief_complaint',
                label: '主訴'
            },
            {
                name: '現病史',
                keywords: ['現病史', '病史', '發生', '開始', '出現', '以前', '幾天前', '昨天', '前天', '早上', '下午'],
                id: 'history_present_illness',
                label: '現病史'
            },
            {
                name: '過去病史',
                keywords: ['過去病史', '過去', '曾經有過', '以前得過', '曾因', '多年前', '既往'],
                id: 'past_medical_history',
                label: '過去病史'
            },
            {
                name: '過敏史',
                keywords: ['過敏', '不良反應', '禁忌', '不能使用', '嚴禁', '忌用'],
                id: 'allergies',
                label: '過敏史'
            },
            {
                name: '用藥史',
                keywords: ['用藥', '藥物', '服用', '吃藥', '處方', '非處方', '藥品', '治療中'],
                id: 'medications',
                label: '用藥史'
            },
            {
                name: '家族史',
                keywords: ['家族', '父親', '母親', '兄弟', '姐妹', '親人', '遺傳', '遺傳性'],
                id: 'family_history',
                label: '家族史'
            },
            {
                name: '社會史',
                keywords: ['社會', '工作', '職業', '工種', '吸菸', '抽菸', '喝酒', '飲酒', '習慣', '生活習慣'],
                id: 'social_history',
                label: '社會史'
            },
            {
                name: '體格檢查',
                keywords: ['體檢', '檢查發現', '體格檢查', '專科檢查', '檢查時', '查體', '視診', '聽診', '叩診', '觸診'],
                id: 'physical_examination',
                label: '體格檢查'
            },
            {
                name: '生命體徵',
                keywords: ['體徵', '血壓', '脈搏', '呼吸', '體溫', '氧飽和度', 'BP', 'HR', 'RR', 'BT', '發燒', '血糖'],
                id: 'vital_signs',
                label: '生命體徵'
            },
            {
                name: '實驗室檢查',
                keywords: ['實驗室', '化驗', '檢驗', '血常規', '尿常規', '生化', '免疫', '檢測'],
                id: 'laboratory_results',
                label: '實驗室檢查'
            },
            {
                name: '影像學檢查',
                keywords: ['影像', '超音波', 'X光', 'CT', 'MRI', '磁共振', '超聲', '放射', '造影'],
                id: 'imaging_results',
                label: '影像學檢查'
            },
            {
                name: '評估',
                keywords: ['評估', '診斷', '考慮', '可能是', '傾向於', '診斷為', '評價為', '初步診斷', '印象', '斷為'],
                id: 'assessment',
                label: '評估診斷'
            },
            {
                name: '計劃',
                keywords: ['計劃', '處理', '安排', '治療', '用藥', '建議', '手術', '處置', '隨訪', '複查'],
                id: 'plan',
                label: '治療計劃'
            }
        ];
        
        // 特殊處理問診問題 - 如果包含問號，可能是醫生在提問
        if (text.includes('?') || text.includes('？')) {
            // 檢查是否是常見問診問題
            console.log('識別為醫生提問:', text);
            // 這裡可以不做特殊處理，或者將其歸入現病史
            const historyTextarea = findTextareaById(textareas, 'history_present_illness');
            if (historyTextarea) {
                appendTextToTextarea(historyTextarea, `醫生提問: ${text}\n`);
                flashTextarea(historyTextarea);
                return;
            }
        }
        
        // 尋找最匹配的字段
        let bestMatch = null;
        let highestScore = -1;
        
        fieldInfo.forEach(field => {
            // 計算匹配分數
            let score = 0;
            
            // 檢查字段名稱是否直接出現在文本中
            if (text.includes(field.name)) {
                score += 10;
            }
            
            // 檢查關鍵詞
            field.keywords.forEach(keyword => {
                if (lowerText.includes(keyword.toLowerCase())) {
                    score += 3;
                }
            });
            
            // 如果是句子級別的分類，加權不同
            if (isSentence) {
                // 句子開頭出現的關鍵詞權重更高
                field.keywords.forEach(keyword => {
                    if (lowerText.startsWith(keyword.toLowerCase() + '：') || 
                        lowerText.startsWith(keyword.toLowerCase() + ':')) {
                        score += 10;
                    }
                });
            }
            
            // 更新最佳匹配
            if (score > highestScore) {
                highestScore = score;
                bestMatch = field;
            }
        });
        
        // 如果找到匹配並且分數足夠高
        if (bestMatch && highestScore >= 3) {
            const matchedTextarea = findTextareaById(textareas, bestMatch.id);
            if (matchedTextarea) {
                // 如果文本中包含字段名稱，刪除它
                let processedText = text;
                if (text.includes(bestMatch.name)) {
                    processedText = text.replace(bestMatch.name, '').replace(/[:：]\s*/, '');
                }
                
                appendTextToTextarea(matchedTextarea, isSentence ? processedText : processedText + '\n');
                flashTextarea(matchedTextarea);
                console.log(`將文本 "${text}" 分類到 "${bestMatch.name}"`);
                return;
            }
        }
        
        // 如果沒有明確匹配，放入現病史或主訴
        if (isSentence) {
            const historyTextarea = findTextareaById(textareas, 'history_present_illness');
            if (historyTextarea) {
                appendTextToTextarea(historyTextarea, text);
                flashTextarea(historyTextarea);
                console.log(`未明確分類，將句子 "${text}" 添加到現病史`);
                return;
            }
        } else {
            const chiefTextarea = findTextareaById(textareas, 'chief_complaint');
            if (chiefTextarea) {
                appendTextToTextarea(chiefTextarea, text + '\n');
                flashTextarea(chiefTextarea);
                console.log(`未明確分類，將文本 "${text}" 添加到主訴`);
                return;
            }
        }
        
        // 最後嘗試，找到任何可用的文本區域
        if (textareas.length > 0) {
            appendTextToTextarea(textareas[0], text + '\n');
            flashTextarea(textareas[0]);
            console.log(`沒有找到適合的字段，將文本 "${text}" 添加到第一個文本框`);
        }
    }
    
    function findTextareaById(textareas, id) {
        // 嘗試通過ID精確匹配
        for (let textarea of textareas) {
            if (textarea.id === id) return textarea;
        }
        
        // 嘗試通過ID部分匹配
        for (let textarea of textareas) {
            if (textarea.id && textarea.id.includes(id)) return textarea;
        }
        
        // 嘗試通過name屬性匹配
        for (let textarea of textareas) {
            if (textarea.name === id || (textarea.name && textarea.name.includes(id))) 
                return textarea;
        }
        
        return null;
    }
    
    function appendTextToTextarea(textarea, text) {
        if (!textarea) return;
        
        // 如果已有內容，確保適當換行
        if (textarea.value && textarea.value.trim() && !textarea.value.endsWith('\n')) {
            textarea.value += '\n';
        }
        
        // 添加新內容
        textarea.value += text;
        
        // 滾動到底部
        textarea.scrollTop = textarea.scrollHeight;
        
        // 觸發變更事件以確保表單驗證等功能正常工作
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
    }
    
    function flashTextarea(textarea) {
        if (!textarea) return;
        
        // 添加閃爍效果
        textarea.classList.add('flash-effect');
        setTimeout(() => {
            textarea.classList.remove('flash-effect');
        }, 500);
    }

    // ===== 初始化 =====
    initialize();
    
    // ===== 對外接口 =====
    // 允許其他腳本通知按鈕更新
    window.notifyButtonsUpdated = function() {
        console.log('接收到按鈕更新通知');
    };
    
    // 對外暴露語音系統
    window.voiceSystem = {
        start: startRecording,
        stop: stopRecording,
        isRecording: () => voiceSystem.isRecording,
        setAutoMode: (mode) => {
            voiceSystem.isAutoMode = mode;
            updateModeUI();
        }
    };
});