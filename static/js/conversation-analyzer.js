/**
 * 對話分析器 - 用於醫患對話的分析與分類
 * 
 * 功能：
 * 1. 記錄完整對話
 * 2. 分析對話中的關鍵資訊
 * 3. 將資訊分類到正確的病例欄位
 */

class ConversationAnalyzer {
    constructor() {
        // 初始化對話記錄
        this.conversations = [];
        // 當前狀態
        this.isActive = false;
        // 對話記錄區域
        this.dialogContainer = null;
        // 關鍵資訊區域
        this.keyInfoContainer = null;
        // 按鈕參考
        this.analyzeButton = null;
        // 分析完成的回調
        this.onAnalysisComplete = null;
        
        // 分類器參數
        this.classifiers = {
            'chiefComplaint': {
                keywords: ['主訴', '哪裡不舒服', '感覺怎麼樣', '什麼問題', '什麼症狀', '困擾'],
                symptomKeywords: [
                    '頭痛', '頭暈', '噁心', '嘔吐', '胸悶', '胸痛', '腹痛', '腹瀉', '便秘', '發燒', '咳嗽', 
                    '呼吸困難', '喉嚨痛', '疲勞', '體重減輕', '食慾不振', '多尿', '尿頻', '尿急', '尿痛', 
                    '血尿', '關節痛', '肌肉痛', '皮疹', '搔癢', '視力模糊', '聽力下降', '心悸', '盜汗',
                    '水腫', '痙攣', '麻木', '刺痛', '失眠', '精神不振', '焦慮', '情緒低落'
                ]
            },
            'presentIllness': {
                keywords: ['現病史', '什麼時候開始', '多久了', '病史', '發展過程', '變化'],
                timeKeywords: ['天前', '週前', '個月前', '年前', '小時前', '分鐘前', '昨天', '今天早上', '上週', '上個月']
            },
            'pastMedicalHistory': {
                keywords: ['過去病史', '以前得過什麼病', '曾經', '之前', '過去有沒有', '慢性病'],
                diseaseKeywords: ['高血壓', '糖尿病', '心臟病', '肝炎', '肺結核', '哮喘', '腎病', '癌症', '腦中風', '痛風']
            },
            'medications': {
                keywords: ['用藥', '吃什麼藥', '服用', '藥物', '處方'],
                medKeywords: ['降壓藥', '降糖藥', '降脂藥', '抗生素', '止痛藥', '激素', '胰島素', '阿司匹林']
            },
            'allergies': {
                keywords: ['過敏', '不良反應', '過敏史', '對什麼過敏', '禁忌'],
                allergyKeywords: ['青黴素', '磺胺', '海鮮', '花粉', '灰塵', '乳膠', '花生', '貝類']
            },
            'familyHistory': {
                keywords: ['家族史', '家人', '父母', '兄弟姐妹', '親屬'],
                relationKeywords: ['父親', '母親', '兄弟', '姐妹', '兒子', '女兒', '爸爸', '媽媽', '祖父', '祖母']
            },
            'socialHistory': {
                keywords: ['社會史', '工作', '職業', '生活習慣', '抽菸', '喝酒'],
                habitKeywords: ['吸菸', '抽菸', '喝酒', '飲酒', '運動', '飲食習慣', '作息', '熬夜', '壓力']
            },
            'physicalExam': {
                keywords: ['體格檢查', '檢查', '看一下', '聽一下', '檢查發現'],
                examKeywords: ['視診', '聽診', '叩診', '觸診', '腹部檢查', '心臟檢查', '肺部檢查', '神經檢查']
            },
            'vitalSigns': {
                keywords: ['生命體徵', '體徵', '血壓', '脈搏', '體溫', '呼吸'],
                signKeywords: ['血壓', '脈搏', '呼吸', '體溫', '氧飽和度', 'BP', 'HR', 'RR', 'BT', 'SpO2']
            }
        };
    }
    
    /**
     * 初始化對話分析器
     */
    initialize() {
        // 創建必要的UI元素
        this.createUI();
        
        // 添加事件監聽器
        this.setupListeners();
        
        console.log('對話分析器初始化完成');
    }
    
    /**
     * 創建用戶界面元素
     */
    createUI() {
        // 創建對話記錄區域 (浮動在頁面側邊)
        this.dialogContainer = document.getElementById('conversation-container');
        if (!this.dialogContainer) {
            this.dialogContainer = document.createElement('div');
            this.dialogContainer.id = 'conversation-container';
            this.dialogContainer.className = 'card position-fixed top-0 end-0 m-3 conversation-sidebar d-none';
            this.dialogContainer.style.width = '320px';
            this.dialogContainer.style.maxHeight = '80vh';
            this.dialogContainer.style.overflow = 'auto';
            this.dialogContainer.style.zIndex = '1040';
            this.dialogContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
            
            // 標題和控制按鈕
            this.dialogContainer.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">對話記錄</h5>
                    <div>
                        <button id="analyze-conversation-btn" class="btn btn-sm btn-primary" title="分析對話">
                            <i class="fas fa-brain"></i> 分析
                        </button>
                        <button id="clear-conversation-btn" class="btn btn-sm btn-outline-secondary" title="清空對話">
                            <i class="fas fa-eraser"></i>
                        </button>
                        <button id="close-conversation-btn" class="btn btn-sm btn-outline-danger" title="關閉">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div id="conversation-list" class="list-group list-group-flush"></div>
                </div>
                <div class="card-footer text-muted small">
                    點擊「分析」按鈕將對話轉換為病例
                </div>
            `;
            
            document.body.appendChild(this.dialogContainer);
            
            // 為控制按鈕添加事件
            document.getElementById('analyze-conversation-btn').addEventListener('click', () => this.analyzeConversation());
            document.getElementById('clear-conversation-btn').addEventListener('click', () => this.clearConversation());
            document.getElementById('close-conversation-btn').addEventListener('click', () => this.toggleVisibility(false));
        }
        
        // 創建分析結果區域 (彈出模態框)
        this.keyInfoContainer = document.getElementById('key-info-modal');
        if (!this.keyInfoContainer) {
            this.keyInfoContainer = document.createElement('div');
            this.keyInfoContainer.id = 'key-info-modal';
            this.keyInfoContainer.className = 'modal fade';
            this.keyInfoContainer.tabIndex = '-1';
            this.keyInfoContainer.setAttribute('aria-hidden', 'true');
            
            this.keyInfoContainer.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">對話關鍵資訊</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="analysis-info" class="mb-3">
                                <div class="alert alert-info">
                                    系統已分析對話並識別以下關鍵資訊。請查看並確認。
                                </div>
                            </div>
                            <div id="extracted-info"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" id="apply-analysis-btn" class="btn btn-primary">套用到病例</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.keyInfoContainer);
            
            // 為確認按鈕添加事件
            document.getElementById('apply-analysis-btn').addEventListener('click', () => {
                this.applyAnalysisResults();
                const modal = bootstrap.Modal.getInstance(this.keyInfoContainer);
                if (modal) modal.hide();
            });
        }
        
        // 創建聊天浮動按鈕
        const chatButton = document.getElementById('conversation-toggle-btn');
        if (!chatButton) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'position-fixed';
            buttonContainer.style.bottom = '85px';
            buttonContainer.style.right = '20px';
            buttonContainer.style.zIndex = '1039';
            
            const btn = document.createElement('button');
            btn.id = 'conversation-toggle-btn';
            btn.className = 'btn btn-primary rounded-circle d-flex align-items-center justify-content-center';
            btn.style.width = '50px';
            btn.style.height = '50px';
            btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            btn.title = '查看對話記錄';
            btn.innerHTML = '<i class="fas fa-comments"></i>';
            
            buttonContainer.appendChild(btn);
            document.body.appendChild(buttonContainer);
            
            // 為按鈕添加事件
            btn.addEventListener('click', () => this.toggleVisibility());
        }
    }
    
    /**
     * 設置事件監聽器
     */
    setupListeners() {
        // 監聽語音系統的事件
        document.addEventListener('voice-recognition-result', (event) => {
            if (event.detail && event.detail.text) {
                this.addConversation(event.detail.text, event.detail.isFinal || true);
            }
        });
    }
    
    /**
     * 開始記錄對話
     */
    start() {
        this.isActive = true;
        this.conversations = [];
        this.toggleVisibility(true);
        console.log('開始記錄對話');
    }
    
    /**
     * 停止記錄對話
     */
    stop() {
        this.isActive = false;
        console.log('停止記錄對話');
    }
    
    /**
     * 添加對話內容
     * @param {string} text 對話文本
     * @param {string} [manualSpeaker] 手動指定的說話者 ('doctor' 或 'patient')
     * @param {boolean} isFinal 是否是最終結果
     */
    addConversation(text, manualSpeaker = null, isFinal = true) {
        if (!this.isActive || !text || text.trim() === '') return;
        
        // 使用手動指定的說話者或自動分析
        const speaker = manualSpeaker || this.analyzeSpeaker(text);
        
        console.log(`添加${speaker}對話: "${text}"`);
        
        // 添加到對話列表
        this.conversations.push({
            text: text,
            timestamp: new Date(),
            speaker: speaker,
            isFinal: isFinal
        });
        
        // 更新UI
        this.updateConversationUI();
        
        // 啟用語音按鈕上的手動標記功能
        this.enableManualSpeakerToggle();
    }
    
    /**
     * 啟用手動標記說話者的功能
     */
    enableManualSpeakerToggle() {
        if (document.getElementById('manual-speaker-controls')) return;
        
        // 添加說話者切換按鈕
        const container = document.createElement('div');
        container.id = 'manual-speaker-controls';
        container.className = 'position-fixed';
        container.style.bottom = '150px';
        container.style.right = '20px';
        container.style.zIndex = '1039';
        container.innerHTML = `
            <div class="card shadow-sm">
                <div class="card-header py-1 px-3 bg-light">
                    <small>選擇說話者</small>
                </div>
                <div class="card-body py-2 px-3">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="speaker" id="doctor-speaker" value="doctor">
                        <label class="form-check-label" for="doctor-speaker">
                            <i class="fas fa-user-md text-primary"></i> 醫生
                        </label>
                    </div>
                    <div class="form-check form-check-inline">
                        <input class="form-check-input" type="radio" name="speaker" id="patient-speaker" value="patient" checked>
                        <label class="form-check-label" for="patient-speaker">
                            <i class="fas fa-user text-success"></i> 病人
                        </label>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // 添加事件處理
        const doctorRadio = document.getElementById('doctor-speaker');
        const patientRadio = document.getElementById('patient-speaker');
        
        if (doctorRadio) {
            doctorRadio.addEventListener('change', () => {
                console.log('說話者設置為: 醫生');
            });
        }
        
        if (patientRadio) {
            patientRadio.addEventListener('change', () => {
                console.log('說話者設置為: 病人');
            });
        }
    }
    
    /**
     * 獲取當前手動選擇的說話者
     * @returns {string|null} 說話者類型 ('doctor', 'patient') 或 null
     */
    getManualSpeaker() {
        const doctorRadio = document.getElementById('doctor-speaker');
        const patientRadio = document.getElementById('patient-speaker');
        
        if (doctorRadio && doctorRadio.checked) return 'doctor';
        if (patientRadio && patientRadio.checked) return 'patient';
        
        return null;
    }
    
    /**
     * 分析說話者 (醫生還是病人)
     * @param {string} text 對話文本
     * @returns {string} 說話者類型 ('doctor' 或 'patient')
     */
    analyzeSpeaker(text) {
        const lowerText = text.toLowerCase();
        
        // 醫生常用語言模式
        const doctorPatterns = [
            /您好/i, /請問/i, /有什麼不舒服/i, /哪裡不舒服/i, /什麼時候開始/i, 
            /多久了/i, /需要做/i, /建議您/i, /您需要/i, /您應該/i, /醫生/i,
            /告訴我/i, /疼痛程度/i, /吃過藥/i, /做過檢查/i, /之前有過/i,
            /家族史/i, /過敏史/i, /用藥史/i, /既往史/i
        ];
        
        // 病人常用語言模式
        const patientPatterns = [
            /我感覺/i, /我覺得/i, /我有/i, /不舒服/i, /痛/i, /疼/i, /不適/i, 
            /難受/i, /頭暈/i, /噁心/i, /嘔吐/i, /發燒/i, /咳嗽/i, /腹瀉/i, 
            /我是/i, /大概/i, /可能/i, /沒有/i, /有一點/i, /患者/i, /病人/i
        ];
        
        // 檢測是否是醫生的提問
        let isDoctorSpeaking = false;
        for (const pattern of doctorPatterns) {
            if (pattern.test(lowerText)) {
                isDoctorSpeaking = true;
                break;
            }
        }
        
        // 檢測是否是病人的回答
        let isPatientSpeaking = false;
        for (const pattern of patientPatterns) {
            if (pattern.test(lowerText)) {
                isPatientSpeaking = true;
                break;
            }
        }
        
        // 如果醫生特徵明顯，或者有問號但無病人特徵
        if ((isDoctorSpeaking && !isPatientSpeaking) || 
            ((text.includes('?') || text.includes('？')) && !isPatientSpeaking)) {
            return 'doctor';
        } 
        // 如果病人特徵明顯
        else if (isPatientSpeaking && !isDoctorSpeaking) {
            return 'patient';
        }
        // 無法確定，根據上下文或默認
        else {
            // 如果對話歷史有內容，檢查最後一句是否是醫生說的，如果是，這句可能是病人回答
            if (this.conversations.length > 0) {
                const lastSpeaker = this.conversations[this.conversations.length - 1].speaker;
                if (lastSpeaker === 'doctor') {
                    return 'patient';
                }
            }
            // 默認為病人
            return 'patient';
        }
    }
    
    /**
     * 更新對話UI
     */
    updateConversationUI() {
        const conversationList = document.getElementById('conversation-list');
        if (!conversationList) return;
        
        // 清空現有內容
        conversationList.innerHTML = '';
        
        // 添加對話內容
        this.conversations.forEach((item, index) => {
            const isDoctor = item.speaker === 'doctor';
            const element = document.createElement('div');
            element.className = `list-group-item ${isDoctor ? 'bg-light' : ''}`;
            element.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${isDoctor ? '醫生' : '病人'}</h6>
                    <small class="text-muted">${this.formatTime(item.timestamp)}</small>
                </div>
                <p class="mb-1">${item.text}</p>
            `;
            conversationList.appendChild(element);
        });
        
        // 滾動到底部
        conversationList.scrollTop = conversationList.scrollHeight;
    }
    
    /**
     * 格式化時間
     * @param {Date} date 時間對象
     * @returns {string} 格式化後的時間字符串
     */
    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
    
    /**
     * 切換對話面板可見性
     * @param {boolean} [show] 是否顯示，不提供則切換當前狀態
     */
    toggleVisibility(show) {
        if (this.dialogContainer) {
            if (show === undefined) {
                this.dialogContainer.classList.toggle('d-none');
            } else if (show) {
                this.dialogContainer.classList.remove('d-none');
            } else {
                this.dialogContainer.classList.add('d-none');
            }
        }
    }
    
    /**
     * 清空對話
     */
    clearConversation() {
        this.conversations = [];
        this.updateConversationUI();
        console.log('清空對話記錄');
    }
    
    /**
     * 分析對話內容
     */
    analyzeConversation() {
        if (this.conversations.length === 0) {
            alert('沒有對話記錄可分析');
            return;
        }
        
        console.log('開始分析對話...');
        
        // 提取每個分類的資訊
        const extractedInfo = {};
        
        // 先獲取病人主訴（僅限病人說的話）
        const patientSpeeches = this.conversations.filter(item => item.speaker === 'patient');
        
        // 對每個分類進行分析
        for (const category in this.classifiers) {
            extractedInfo[category] = this.extractInfoForCategory(category, patientSpeeches);
        }
        
        // 尋找問答對 (醫生提問後病人的回答)
        const qaInfos = this.extractQuestionAnswerPairs();
        for (const qa of qaInfos) {
            const category = this.categorizeQA(qa);
            if (category && !extractedInfo[category]) {
                extractedInfo[category] = [];
            }
            if (category) {
                extractedInfo[category].push(qa.answer.text);
            }
        }
        
        // 顯示分析結果
        this.showAnalysisResults(extractedInfo);
        
        console.log('對話分析完成', extractedInfo);
    }
    
    /**
     * 從對話中提取問答對
     * @returns {Array} 問答對數組
     */
    extractQuestionAnswerPairs() {
        const pairs = [];
        
        for (let i = 0; i < this.conversations.length - 1; i++) {
            const current = this.conversations[i];
            const next = this.conversations[i + 1];
            
            // 如果當前是醫生提問，下一個是病人回答
            if (current.speaker === 'doctor' && next.speaker === 'patient') {
                pairs.push({
                    question: current,
                    answer: next
                });
            }
        }
        
        return pairs;
    }
    
    /**
     * 對問答對進行分類
     * @param {Object} qa 問答對
     * @returns {string|null} 分類或null
     */
    categorizeQA(qa) {
        const question = qa.question.text.toLowerCase();
        
        // 檢查每個分類的關鍵詞
        for (const category in this.classifiers) {
            for (const keyword of this.classifiers[category].keywords) {
                if (question.includes(keyword.toLowerCase())) {
                    return category;
                }
            }
        }
        
        // 特殊情況處理
        if (question.includes('不舒服') || question.includes('症狀')) {
            return 'chiefComplaint';
        }
        
        if (question.includes('多久') || question.includes('時候') || question.includes('開始')) {
            return 'presentIllness';
        }
        
        if (question.includes('藥') || question.includes('服用')) {
            return 'medications';
        }
        
        if (question.includes('過敏')) {
            return 'allergies';
        }
        
        // 沒有找到匹配的分類
        return null;
    }
    
    /**
     * 為特定分類提取資訊
     * @param {string} category 分類名稱
     * @param {Array} speeches 對話數組
     * @returns {Array} 提取的資訊
     */
    extractInfoForCategory(category, speeches) {
        const result = [];
        const config = this.classifiers[category];
        
        // 檢查每句話
        for (const speech of speeches) {
            const text = speech.text.toLowerCase();
            let matched = false;
            
            // 檢查分類關鍵詞
            for (const keyword of config.keywords) {
                if (text.includes(keyword.toLowerCase())) {
                    result.push(speech.text);
                    matched = true;
                    break;
                }
            }
            
            // 如果還沒匹配，檢查特定關鍵詞
            if (!matched) {
                for (const key in config) {
                    if (key !== 'keywords' && Array.isArray(config[key])) {
                        for (const specificKeyword of config[key]) {
                            if (text.includes(specificKeyword.toLowerCase())) {
                                result.push(speech.text);
                                matched = true;
                                break;
                            }
                        }
                        if (matched) break;
                    }
                }
            }
        }
        
        return result;
    }
    
    /**
     * 顯示分析結果
     * @param {Object} extractedInfo 提取的信息
     */
    showAnalysisResults(extractedInfo) {
        // 獲取結果容器
        const container = document.getElementById('extracted-info');
        if (!container) return;
        
        // 清空現有內容
        container.innerHTML = '';
        
        // 結果計數
        let itemCount = 0;
        
        // 分類標題映射
        const categoryTitles = {
            'chiefComplaint': '主訴',
            'presentIllness': '現病史',
            'pastMedicalHistory': '過去病史',
            'medications': '用藥史',
            'allergies': '過敏史',
            'familyHistory': '家族史',
            'socialHistory': '社會史',
            'physicalExam': '體格檢查',
            'vitalSigns': '生命體徵'
        };
        
        // 添加每個分類的資訊
        for (const category in extractedInfo) {
            const items = extractedInfo[category];
            if (items && items.length > 0) {
                itemCount += items.length;
                
                const section = document.createElement('div');
                section.className = 'mb-3';
                
                // 標題
                const title = document.createElement('h6');
                title.textContent = categoryTitles[category] || category;
                section.appendChild(title);
                
                // 內容
                const content = document.createElement('div');
                content.className = 'card';
                
                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';
                
                const textarea = document.createElement('textarea');
                textarea.className = 'form-control category-content';
                textarea.setAttribute('data-category', category);
                textarea.rows = Math.min(items.length + 1, 5);
                textarea.value = items.join('\n');
                
                cardBody.appendChild(textarea);
                content.appendChild(cardBody);
                section.appendChild(content);
                
                container.appendChild(section);
            }
        }
        
        // 如果沒有找到任何有用資訊
        if (itemCount === 0) {
            container.innerHTML = '<div class="alert alert-warning">未找到有用的關鍵資訊，請檢查對話內容。</div>';
        }
        
        // 顯示模態框
        const modal = new bootstrap.Modal(this.keyInfoContainer);
        modal.show();
    }
    
    /**
     * 套用分析結果到表單
     */
    applyAnalysisResults() {
        // 獲取所有分類結果
        const categoryContents = document.querySelectorAll('.category-content');
        
        categoryContents.forEach(textarea => {
            const category = textarea.getAttribute('data-category');
            const content = textarea.value;
            
            if (category && content) {
                // 根據分類找到對應表單元素
                const formTextarea = document.getElementById(category);
                if (formTextarea) {
                    // 添加內容
                    if (formTextarea.value) {
                        formTextarea.value += '\n\n' + content;
                    } else {
                        formTextarea.value = content;
                    }
                    
                    // 視覺反饋
                    formTextarea.classList.add('flash-effect');
                    setTimeout(() => {
                        formTextarea.classList.remove('flash-effect');
                    }, 1000);
                    
                    console.log(`成功將內容添加到 ${category}`);
                } else {
                    console.warn(`找不到ID為 ${category} 的表單元素`);
                }
            }
        });
        
        // 如果有回調，執行
        if (typeof this.onAnalysisComplete === 'function') {
            this.onAnalysisComplete();
        }
        
        console.log('分析結果已應用到表單');
    }
    
    /**
     * 設置分析完成的回調
     * @param {Function} callback 回調函數
     */
    setAnalysisCompleteCallback(callback) {
        this.onAnalysisComplete = callback;
    }
}

// 初始化對話分析器
document.addEventListener('DOMContentLoaded', function() {
    // 創建分析器實例
    window.conversationAnalyzer = new ConversationAnalyzer();
    window.conversationAnalyzer.initialize();
    
    // 自動啟動記錄
    setTimeout(() => {
        if (window.conversationAnalyzer) {
            window.conversationAnalyzer.start();
        }
    }, 1000);
    
    console.log('對話分析器已加載');
});