/**
 * 智能醫療語音識別與自動歸類系統
 * 
 * 功能：
 * 1. 啟用語音輸入，轉換為文字
 * 2. 連接到對話分析器，將語音內容歸類到對應欄位
 * 3. 支持手動指定當前說話者（醫生或病人）
 * 4. 適配移動設備操作
 */

class MedicalVoiceSystem {
    constructor() {
        // 語音識別
        this.recognition = null;
        this.isListening = false;
        this.currentField = null;
        this.interimResult = '';
        this.currentLanguage = 'zh-TW'; // 預設繁體中文
        
        // 支援的語言與文化背景設定
        this.supportedLanguages = {
            'zh-TW': { 
                name: '繁體中文 (台灣)',
                culturalContext: 'taiwanese',
                symptomTerms: {
                    fever: ['發燒', '發熱'],
                    cough: ['咳嗽', '久咳'],
                    headache: ['頭痛', '頭痠'],
                    nausea: ['噁心', '想吐'],
                    vomit: ['嘔吐', '吐']
                },
                culturalPhrases: {
                    greetings: ['您好', '早安', '午安', '晚安'],
                    polite: ['請問', '麻煩', '不好意思', '謝謝'],
                    familyTerms: ['阿公', '阿嬤', '家人', '親戚']
                },
                culturalContextRules: {
                    formalAddressing: true,  // 使用尊稱
                    indirectExpression: true, // 間接表達不適
                    communityReference: true  // 提及家庭/群體
                }
            },
            'zh-CN': { 
                name: '简体中文 (中国大陆)',
                culturalContext: 'mainland',
                symptomTerms: {
                    fever: ['发烧', '发热'],
                    cough: ['咳嗽', '干咳', '湿咳'],
                    headache: ['头痛', '头晕'],
                    nausea: ['恶心', '想吐'],
                    vomit: ['呕吐', '吐了']
                },
                culturalPhrases: {
                    greetings: ['你好', '早上好', '下午好', '晚上好'],
                    polite: ['请问', '麻烦', '不好意思', '谢谢'],
                    familyTerms: ['爷爷', '奶奶', '家里人', '亲戚']
                },
                culturalContextRules: {
                    formalAddressing: true,
                    indirectExpression: true,
                    communityReference: true
                }
            },
            'en-US': { 
                name: 'English (US)',
                culturalContext: 'western',
                symptomTerms: {
                    fever: ['fever', 'temperature', 'hot'],
                    cough: ['cough', 'coughing'],
                    headache: ['headache', 'migraine'],
                    nausea: ['nausea', 'queasy'],
                    vomit: ['vomit', 'throw up', 'vomiting']
                },
                culturalPhrases: {
                    greetings: ['hello', 'hi', 'good morning', 'good afternoon'],
                    polite: ['please', 'excuse me', 'thank you', 'sorry'],
                    familyTerms: ['grandfather', 'grandmother', 'family', 'relatives']
                },
                culturalContextRules: {
                    formalAddressing: false, // 較少使用尊稱
                    indirectExpression: false, // 直接表達症狀
                    communityReference: false // 較少提及家庭/群體
                }
            }
        };
        
        // 參考對話分析器
        this.analyzer = null;
        
        // 語音按鈕和指示器
        this.voiceButtons = {};
        this.statusIndicator = null;
        
        // 設置常量
        this.BUTTON_SIZE = 48; // 語音按鈕大小(px)
        this.STATUS_COLORS = {
            ready: '#28a745',    // 綠色
            listening: '#dc3545', // 紅色
            processing: '#ffc107', // 黃色
            error: '#6c757d'      // 灰色
        };
    }
    
    /**
     * 初始化語音系統
     */
    initialize() {
        // 檢查瀏覽器兼容性
        if (!this.checkBrowserSupport()) {
            console.error('您的瀏覽器不支持語音識別功能');
            return false;
        }
        
        // 創建語音識別實例
        this.setupRecognition();
        
        // 添加語音按鈕到表單欄位
        this.addVoiceButtonsToFields();
        
        // 創建全局語音控制按鈕
        this.createGlobalVoiceControls();
        
        // 初始化對話分析器連接
        this.connectToAnalyzer();
        
        console.log('醫療語音系統初始化完成');
        return true;
    }
    
    /**
     * 檢查瀏覽器是否支持語音識別
     */
    checkBrowserSupport() {
        window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        return !!window.SpeechRecognition;
    }
    
    /**
     * 設置語音識別實例
     */
    setLanguage(langCode) {
        if (this.supportedLanguages[langCode]) {
            console.log(`切換語言為: ${this.supportedLanguages[langCode].name}`);
            this.currentLanguage = langCode;
            
            // 如果語音識別已初始化，則更新語言設定
            if (this.recognition) {
                this.recognition.lang = langCode;
            }
            
            // 如果有連接到分析器，則傳遞文化背景設定
            if (this.analyzer) {
                this.analyzer.setCulturalContext(
                    this.supportedLanguages[langCode].culturalContext,
                    this.supportedLanguages[langCode].symptomTerms,
                    this.supportedLanguages[langCode].culturalContextRules
                );
                console.log(`已更新文化背景設定: ${this.supportedLanguages[langCode].culturalContext}`);
            }
            
            // 顯示設定已更新的通知
            const notification = document.createElement('div');
            notification.className = 'toast show position-fixed';
            notification.style.bottom = '90px';
            notification.style.right = '20px';
            notification.style.zIndex = '1060';
            notification.innerHTML = `
                <div class="toast-header">
                    <strong class="me-auto">語言設定已更新</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    已切換至 ${this.supportedLanguages[langCode].name}
                </div>
            `;
            document.body.appendChild(notification);
            
            // 3秒後自動移除通知
            setTimeout(() => {
                notification.remove();
            }, 3000);
        } else {
            console.error(`不支援的語言: ${langCode}`);
        }
    }
    
    setupRecognition() {
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        // 配置參數 - 調整以提高連續對話的效能
        this.recognition.continuous = true;     // 持續聆聽
        this.recognition.interimResults = true; // 顯示臨時結果
        this.recognition.maxAlternatives = 1;   // 返回最佳結果
        this.recognition.lang = this.currentLanguage; // 語言設定
        
        // 以下設定優化連續對話功能
        if (this.recognition.continuous === undefined) {
            this.recognition.continuous = true;
        }
        
        // 避免太快結束識別
        this.recognition.interimResults = true;
        
        // 增加停頓靈敏度 (如果平台支援)
        if (typeof this.recognition.speechRecognitionList !== 'undefined') {
            const speechRecognitionList = new SpeechGrammarList();
            this.recognition.grammars = speechRecognitionList;
        }
        
        // 處理事件
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatusUI('listening');
            console.log('語音識別開始');
            
            // 通知對話分析器開始工作
            if (this.analyzer) this.analyzer.start();
        };
        
        this.recognition.onend = () => {
            console.log('語音識別結束事件觸發');
            
            // 如果需要保持連續識別，自動重啟
            if (this.autoRestart) {
                console.log('自動重啟語音識別');
                try {
                    // 延遲100毫秒後重啟，避免過快重啟造成的問題
                    setTimeout(() => {
                        if (this.autoRestart) { // 再次檢查，以防在延遲期間被取消
                            this.recognition.start();
                        }
                    }, 100);
                    return; // 不更新狀態，因為我們立即重啟了
                } catch (error) {
                    console.error('自動重啟語音識別失敗:', error);
                }
            }
            
            // 只有真正結束時才更新狀態
            this.isListening = false;
            this.updateStatusUI('ready');
            console.log('語音識別停止');
        };
        
        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            // 處理所有結果
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                    console.log('獲得最終結果: ' + transcript);
                    
                    // 發送事件給對話分析器進行自動分析
                    const resultEvent = new CustomEvent('voice-recognition-result', {
                        detail: {
                            text: transcript,
                            isFinal: true
                        }
                    });
                    document.dispatchEvent(resultEvent);
                    
                    // 如果直接設置了欄位，也更新到該欄位
                    if (this.currentField) {
                        const textarea = document.getElementById(this.currentField);
                        if (textarea) {
                            if (textarea.value) {
                                textarea.value += ' ' + transcript;
                            } else {
                                textarea.value = transcript;
                            }
                        }
                    }
                } else {
                    interimTranscript += transcript;
                }
            }
            
            // 更新臨時結果
            this.interimResult = interimTranscript;
            
            // 更新指示器
            if (interimTranscript) {
                this.updateStatusUI('processing', interimTranscript);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('語音識別錯誤: ' + event.error);
            this.updateStatusUI('error', event.error);
            
            // 重大錯誤時通知頁面
            if (['network', 'service-not-allowed', 'aborted'].includes(event.error)) {
                this.showVoiceError(event.error);
            }
        };
    }
    
    /**
     * 添加語音按鈕到所有相關表單欄位
     */
    addVoiceButtonsToFields() {
        // 表單欄位映射到對話分析器類別
        const fieldMapping = {
            'chief_complaint': 'chiefComplaint',
            'history_present_illness': 'presentIllness',
            'accompanied_symptoms': 'accompaniedSymptoms',
            'past_medical_history': 'pastMedicalHistory',
            'medications': 'medications',
            'allergies': 'allergies',
            'family_history': 'familyHistory',
            'social_history': 'socialHistory',
            'physical_examination': 'physicalExam',
            'vital_signs': 'vitalSigns'
        };
        
        // 為每個欄位添加語音按鈕
        for (const [fieldId, category] of Object.entries(fieldMapping)) {
            const field = document.getElementById(fieldId);
            if (field) {
                // 創建語音按鈕
                const button = this.createVoiceButton(fieldId, category);
                
                // 將按鈕添加到欄位容器中
                const container = field.parentElement;
                
                // 檢查欄位下是否已存在按鈕組
                let buttonGroup = container.querySelector('.voice-button-group');
                if (!buttonGroup) {
                    buttonGroup = document.createElement('div');
                    buttonGroup.className = 'voice-button-group d-flex mt-1';
                    container.appendChild(buttonGroup);
                }
                
                buttonGroup.appendChild(button);
                
                // 存儲按鈕引用
                this.voiceButtons[fieldId] = button;
            }
        }
    }
    
    /**
     * 為特定欄位創建語音按鈕
     * @param {string} fieldId 欄位ID
     * @param {string} category 對應的分類
     * @returns {HTMLElement} 語音按鈕元素
     */
    createVoiceButton(fieldId, category) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-outline-primary voice-button me-1';
        button.dataset.field = fieldId;
        button.dataset.category = category;
        
        // 添加麥克風圖標
        button.innerHTML = '<i class="fas fa-microphone"></i>';
        
        // 添加標題提示
        button.title = `語音輸入到 ${this.getFieldLabel(fieldId)}`;
        
        // 點擊事件
        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleVoiceInput(fieldId, category);
        });
        
        return button;
    }
    
    /**
     * 獲取欄位標籤文字
     * @param {string} fieldId 欄位ID
     * @returns {string} 欄位標籤
     */
    getFieldLabel(fieldId) {
        const label = document.querySelector(`label[for="${fieldId}"]`);
        return label ? label.textContent.trim() : fieldId;
    }
    
    /**
     * 切換語音輸入狀態
     * @param {string} fieldId 欄位ID
     * @param {string} category 分類類別
     */
    toggleVoiceInput(fieldId, category) {
        // 如果選擇了當前已激活的欄位，則停止語音
        if (this.isListening && this.currentField === fieldId) {
            this.stopVoiceInput();
            return;
        }
        
        // 如果有其他欄位激活，先停止
        if (this.isListening) {
            this.stopVoiceInput();
        }
        
        // 設置當前欄位
        this.currentField = fieldId;
        
        // 更新按鈕視覺效果
        this.updateButtonUI(fieldId, true);
        
        // 開始語音識別
        this.startVoiceInput();
        
        console.log(`開始語音輸入到 ${this.getFieldLabel(fieldId)} (${category})`);
    }
    
    /**
     * 開始語音輸入
     */
    startVoiceInput() {
        if (!this.isListening) {
            try {
                this.recognition.start();
                // 顯示狀態指示器
                this.createOrUpdateStatusIndicator();
            } catch (error) {
                console.error('啟動語音識別失敗: ', error);
                this.updateStatusUI('error');
            }
        }
    }
    
    /**
     * 停止語音輸入
     * @param {boolean} analyze 是否自動分析對話
     */
    stopVoiceInput(analyze = false) {
        if (this.isListening) {
            this.recognition.stop();
            
            // 重設按鈕視覺效果
            if (this.currentField) {
                this.updateButtonUI(this.currentField, false);
            }
            
            this.currentField = null;
            this.autoRestart = false;
            
            // 如果需要自動分析
            if (analyze && this.analyzer) {
                // 延遲500毫秒後分析，確保所有語音都被處理
                setTimeout(() => {
                    // 自動點擊分析按鈕
                    const analyzeButton = document.getElementById('analyze-conversation-btn');
                    if (analyzeButton) {
                        console.log('自動分析對話');
                        analyzeButton.click();
                    } else {
                        // 直接調用分析方法
                        console.log('直接調用分析方法');
                        this.analyzer.analyzeConversation();
                    }
                }, 500);
            }
        }
    }
    
    /**
     * 更新按鈕UI
     * @param {string} fieldId 欄位ID
     * @param {boolean} isActive 是否激活
     */
    updateButtonUI(fieldId, isActive) {
        // 重設所有按鈕
        for (const [id, button] of Object.entries(this.voiceButtons)) {
            button.classList.remove('btn-danger');
            button.classList.add('btn-outline-primary');
            
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-microphone';
            }
        }
        
        // 設置當前按鈕
        if (isActive && this.voiceButtons[fieldId]) {
            const button = this.voiceButtons[fieldId];
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-danger');
            
            const icon = button.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-microphone-slash';
            }
        }
    }
    
    /**
     * 創建或更新語音狀態指示器
     * @param {string} status 狀態
     * @param {string} text 顯示文字
     */
    createOrUpdateStatusIndicator() {
        if (!this.statusIndicator) {
            // 創建浮動狀態指示器
            this.statusIndicator = document.createElement('div');
            this.statusIndicator.id = 'voice-status-indicator';
            this.statusIndicator.className = 'card position-fixed';
            this.statusIndicator.style.bottom = '20px';
            this.statusIndicator.style.left = '50%';
            this.statusIndicator.style.transform = 'translateX(-50%)';
            this.statusIndicator.style.zIndex = '1050';
            this.statusIndicator.style.minWidth = '300px';
            this.statusIndicator.style.maxWidth = '90%';
            this.statusIndicator.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
            
            this.statusIndicator.innerHTML = `
                <div class="card-body p-2">
                    <div class="d-flex align-items-center">
                        <div id="voice-status-dot" class="me-2" style="
                            width: 12px;
                            height: 12px;
                            border-radius: 50%;
                            background-color: ${this.STATUS_COLORS.ready};
                        "></div>
                        <div class="flex-grow-1">
                            <div id="voice-status-text" class="small">準備中...</div>
                            <div id="voice-interim-result" class="text-muted" style="
                                font-size: 0.8rem;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                max-width: 100%;
                            "></div>
                        </div>
                        <button id="voice-stop-button" class="btn btn-sm btn-outline-danger ms-2">
                            <i class="fas fa-stop"></i>
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.statusIndicator);
            
            // 添加停止按鈕事件
            document.getElementById('voice-stop-button').addEventListener('click', () => {
                this.stopVoiceInput();
            });
        }
        
        // 顯示指示器
        this.statusIndicator.classList.remove('d-none');
        
        // 更新狀態
        this.updateStatusUI('ready');
    }
    
    /**
     * 更新狀態UI
     * @param {string} status 狀態
     * @param {string} text 顯示文字
     */
    updateStatusUI(status, text) {
        if (!this.statusIndicator) return;
        
        const statusDot = document.getElementById('voice-status-dot');
        const statusText = document.getElementById('voice-status-text');
        const interimResult = document.getElementById('voice-interim-result');
        
        // 更新狀態點顏色
        if (statusDot) {
            statusDot.style.backgroundColor = this.STATUS_COLORS[status] || this.STATUS_COLORS.ready;
        }
        
        // 更新狀態文字
        if (statusText) {
            let textContent = '準備中...';
            
            switch (status) {
                case 'ready':
                    textContent = '語音識別已就緒';
                    break;
                case 'listening':
                    textContent = '正在聆聽...';
                    if (this.currentField) {
                        textContent += ` (${this.getFieldLabel(this.currentField)})`;
                    }
                    break;
                case 'processing':
                    textContent = '處理中...';
                    break;
                case 'error':
                    textContent = `錯誤: ${text || '未知錯誤'}`;
                    break;
                default:
                    textContent = '語音識別系統';
            }
            
            statusText.textContent = textContent;
        }
        
        // 更新臨時結果
        if (interimResult) {
            interimResult.textContent = text || this.interimResult || '';
        }
        
        // 如果停止狀態，1秒後隱藏指示器
        if (status === 'ready' && !this.isListening) {
            setTimeout(() => {
                if (this.statusIndicator && !this.isListening) {
                    this.statusIndicator.classList.add('d-none');
                }
            }, 1000);
        }
    }
    
    /**
     * 創建全局語音控制按鈕
     */
    createGlobalVoiceControls() {
        // 創建浮動按鈕容器
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'position-fixed d-flex flex-column align-items-end';
        buttonContainer.style.bottom = '20px';
        buttonContainer.style.right = '20px';
        buttonContainer.style.zIndex = '1040';
        
        // 創建語言選擇器容器
        const langContainer = document.createElement('div');
        langContainer.className = 'language-selector mb-2 d-flex';
        langContainer.style.borderRadius = '20px';
        langContainer.style.background = 'rgba(0,0,0,0.1)';
        langContainer.style.padding = '4px';
        
        // 創建語言切換按鈕
        Object.keys(this.supportedLanguages).forEach(langCode => {
            const langInfo = this.supportedLanguages[langCode];
            const langButton = document.createElement('button');
            langButton.className = `btn btn-sm ${this.currentLanguage === langCode ? 'btn-primary' : 'btn-outline-secondary'}`;
            langButton.textContent = langCode.split('-')[0].toUpperCase();
            langButton.title = langInfo.name;
            langButton.style.marginRight = '4px';
            langButton.style.borderRadius = '18px';
            langButton.setAttribute('data-lang', langCode);
            
            langButton.addEventListener('click', () => {
                this.setLanguage(langCode);
                
                // 更新所有語言按鈕樣式
                document.querySelectorAll('[data-lang]').forEach(btn => {
                    if (btn.getAttribute('data-lang') === langCode) {
                        btn.className = 'btn btn-sm btn-primary';
                    } else {
                        btn.className = 'btn btn-sm btn-outline-secondary';
                    }
                });
            });
            
            langContainer.appendChild(langButton);
        });
        
        // 主語音按鈕
        const mainButton = document.createElement('button');
        mainButton.id = 'global-voice-button';
        mainButton.className = 'btn btn-primary rounded-circle d-flex align-items-center justify-content-center';
        mainButton.style.width = '60px';
        mainButton.style.height = '60px';
        mainButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        mainButton.title = '開始智能語音輸入';
        mainButton.innerHTML = '<i class="fas fa-microphone fa-lg"></i>';
        
        buttonContainer.appendChild(langContainer);
        buttonContainer.appendChild(mainButton);
        document.body.appendChild(buttonContainer);
        
        // 添加點擊事件
        mainButton.addEventListener('click', () => {
            if (this.isListening) {
                // 停止錄音並自動分析對話
                this.stopVoiceInput(true);
                mainButton.querySelector('i').className = 'fas fa-microphone fa-lg';
                mainButton.classList.remove('btn-danger');
                mainButton.classList.add('btn-primary');
            } else {
                // 啟動智能語音模式
                this.startSmartVoiceMode();
                mainButton.querySelector('i').className = 'fas fa-microphone-slash fa-lg';
                mainButton.classList.remove('btn-primary');
                mainButton.classList.add('btn-danger');
            }
        });
    }
    
    /**
     * 啟動智能語音模式 - 使用對話分析器自動歸類
     */
    startSmartVoiceMode() {
        // 確保對話分析器已連接
        if (!this.analyzer) {
            this.connectToAnalyzer();
        }
        
        // 設置為智能模式
        this.currentField = null;
        this.autoRestart = true;
        
        // 顯示對話窗口
        if (this.analyzer) {
            this.analyzer.toggleVisibility(true);
        }
        
        // 創建或更新語音狀態提示
        this.createOrUpdateSmartModeIndicator();
        
        // 開始語音識別
        this.startVoiceInput();
        
        console.log('啟動智能語音模式');
    }
    
    /**
     * 創建智能模式指示器 - 顯示正在聽取對話的提示
     */
    createOrUpdateSmartModeIndicator() {
        // 創建提示框
        if (!document.getElementById('smart-mode-indicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'smart-mode-indicator';
            indicator.className = 'alert alert-info position-fixed d-flex align-items-center';
            indicator.style.bottom = '85px';
            indicator.style.left = '20px';
            indicator.style.zIndex = '1040';
            indicator.style.maxWidth = '80%';
            indicator.style.opacity = '0.9';
            indicator.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            
            indicator.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="me-2 position-relative" style="width:24px;height:24px;">
                        <span class="position-absolute top-0 start-0 bg-danger rounded-circle" 
                              style="width:8px;height:8px;animation:pulse 1.5s infinite;"></span>
                        <i class="fas fa-microphone text-primary fs-5"></i>
                    </div>
                    <div>
                        <div class="fw-bold">醫療對話分析進行中</div>
                        <div class="small">系統正在聆聽並自動分類您的對話內容</div>
                    </div>
                </div>
                <button type="button" class="btn-close ms-auto" id="close-smart-indicator"></button>
            `;
            
            // 添加樣式
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(indicator);
            
            // 關閉按鈕事件
            document.getElementById('close-smart-indicator').addEventListener('click', () => {
                indicator.remove();
            });
        }
    }
    
    /**
     * 連接到對話分析器
     */
    connectToAnalyzer() {
        // 檢查是否已有對話分析器實例
        if (window.conversationAnalyzer) {
            this.analyzer = window.conversationAnalyzer;
            console.log('已連接到現有對話分析器');
        } else {
            // 創建新的對話分析器
            try {
                this.analyzer = new ConversationAnalyzer();
                this.analyzer.initialize();
                window.conversationAnalyzer = this.analyzer;
                console.log('已創建並初始化對話分析器');
            } catch (error) {
                console.error('連接到對話分析器失敗: ', error);
                this.analyzer = null;
            }
        }
    }
    
    /**
     * 顯示語音錯誤訊息
     * @param {string} error 錯誤訊息
     */
    showVoiceError(error) {
        let errorMessage = '語音識別發生錯誤';
        
        switch (error) {
            case 'network':
                errorMessage = '網絡連接錯誤，語音識別無法使用';
                break;
            case 'service-not-allowed':
                errorMessage = '語音服務不可用，請確認瀏覽器權限設置';
                break;
            case 'aborted':
                errorMessage = '語音識別被中斷';
                break;
            case 'no-speech':
                errorMessage = '未檢測到語音';
                break;
            case 'not-allowed':
                errorMessage = '麥克風訪問被拒絕，請檢查瀏覽器權限設置';
                break;
            default:
                errorMessage = `語音識別錯誤: ${error}`;
        }
        
        // 使用Bootstrap的toast或alert顯示錯誤
        const errorToast = document.createElement('div');
        errorToast.className = 'toast position-fixed top-0 end-0 m-3';
        errorToast.setAttribute('role', 'alert');
        errorToast.setAttribute('aria-live', 'assertive');
        errorToast.setAttribute('aria-atomic', 'true');
        errorToast.style.zIndex = '1060';
        
        errorToast.innerHTML = `
            <div class="toast-header bg-danger text-white">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong class="me-auto">語音識別錯誤</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${errorMessage}
            </div>
        `;
        
        document.body.appendChild(errorToast);
        
        // 顯示toast
        const toast = new bootstrap.Toast(errorToast, { autohide: true, delay: 5000 });
        toast.show();
        
        // 監聽關閉事件移除DOM元素
        errorToast.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(errorToast);
        });
    }
}

// 在頁面載入完成後初始化語音系統
document.addEventListener('DOMContentLoaded', () => {
    // 檢查是否在醫療表單頁面
    if (document.getElementById('caseGeneratorForm') || 
        document.querySelector('form[action*="generate_case"]') ||
        document.getElementById('chief_complaint') ||
        document.getElementById('medical-case-view')) {
        
        console.log('醫療表單頁面已加載，初始化語音系統');
        
        // 創建並初始化醫療語音系統
        const voiceSystem = new MedicalVoiceSystem();
        if (voiceSystem.initialize()) {
            // 存儲為全局變量以便調試和頁面內調用
            window.medicalVoiceSystem = voiceSystem;
        }
    } else {
        console.log('非醫療表單頁面，不初始化語音系統');
    }
});

// 添加語音按鈕的CSS樣式
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .voice-button-group {
            flex-wrap: wrap;
            margin-bottom: 0.5rem;
        }
        
        .voice-button {
            width: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 0.25rem;
            margin-bottom: 0.25rem;
        }
        
        /* 閃爍效果 */
        @keyframes flash-green {
            0% { background-color: rgba(40, 167, 69, 0.2); }
            50% { background-color: rgba(40, 167, 69, 0.5); }
            100% { background-color: transparent; }
        }
        
        .flash-effect {
            animation: flash-green 1s ease-out;
        }
    `;
    document.head.appendChild(style);
});