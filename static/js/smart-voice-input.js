/**
 * 智能語音輸入功能 
 * 自動識別關鍵詞並填寫到對應欄位
 */

document.addEventListener('DOMContentLoaded', function() {
    // 檢查瀏覽器支援
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('您的瀏覽器不支援語音識別功能');
        const voiceButton = document.getElementById('voice-button');
        if (voiceButton) {
            voiceButton.disabled = true;
            voiceButton.title = '您的瀏覽器不支援語音識別功能';
            voiceButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        }
        return;
    }
    
    // 獲取DOM元素
    const voiceButton = document.getElementById('voice-button');
    const voiceStatus = document.getElementById('voice-status');
    const languageContainer = document.getElementById('voice-language-container');
    const languageSelect = document.getElementById('voice-language');
    
    if (!voiceButton || !voiceStatus || !languageContainer || !languageSelect) {
        console.error('找不到語音輸入所需的DOM元素');
        return;
    }
    
    // 語音識別變數
    let recognition = null;
    let isRecording = false;
    let autoMode = true; // 新增: 智能模式標誌
    
    // 創建語音識別實例
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    // 設置語音識別選項
    recognition.continuous = true;  // 持續聽取
    recognition.interimResults = true; // 實時結果
    recognition.lang = languageSelect.value;
    
    // 關鍵詞映射表 - 用於智能歸類
    const keywordMapping = {
        // 主訴相關關鍵詞
        'chief_complaint': [
            '主訴', '主要症狀', '問題', '困擾', '不舒服', '痛', '疼', '不適', 
            '難受', '症狀', '感覺', '覺得', '感到'
        ],
        
        // 現病史關鍵詞
        'history_present_illness': [
            '病史', '現病史', '這次', '本次', '這一次', '這幾天', '最近', '近期',
            '開始', '發生', '出現', '逐漸', '突然', '持續', '時間', '多久',
            '一週前', '幾天前', '昨天', '今天早上', '加重', '減輕'
        ],
        
        // 過去病史關鍵詞
        'past_medical_history': [
            '過去病史', '既往史', '以前', '曾經', '之前', '過去', '做過', '得過',
            '生過', '患過', '手術史', '住院', '曾住院', '過敏史'
        ],
        
        // 用藥史關鍵詞
        'medications': [
            '藥物', '藥', '用藥', '服用', '吃藥', '在吃', '處方', '西藥', '中藥',
            '成藥', '自行購買', '長期服用', '目前用藥', '現在用藥'
        ],
        
        // 過敏史關鍵詞
        'allergies': [
            '過敏', '不能吃', '不能用', '對什麼過敏', '藥物過敏', '食物過敏',
            '花粉過敏', '皮疹', '紅疹', '蕁麻疹', '打針過敏'
        ],
        
        // 家族史關鍵詞
        'family_history': [
            '家族', '家人', '親人', '父親', '母親', '兄弟', '姐妹', '爸爸', '媽媽',
            '遺傳', '基因', '家族病史'
        ],
        
        // 社會史關鍵詞
        'social_history': [
            '社會史', '工作', '職業', '生活', '習慣', '嗜好', '抽菸', '吸菸', '喝酒',
            '飲酒', '熬夜', '運動', '作息', '婚姻', '結婚', '吸毒', '藥物濫用'
        ],
        
        // 身體檢查關鍵詞
        'physical_examination': [
            '檢查', '觸診', '聽診', '叩診', '視診', '體檢', '體格檢查', '身體檢查',
            '頭部', '頸部', '胸部', '腹部', '四肢', '皮膚', '神經'
        ],
        
        // 生命體徵關鍵詞
        'vital_signs': [
            '生命徵象', '體溫', '血壓', '心跳', '脈搏', '呼吸', '心率', '體重',
            '身高', '體溫', 'BP', 'HR', 'T', 'RR', 'SPO2', '血氧'
        ]
    };
    
    // 更新智能模式UI
    function updateAutoModeUI() {
        const modeText = autoMode ? '智能模式' : '目標模式';
        const modeClass = autoMode ? 'bg-success' : 'bg-primary';
        
        // 更新按鈕提示
        voiceButton.title = `語音輸入 (${modeText})`;
        
        // 添加模式指示器
        let modeIndicator = document.getElementById('voice-mode-indicator');
        if (!modeIndicator) {
            modeIndicator = document.createElement('div');
            modeIndicator.id = 'voice-mode-indicator';
            modeIndicator.className = `mb-2 p-2 rounded text-center text-white ${modeClass}`;
            modeIndicator.textContent = modeText;
            voiceButton.parentNode.insertBefore(modeIndicator, voiceButton);
        } else {
            modeIndicator.textContent = modeText;
            modeIndicator.className = `mb-2 p-2 rounded text-center text-white ${modeClass}`;
        }
    }
    
    // 雙擊切換模式
    voiceButton.addEventListener('dblclick', function(e) {
        e.preventDefault();
        autoMode = !autoMode;
        updateAutoModeUI();
        
        // 顯示提示訊息
        const message = autoMode ? 
            '已切換到智能模式：自動識別關鍵詞並填寫到對應欄位' : 
            '已切換到目標模式：需選擇特定文本框輸入';
            
        // 創建提示元素
        const toast = document.createElement('div');
        toast.className = 'position-fixed top-50 start-50 translate-middle bg-dark text-white p-3 rounded';
        toast.style.zIndex = '9999';
        toast.style.opacity = '0.9';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 2秒後移除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => document.body.removeChild(toast), 500);
        }, 2000);
    });
    
    // 語言變更事件
    languageSelect.addEventListener('change', function() {
        if (recognition) {
            recognition.lang = this.value;
        }
    });
    
    // 點擊語音按鈕
    voiceButton.addEventListener('click', function() {
        if (isRecording) {
            stopRecording();
        } else {
            if (autoMode) {
                // 智能模式直接開始錄音
                startRecording();
            } else {
                // 目標模式先選擇文本框
                showTargetSelector();
            }
        }
    });
    
    // 顯示目標選擇器 (僅目標模式使用)
    function showTargetSelector() {
        // 移除任何之前的選擇器
        const existingOverlay = document.getElementById('target-selector-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }
        
        // 創建選擇器覆蓋層
        const overlay = document.createElement('div');
        overlay.id = 'target-selector-overlay';
        overlay.className = 'position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex flex-column align-items-center justify-content-center';
        overlay.style.zIndex = '2000';
        
        // 創建提示訊息
        const message = document.createElement('div');
        message.className = 'text-white mb-4 p-3 rounded bg-dark';
        message.innerHTML = '<h4>請選擇要輸入的文本區域</h4><p>點擊任何文本框開始語音輸入，或點擊此處取消</p>';
        
        // 點擊提示取消
        message.addEventListener('click', function(e) {
            e.stopPropagation();
            document.body.removeChild(overlay);
        });
        
        overlay.appendChild(message);
        document.body.appendChild(overlay);
        
        // 為所有文本框添加事件
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(function(textarea) {
            const originalBorder = textarea.style.border;
            const originalShadow = textarea.style.boxShadow;
            
            // 高亮顯示可以選擇的文本框
            textarea.style.border = '2px dashed var(--bs-primary)';
            textarea.style.boxShadow = '0 0 10px rgba(13, 110, 253, 0.5)';
            
            // 點擊事件
            textarea.addEventListener('click', function onTextareaClick(e) {
                e.stopPropagation();
                // 恢復所有文本框樣式
                textareas.forEach(function(t) {
                    t.style.border = '';
                    t.style.boxShadow = '';
                    t.removeEventListener('click', onTextareaClick);
                });
                
                // 設置當前目標
                window.currentTarget = textarea;
                document.body.removeChild(overlay);
                
                // 開始錄音
                startRecording();
            }, { once: true });
        });
        
        // 點擊空白區域取消
        overlay.addEventListener('click', function() {
            textareas.forEach(function(textarea) {
                textarea.style.border = '';
                textarea.style.boxShadow = '';
            });
            document.body.removeChild(overlay);
        });
    }
    
    // 開始錄音
    function startRecording() {
        if (!recognition) return;
        
        try {
            // 顯示語言選擇
            languageContainer.classList.remove('d-none');
            
            // 更新按鈕
            voiceButton.innerHTML = '<i class="fas fa-stop"></i>';
            voiceButton.classList.remove('btn-primary');
            voiceButton.classList.add('btn-danger');
            voiceButton.title = '點擊停止語音輸入';
            
            // 更新狀態
            voiceStatus.textContent = '正在聆聽...';
            voiceStatus.classList.remove('d-none', 'bg-dark');
            voiceStatus.classList.add('bg-danger');
            
            // 如果是目標模式，高亮當前輸入目標
            if (!autoMode && window.currentTarget) {
                window.currentTarget.style.border = '2px solid var(--bs-danger)';
                window.currentTarget.style.boxShadow = '0 0 8px rgba(255, 107, 107, 0.4)';
                window.currentTarget.classList.add('voice-input-active');
                window.originalContent = window.currentTarget.value || '';
            }
            
            // 設置事件處理
            recognition.onresult = handleResult;
            recognition.onerror = handleError;
            recognition.onend = handleEnd;
            
            // 開始語音識別
            isRecording = true;
            recognition.start();
        } catch (e) {
            console.error('語音識別啟動失敗:', e);
            stopRecording();
        }
    }
    
    // 停止錄音
    function stopRecording() {
        if (!recognition) return;
        
        try {
            // 隱藏語言選擇
            languageContainer.classList.add('d-none');
            
            // 更新按鈕
            voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceButton.classList.remove('btn-danger');
            voiceButton.classList.add('btn-primary');
            voiceButton.title = '點擊開始語音輸入';
            
            // 更新狀態
            voiceStatus.textContent = '已停止';
            voiceStatus.classList.remove('bg-danger');
            voiceStatus.classList.add('bg-dark');
            
            // 恢復文本框樣式 (目標模式)
            if (!autoMode && window.currentTarget) {
                window.currentTarget.style.border = '';
                window.currentTarget.style.boxShadow = '';
                window.currentTarget.classList.remove('voice-input-active');
                window.currentTarget = null;
                window.originalContent = '';
            }
            
            // 停止語音識別
            isRecording = false;
            recognition.stop();
            
            // 2秒後隱藏狀態
            setTimeout(function() {
                voiceStatus.classList.add('d-none');
            }, 2000);
        } catch (e) {
            console.error('語音識別停止失敗:', e);
        }
    }
    
    // 智能匹配文本到適當欄位
    function intelligentMatch(text) {
        if (!text) return;
        
        console.log('正在智能匹配文本:', text);
        
        // 找出所有可能的文本區域
        const textareas = {};
        document.querySelectorAll('textarea').forEach(function(textarea) {
            if (textarea.id) {
                textareas[textarea.id] = textarea;
            } else if (textarea.name) {
                textareas[textarea.name] = textarea;
            }
        });
        
        // 如果找不到任何文本區域，無法繼續
        if (Object.keys(textareas).length === 0) {
            console.warn('找不到任何可識別的文本區域');
            return;
        }
        
        // 主訴區域的特殊處理
        const chiefComplaintTextarea = textareas['chief_complaint'] || 
                                      document.querySelector('textarea[placeholder*="主訴"]') ||
                                      document.querySelector('textarea[aria-label*="主訴"]');
        
        // 現病史區域的特殊處理
        const hpiTextarea = textareas['history_present_illness'] || 
                           document.querySelector('textarea[placeholder*="現病史"]') ||
                           document.querySelector('textarea[aria-label*="現病史"]');
                           
        // 如果沒有識別到特定區域，嘗試通過關鍵詞分類
        let bestMatch = null;
        let highestScore = 0;
        
        // 計算每個類別的匹配分數
        for (const [category, keywords] of Object.entries(keywordMapping)) {
            let score = 0;
            keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    score++;
                }
            });
            
            if (score > highestScore) {
                highestScore = score;
                bestMatch = category;
            }
        }
        
        // 如果有最佳匹配，將文本添加到相應區域
        if (bestMatch && textareas[bestMatch]) {
            console.log(`找到最佳匹配類別: ${bestMatch}，分數: ${highestScore}`);
            
            const targetTextarea = textareas[bestMatch];
            let currentContent = targetTextarea.value || '';
            
            // 如果當前內容為空或以句號結尾，直接添加
            if (currentContent === '' || currentContent.trim().endsWith('.') || 
                currentContent.trim().endsWith('。')) {
                targetTextarea.value = currentContent + text;
            } else {
                // 否則添加一個空格或標點符號再添加
                targetTextarea.value = currentContent + '。' + text;
            }
            
            // 高亮顯示目標區域
            flashTextarea(targetTextarea);
            
            // 觸發變更事件
            const event = new Event('input', { bubbles: true });
            targetTextarea.dispatchEvent(event);
            
            return;
        }
        
        // 如果沒有特定匹配，優先考慮主訴或現病史
        if (text.length < 30 && chiefComplaintTextarea) {
            // 短文本，可能是主訴
            let currentContent = chiefComplaintTextarea.value || '';
            chiefComplaintTextarea.value = currentContent ? (currentContent + '，' + text) : text;
            flashTextarea(chiefComplaintTextarea);
            
            // 觸發變更事件
            const event = new Event('input', { bubbles: true });
            chiefComplaintTextarea.dispatchEvent(event);
        } else if (hpiTextarea) {
            // 長文本，可能是現病史
            let currentContent = hpiTextarea.value || '';
            
            // 如果當前內容為空或以句號結尾，直接添加
            if (currentContent === '' || currentContent.trim().endsWith('.') || 
                currentContent.trim().endsWith('。')) {
                hpiTextarea.value = currentContent + text;
            } else {
                // 否則添加一個空格或標點符號再添加
                hpiTextarea.value = currentContent + '。' + text;
            }
            
            flashTextarea(hpiTextarea);
            
            // 觸發變更事件
            const event = new Event('input', { bubbles: true });
            hpiTextarea.dispatchEvent(event);
        }
    }
    
    // 高亮閃爍文本區域以提示用戶
    function flashTextarea(textarea) {
        if (!textarea) return;
        
        // 保存原始樣式
        const originalBorder = textarea.style.border;
        const originalShadow = textarea.style.boxShadow;
        
        // 添加閃爍動畫
        textarea.style.border = '2px solid var(--bs-success)';
        textarea.style.boxShadow = '0 0 10px rgba(25, 135, 84, 0.5)';
        
        // 自動滾動到該區域
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 3秒後恢復原始樣式
        setTimeout(() => {
            textarea.style.border = originalBorder;
            textarea.style.boxShadow = originalShadow;
        }, 3000);
    }
    
    // 處理語音識別結果
    function handleResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // 智能模式下，分析最終文本並路由到適當欄位
        if (autoMode && finalTranscript) {
            intelligentMatch(finalTranscript);
            return;
        }
        
        // 目標模式下，將文本填入選定的文本框
        if (!autoMode && window.currentTarget && (finalTranscript || interimTranscript)) {
            if (finalTranscript) {
                // 對於最終文本，添加到原始內容
                if (window.originalContent && window.originalContent.trim() !== '') {
                    window.originalContent += ' ' + finalTranscript;
                } else {
                    window.originalContent = finalTranscript;
                }
                
                window.currentTarget.value = window.originalContent + interimTranscript;
            } else {
                // 對於臨時文本，顯示為臨時內容
                window.currentTarget.value = (window.originalContent || '') + interimTranscript;
            }
            
            // 觸發變更事件
            const event = new Event('input', { bubbles: true });
            window.currentTarget.dispatchEvent(event);
        }
    }
    
    // 處理語音識別錯誤
    function handleError(event) {
        console.error('語音識別錯誤:', event.error);
        
        let errorMessage = '發生錯誤';
        switch (event.error) {
            case 'not-allowed':
                errorMessage = '麥克風存取被拒絕';
                break;
            case 'network':
                errorMessage = '網路錯誤';
                break;
            case 'no-speech':
                errorMessage = '未檢測到語音';
                break;
        }
        
        // 更新狀態
        voiceStatus.textContent = errorMessage;
        voiceStatus.classList.remove('d-none', 'bg-danger');
        voiceStatus.classList.add('bg-warning', 'text-dark');
        
        // 如果不是用戶拒絕，嘗試重新啟動
        if (event.error !== 'not-allowed' && isRecording) {
            try {
                recognition.stop();
                
                setTimeout(function() {
                    if (isRecording) {
                        try {
                            recognition.start();
                            voiceStatus.textContent = '重新聆聽...';
                            voiceStatus.classList.remove('bg-warning', 'text-dark');
                            voiceStatus.classList.add('bg-danger', 'text-white');
                        } catch (e) {
                            console.error('重新啟動語音識別失敗:', e);
                            stopRecording();
                        }
                    }
                }, 1000);
            } catch (e) {
                console.error('停止語音識別失敗:', e);
                stopRecording();
            }
        } else {
            stopRecording();
        }
    }
    
    // 處理語音識別結束
    function handleEnd() {
        // 如果還在錄音狀態，重新啟動
        if (isRecording) {
            try {
                recognition.start();
                voiceStatus.textContent = '繼續聆聽...';
            } catch (e) {
                console.error('重新啟動語音識別失敗:', e);
                stopRecording();
            }
        }
    }
    
    // 初始化UI
    updateAutoModeUI();
});