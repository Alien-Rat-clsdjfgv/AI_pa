/**
 * 智能語音輸入功能 
 * 自動識別關鍵詞並填寫到對應欄位
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化智能語音輸入系統...');
    
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
    
    // 如果語音輸入UI元素不存在，則創建
    createVoiceInputUIIfNeeded();
    
    // 獲取DOM元素
    const voiceButton = document.getElementById('voice-button');
    const voiceStatus = document.getElementById('voice-status');
    const languageContainer = document.getElementById('voice-language-container');
    const languageSelect = document.getElementById('voice-language');
    
    // 如果仍找不到DOM元素，則報錯並退出
    if (!voiceButton || !voiceStatus || !languageContainer || !languageSelect) {
        console.error('找不到語音輸入所需的DOM元素，即使已嘗試創建');
        return;
    }
    
    console.log('語音輸入系統已準備就緒');
    
    // 監聽按鈕更新事件 (來自其他腳本)
    window.addEventListener('buttonsUpdated', function() {
        console.log('檢測到按鈕更新，重新初始化語音輸入系統...');
        
        // 重新獲取DOM元素
        const refreshedVoiceButton = document.getElementById('voice-button');
        if (!refreshedVoiceButton) {
            console.log('嘗試重新創建語音輸入UI元素...');
            createVoiceInputUIIfNeeded();
            
            // 重新綁定事件
            const newVoiceButton = document.getElementById('voice-button');
            if (newVoiceButton) {
                // 清除之前的事件監聽器 (如果有)
                newVoiceButton.replaceWith(newVoiceButton.cloneNode(true));
                
                // 獲取更新後的DOM元素
                const updatedVoiceButton = document.getElementById('voice-button');
                const updatedVoiceStatus = document.getElementById('voice-status');
                const updatedLanguageContainer = document.getElementById('voice-language-container');
                const updatedLanguageSelect = document.getElementById('voice-language');
                
                // 重新綁定事件
                if (updatedVoiceButton) {
                    updatedVoiceButton.addEventListener('click', function() {
                        if (isRecording) {
                            stopRecording();
                        } else {
                            if (autoMode) {
                                startRecording();
                            } else {
                                showTargetSelector();
                            }
                        }
                    });
                    
                    updatedVoiceButton.addEventListener('dblclick', function(e) {
                        e.preventDefault();
                        autoMode = !autoMode;
                        updateAutoModeUI();
                    });
                    
                    console.log('語音輸入系統事件重新綁定完成');
                }
            }
        }
    });
    
    // 創建語音輸入UI元素（如果尚未存在）
    function createVoiceInputUIIfNeeded() {
        if (document.getElementById('voice-button')) {
            return; // 已存在
        }
        
        console.log('正在創建語音輸入UI元素...');
        
        // 創建語音輸入按鈕容器
        const voiceInputContainer = document.createElement('div');
        voiceInputContainer.id = 'voice-input-button';
        voiceInputContainer.className = 'position-fixed bottom-0 end-0 mb-5 me-3 d-flex flex-column';
        voiceInputContainer.style.zIndex = '1050';
        
        // 創建狀態顯示
        const statusDiv = document.createElement('div');
        statusDiv.id = 'voice-status';
        statusDiv.className = 'd-none mb-2 p-2 rounded text-center text-white bg-dark';
        statusDiv.textContent = '準備中...';
        
        // 創建語言選擇容器
        const langContainer = document.createElement('div');
        langContainer.id = 'voice-language-container';
        langContainer.className = 'mb-2 bg-dark p-2 rounded shadow-sm d-none';
        
        // 創建語言選擇下拉框
        const langSelect = document.createElement('select');
        langSelect.id = 'voice-language';
        langSelect.className = 'form-select form-select-sm';
        
        // 添加語言選項
        const languages = [
            { value: 'zh-TW', text: '中文 (繁體)' },
            { value: 'zh-CN', text: '中文 (簡體)' },
            { value: 'en-US', text: '英文' },
            { value: 'ja-JP', text: '日文' }
        ];
        
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.value;
            option.textContent = lang.text;
            langSelect.appendChild(option);
        });
        
        // 創建語音按鈕
        const button = document.createElement('button');
        button.id = 'voice-button';
        button.className = 'btn btn-primary rounded-circle shadow-lg p-3';
        button.style.width = '60px';
        button.style.height = '60px';
        button.title = '點擊開始語音輸入';
        button.innerHTML = '<i class="fas fa-microphone"></i>';
        
        // 組裝DOM
        langContainer.appendChild(langSelect);
        voiceInputContainer.appendChild(statusDiv);
        voiceInputContainer.appendChild(langContainer);
        voiceInputContainer.appendChild(button);
        
        // 添加到body
        document.body.appendChild(voiceInputContainer);
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
    recognition.maxAlternatives = 3; // 獲取多個可能的結果
    recognition.lang = languageSelect.value;
    
    // 增加自動重啟功能，防止意外中斷
    let autoRestartTimer = null;
    
    // 問診問題與欄位映射表 - 用於智能歸類
    const keywordMapping = {
        // 主訴相關關鍵詞與問題
        'chief_complaint': [
            '主訴', '主要症狀', '哪裡不舒服', '什麼問題', '為什麼來看醫生', 
            '困擾', '不舒服', '痛', '疼', '不適', '難受', '症狀', 
            '感覺', '覺得', '感到', '今天為什麼來'
        ],
        
        // 現病史關鍵詞與問題
        'history_present_illness': [
            '這個症狀多久了', '什麼時候開始的', '是突然還是慢慢出現的',
            '病史', '現病史', '這次', '本次', '這一次', '這幾天', '最近', '近期',
            '開始', '發生', '出現', '逐漸', '突然', '持續', '時間', '多久',
            '一週前', '幾天前', '昨天', '今天早上', '加重', '減輕',
            '有沒有什麼會讓症狀變嚴重', '有沒有什麼可以改善症狀'
        ],
        
        // 過去病史關鍵詞與問題
        'past_medical_history': [
            '過去有沒有什麼病史', '以前有沒有生過什麼病', '有沒有做過手術',
            '過去病史', '既往史', '以前', '曾經', '之前', '過去', '做過', '得過',
            '生過', '患過', '手術史', '住院', '曾住院', '過敏史',
            '有沒有高血壓', '有沒有糖尿病', '有沒有心臟病'
        ],
        
        // 用藥史關鍵詞與問題
        'medications': [
            '目前有在吃什麼藥嗎', '平常有吃什麼藥', '長期服用什麼藥',
            '藥物', '藥', '用藥', '服用', '吃藥', '在吃', '處方', '西藥', '中藥',
            '成藥', '自行購買', '長期服用', '目前用藥', '現在用藥'
        ],
        
        // 過敏史關鍵詞與問題
        'allergies': [
            '有沒有對什麼過敏', '有沒有藥物過敏', '吃了什麼會過敏',
            '過敏', '不能吃', '不能用', '對什麼過敏', '藥物過敏', '食物過敏',
            '花粉過敏', '皮疹', '紅疹', '蕁麻疹', '打針過敏'
        ],
        
        // 家族史關鍵詞與問題
        'family_history': [
            '家族有人有這種症狀嗎', '家人有類似的病嗎', '你的父母有什麼病史',
            '家族', '家人', '親人', '父親', '母親', '兄弟', '姐妹', '爸爸', '媽媽',
            '遺傳', '基因', '家族病史'
        ],
        
        // 社會史關鍵詞與問題
        'social_history': [
            '你的工作是什麼', '有抽菸嗎', '有喝酒嗎', '平常生活習慣如何',
            '社會史', '工作', '職業', '生活', '習慣', '嗜好', '抽菸', '吸菸', '喝酒',
            '飲酒', '熬夜', '運動', '作息', '婚姻', '結婚', '吸毒', '藥物濫用',
            '有沒有結婚', '獨居嗎'
        ],
        
        // 身體檢查關鍵詞與問題
        'physical_examination': [
            '讓我檢查一下', '看一下你的', '測量一下', '身體檢查顯示',
            '檢查', '觸診', '聽診', '叩診', '視診', '體檢', '體格檢查', '身體檢查',
            '頭部', '頸部', '胸部', '腹部', '四肢', '皮膚', '神經',
            '伸出舌頭讓我看看', '深呼吸', '說啊'
        ],
        
        // 生命體徵關鍵詞與問題
        'vital_signs': [
            '量一下血壓', '測一下體溫', '測一下血氧', '脈搏是多少',
            '生命徵象', '體溫', '血壓', '心跳', '脈搏', '呼吸', '心率', '體重',
            '身高', '體溫', 'BP', 'HR', 'T', 'RR', 'SPO2', '血氧'
        ]
    };
    
    // 更新智能模式UI
    function updateAutoModeUI() {
        const modeText = autoMode ? '問診對話模式' : '目標輸入模式';
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
            '已切換到問診對話模式：自動識別醫生問題和病人回答，輸入到對應欄位' : 
            '已切換到目標輸入模式：需先選擇要輸入的表單欄位';
            
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
    function stopRecording(autoRestart = false) {
        if (!recognition) return;
        
        try {
            // 清除任何現有的自動重啟計時器
            if (autoRestartTimer) {
                clearTimeout(autoRestartTimer);
                autoRestartTimer = null;
            }
            
            if (!autoRestart) {
                // 常規停止 (用戶點擊了停止按鈕)
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
            } else {
                // 自動重啟模式 (因為瀏覽器自動停止了識別)
                console.log('語音識別自動中斷，準備重新啟動...');
                recognition.stop();
                
                // 更新狀態（不改變視覺樣式）
                voiceStatus.textContent = '重新連接中...';
                
                // 在短暫延遲後重新啟動錄音
                autoRestartTimer = setTimeout(function() {
                    if (isRecording) { // 確保用戶沒有手動停止
                        try {
                            console.log('自動重啟語音識別');
                            recognition.start();
                            voiceStatus.textContent = '正在聆聽...';
                        } catch (e) {
                            console.error('自動重啟語音識別失敗:', e);
                            // 如果重啟失敗，執行常規停止
                            stopRecording(false);
                        }
                    }
                }, 300);
            }
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
        
        // 檢查文本是否包含多個句子，可以嘗試分割
        const sentences = splitTextIntoSentences(text);
        
        // 如果只有一個句子，使用單句分類邏輯
        if (sentences.length <= 1) {
            classifySingleText(text, textareas);
            return;
        }
        
        console.log(`檢測到多個句子 (${sentences.length})，嘗試分別分類`);
        
        // 多句文本，嘗試將不同句子分類到不同欄位
        let classifiedCount = 0;
        
        // 為每個句子單獨分類
        sentences.forEach(sentence => {
            if (sentence.trim().length > 3) { // 忽略太短的句子
                const classified = classifySingleText(sentence, textareas, true);
                if (classified) classifiedCount++;
            }
        });
        
        console.log(`${classifiedCount}/${sentences.length} 句子已成功分類`);
    }
    
    // 將文本拆分為句子
    function splitTextIntoSentences(text) {
        // 使用標點符號作為句子分隔符
        return text.split(/(?<=[。！？.!?])/g)
            .filter(sentence => sentence.trim().length > 0);
    }
    
    // 判斷文本是否包含問句
    function containsQuestion(text) {
        const questionPatterns = [
            /有.+嗎/, /是.+嗎/, /會.+嗎/, /能.+嗎/, /可以.+嗎/,
            /多久/, /什麼時候/, /怎麼樣/, /如何/, /為什麼/,
            /哪裡/, /誰/, /幾/, /多少/,
            /\?/, /？/
        ];
        
        return questionPatterns.some(pattern => pattern.test(text));
    }
    
    // 區分醫生問題和病人回答
    function processConversation(text) {
        // 如果文本很短或者包含問句，可能是醫生的提問
        if (text.length < 15 || containsQuestion(text)) {
            console.log('識別為醫生提問:', text);
            return { isQuestion: true, text: text };
        } else {
            // 否則可能是病人的回答
            console.log('識別為病人回答:', text);
            return { isQuestion: false, text: text };
        }
    }
    
    // 單句文本分類
    function classifySingleText(text, textareas, isSentence = false) {
        if (!text || text.trim().length === 0) return false;
        
        // 處理對話性質
        const conversation = processConversation(text);
        
        // 主訴區域的特殊處理
        const chiefComplaintTextarea = textareas['chief_complaint'] || 
                                      document.querySelector('textarea[placeholder*="主訴"]') ||
                                      document.querySelector('textarea[aria-label*="主訴"]');
        
        // 現病史區域的特殊處理
        const hpiTextarea = textareas['history_present_illness'] || 
                           document.querySelector('textarea[placeholder*="現病史"]') ||
                           document.querySelector('textarea[aria-label*="現病史"]');
        
        // 如果是醫生的問題，先不記錄，只分析問題類型以確定下一個回答的分類
        if (conversation.isQuestion) {
            // 記錄這個問題的類型，為下一個回答做準備
            window.lastQuestionCategory = null;
            
            // 計算問題匹配哪個類別
            let highestScore = 0;
            let bestCategory = null;
            
            for (const [category, keywords] of Object.entries(keywordMapping)) {
                let score = 0;
                keywords.forEach(keyword => {
                    if (text.includes(keyword)) {
                        score++;
                    }
                });
                
                if (score > highestScore) {
                    highestScore = score;
                    bestCategory = category;
                }
            }
            
            if (bestCategory && highestScore > 0) {
                console.log(`問題類型: ${bestCategory}，匹配分數: ${highestScore}`);
                window.lastQuestionCategory = bestCategory;
            }
            
            return false; // 不記錄醫生問題
        }
        
        // 處理病人回答
        // 如果有上一個問題類型，優先考慮
        if (window.lastQuestionCategory && textareas[window.lastQuestionCategory]) {
            appendTextToTextarea(textareas[window.lastQuestionCategory], text);
            console.log(`根據上一個問題類型 (${window.lastQuestionCategory}) 記錄回答`);
            window.lastQuestionCategory = null; // 用完後清除
            return true;
        }
                           
        // 如果沒有上一個問題類型，計算匹配分數
        let categoryScores = [];
        
        for (const [category, keywords] of Object.entries(keywordMapping)) {
            let score = 0;
            let matchedKeywords = [];
            
            keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    score += 1;
                    matchedKeywords.push(keyword);
                }
            });
            
            if (score > 0) {
                categoryScores.push({
                    category,
                    score,
                    matchedKeywords
                });
            }
        }
        
        // 根據分數排序
        categoryScores.sort((a, b) => b.score - a.score);
        
        // 如果有匹配的類別
        if (categoryScores.length > 0 && categoryScores[0].score > 0) {
            const bestMatch = categoryScores[0].category;
            const targetTextarea = textareas[bestMatch];
            
            if (targetTextarea) {
                console.log(`匹配回答 "${text.substring(0, 20)}..." 到 ${bestMatch}，匹配關鍵詞: ${categoryScores[0].matchedKeywords.join(', ')}`);
                
                // 添加文本到目標區域
                appendTextToTextarea(targetTextarea, text);
                return true;
            }
        }
        
        // 如果沒有明確匹配，使用默認規則
        if (text.length < 30 && chiefComplaintTextarea && !isSentence) {
            // 短文本優先考慮主訴
            appendTextToTextarea(chiefComplaintTextarea, text);
            return true;
        } else if (hpiTextarea) {
            // 較長文本或句子，優先考慮現病史
            appendTextToTextarea(hpiTextarea, text);
            return true;
        }
        
        return false;
    }
    
    // 向文本區域添加文本
    function appendTextToTextarea(textarea, text) {
        if (!textarea) return;
        
        let currentContent = textarea.value || '';
        
        // 決定如何添加新文本
        if (currentContent === '') {
            // 空欄位，直接添加
            textarea.value = text;
        } else if (currentContent.trim().endsWith('.') || 
                  currentContent.trim().endsWith('。') || 
                  currentContent.trim().endsWith('!') || 
                  currentContent.trim().endsWith('！') || 
                  currentContent.trim().endsWith('?') || 
                  currentContent.trim().endsWith('？')) {
            // 如果當前內容以句號或其他終止符結尾，添加空格後添加新文本
            textarea.value = currentContent + ' ' + text;
        } else {
            // 否則添加分隔符後添加
            textarea.value = currentContent + '。' + text;
        }
        
        // 高亮顯示目標區域
        flashTextarea(textarea);
        
        // 觸發變更事件
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
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
        console.log('語音識別自動結束');
        
        // 如果用戶沒有主動停止，嘗試自動重啟
        if (isRecording) {
            console.log('嘗試自動重啟語音識別');
            stopRecording(true); // 使用我們的自動重啟模式
        }
    }
    
    // 初始化UI
    updateAutoModeUI();
});