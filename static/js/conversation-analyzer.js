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
                keywords: ['主訴', '哪裡不舒服', '感覺怎麼樣', '什麼問題', '什麼症狀', '困擾', '為什麼來看診', '看診原因'],
                symptomKeywords: [
                    '頭痛', '頭暈', '噁心', '嘔吐', '胸悶', '胸痛', '腹痛', '腹瀉', '便秘', '發燒', '咳嗽', 
                    '呼吸困難', '喉嚨痛', '疲勞', '體重減輕', '食慾不振', '多尿', '尿頻', '尿急', '尿痛', 
                    '血尿', '關節痛', '肌肉痛', '皮疹', '搔癢', '視力模糊', '聽力下降', '心悸', '盜汗',
                    '水腫', '痙攣', '麻木', '刺痛', '失眠', '精神不振', '焦慮', '情緒低落'
                ]
            },
            'presentIllness': {
                keywords: ['現病史', '什麼時候開始', '多久了', '病史', '發展過程', '變化', '病程', '發作時間', '持續多久'],
                timeKeywords: ['天前', '週前', '個月前', '年前', '小時前', '分鐘前', '昨天', '今天早上', '上週', '上個月'],
                progressKeywords: ['逐漸加重', '突然發生', '反覆發作', '時好時壞', '惡化', '好轉', '沒有變化']
            },
            'accompaniedSymptoms': {
                keywords: ['伴隨症狀', '同時還有', '同時有無', '是否同時', '一起出現', '還有其他症狀', '相關症狀', '連帶症狀'],
                symptomGroups: {
                    '全身': ['發燒', '畏寒', '冒汗', '乏力', '疲倦', '虛弱', '體重減輕', '體重增加'],
                    '神經系統': ['頭痛', '頭暈', '暈眩', '昏厥', '意識模糊', '注意力不集中', '視力模糊', '複視', '耳鳴', '聽力下降'],
                    '心血管': ['胸痛', '胸悶', '心悸', '心跳加速', '氣短', '呼吸困難', '水腫', '靜脈曲張'],
                    '呼吸系統': ['咳嗽', '咳痰', '咯血', '呼吸困難', '哮喘', '打噴嚏', '鼻塞', '流鼻涕', '喉嚨痛', '聲音嘶啞'],
                    '消化系統': ['食慾不振', '惡心', '嘔吐', '腹痛', '腹瀉', '便秘', '黑便', '血便', '黃疸', '脹氣', '消化不良'],
                    '泌尿系統': ['尿頻', '尿急', '尿痛', '血尿', '尿量減少', '尿量增加', '排尿困難', '尿失禁'],
                    '皮膚': ['皮疹', '紅斑', '水泡', '丘疹', '搔癢', '瘀斑', '紫斑', '脫皮', '黃疸', '蕁麻疹'],
                    '肌肉骨骼': ['關節痛', '肌肉痛', '肌肉無力', '僵硬', '抽筋', '背痛', '頸痛', '腰痛'],
                    '精神神經': ['焦慮', '抑鬱', '失眠', '多夢', '煩躁', '易怒', '記憶力下降', '情緒波動']
                }
            },
            'pastMedicalHistory': {
                keywords: ['過去病史', '以前得過什麼病', '曾經', '之前', '過去有沒有', '慢性病', '舊疾', '長期疾病'],
                diseaseKeywords: ['高血壓', '糖尿病', '心臟病', '肝炎', '肺結核', '哮喘', '腎病', '癌症', '腦中風', '痛風', 
                   '甲狀腺疾病', '自體免疫疾病', '精神疾病', '手術史', '住院史', '外傷史']
            },
            'medications': {
                keywords: ['用藥', '吃什麼藥', '服用', '藥物', '處方', '用藥史', '正在吃的藥', '長期用藥', '藥物治療'],
                medKeywords: ['降壓藥', '降糖藥', '降脂藥', '抗生素', '止痛藥', '激素', '胰島素', '阿司匹林', '抗凝藥', 
                   '抗血小板', '抗抑鬱藥', '抗焦慮藥', '安眠藥', '維生素', '補充劑', '中藥', '保健品']
            },
            'allergies': {
                keywords: ['過敏', '不良反應', '過敏史', '對什麼過敏', '禁忌', '藥物過敏', '食物過敏', '接觸過敏'],
                allergyKeywords: ['青黴素', '磺胺', '海鮮', '花粉', '灰塵', '乳膠', '花生', '貝類', '雞蛋', '牛奶', 
                   '麩質', '大豆', '堅果', '螃蟹', '蝦子', '金屬', '造影劑', 'NSAIDs', '阿司匹林']
            },
            'familyHistory': {
                keywords: ['家族史', '家人', '父母', '兄弟姐妹', '親屬', '遺傳疾病', '家族疾病', '親人健康狀況'],
                relationKeywords: ['父親', '母親', '兄弟', '姐妹', '兒子', '女兒', '爸爸', '媽媽', '祖父', '祖母', 
                   '外公', '外婆', '伯父', '叔叔', '阿姨', '姑姑', '堂兄弟', '表兄弟']
            },
            'socialHistory': {
                keywords: ['社會史', '工作', '職業', '生活習慣', '抽菸', '喝酒', '生活環境', '婚姻狀況', '家庭狀況'],
                habitKeywords: ['吸菸', '抽菸', '喝酒', '飲酒', '運動', '飲食習慣', '作息', '熬夜', '壓力', '工作壓力', 
                   '工作環境', '居住環境', '經濟狀況', '教育程度', '宗教信仰', '娛樂活動']
            },
            'physicalExam': {
                keywords: ['體格檢查', '檢查', '看一下', '聽一下', '檢查發現', '理學檢查', '體檢', 'PE', '請躺下', '深呼吸'],
                examKeywords: ['視診', '聽診', '叩診', '觸診', '腹部檢查', '心臟檢查', '肺部檢查', '神經檢查', 
                   '耳鼻喉檢查', '皮膚檢查', '淋巴結檢查', '關節檢查', '肌肉檢查', '反射', '瞳孔', '眼底'],
                systemExams: {
                    '一般狀況': ['精神狀態', '意識狀態', '體態', '營養狀態', '面容', '皮膚黏膜'],
                    '生命體徵': ['體溫', '脈搏', '呼吸', '血壓', '血氧', '疼痛分數'],
                    '頭頸部': ['頭顱', '顏面', '眼睛', '耳朵', '鼻子', '口腔', '咽部', '甲狀腺', '頸部淋巴結', '頸動脈', '頸靜脈'],
                    '胸部': ['呼吸音', '心音', '心律', '雜音', '乳房', '肋間', '胸廓'],
                    '腹部': ['腸蠕動音', '壓痛', '反跳痛', '肝脾腫大', '移動性濁音', '腹水', '腹部包塊'],
                    '四肢': ['水腫', '脈搏', '肌力', '活動度', '關節', '畸形', '皮膚'],
                    '神經系統': ['意識', '定向力', '腦神經', '感覺', '運動', '協調', '反射', '病理反射']
                }
            },
            'vitalSigns': {
                keywords: ['生命體徵', '體徵', '血壓', '脈搏', '體溫', '呼吸', '測量', '監測'],
                signKeywords: ['血壓', '脈搏', '呼吸', '體溫', '氧飽和度', 'BP', 'HR', 'RR', 'BT', 'SpO2', '心率', '呼吸率']
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
        const speaker = this.analyzeSpeaker(text);
        
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
    }
    
    /**
     * 啟用手動標記說話者的功能 - 使用大按鈕，更容易操作
     */
    enableManualSpeakerToggle() {
        if (document.getElementById('manual-speaker-controls')) return;
        
        // 添加說話者切換按鈕 - 使用更大、更明顯的按鈕
        const container = document.createElement('div');
        container.id = 'manual-speaker-controls';
        container.className = 'position-fixed';
        container.style.bottom = '150px';
        container.style.right = '20px';
        container.style.zIndex = '1039';
        container.innerHTML = `
            <div class="card shadow">
                <div class="card-header py-2 bg-light d-flex justify-content-between align-items-center">
                    <small class="fw-bold">當前說話者</small>
                    <button type="button" class="btn-close btn-sm" id="close-speaker-control"></button>
                </div>
                <div class="card-body p-2">
                    <div class="d-grid gap-2">
                        <button type="button" id="doctor-speaker-btn" class="btn btn-outline-primary btn-lg speaker-btn">
                            <i class="fas fa-user-md me-2"></i> 醫生說話
                        </button>
                        <button type="button" id="patient-speaker-btn" class="btn btn-success btn-lg speaker-btn active">
                            <i class="fas fa-user me-2"></i> 病人說話
                        </button>
                    </div>
                </div>
                <div class="card-footer py-1 bg-light text-center">
                    <small>點擊相應按鈕後說話</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        
        // 關閉控制面板按鈕
        document.getElementById('close-speaker-control').addEventListener('click', () => {
            container.classList.add('d-none');
        });
        
        // 醫生按鈕點擊事件
        const doctorBtn = document.getElementById('doctor-speaker-btn');
        doctorBtn.addEventListener('click', () => {
            this.setActiveSpeaker('doctor');
            doctorBtn.classList.add('active', 'btn-primary');
            doctorBtn.classList.remove('btn-outline-primary');
            
            const patientBtn = document.getElementById('patient-speaker-btn');
            patientBtn.classList.remove('active', 'btn-success');
            patientBtn.classList.add('btn-outline-success');
            
            console.log('當前說話者設置為: 醫生');
        });
        
        // 病人按鈕點擊事件
        const patientBtn = document.getElementById('patient-speaker-btn');
        patientBtn.addEventListener('click', () => {
            this.setActiveSpeaker('patient');
            patientBtn.classList.add('active', 'btn-success');
            patientBtn.classList.remove('btn-outline-success');
            
            const doctorBtn = document.getElementById('doctor-speaker-btn');
            doctorBtn.classList.remove('active', 'btn-primary');
            doctorBtn.classList.add('btn-outline-primary');
            
            console.log('當前說話者設置為: 病人');
        });
        
        // 初始設置為病人 (默認)
        this.currentSpeaker = 'patient';
    }
    
    /**
     * 設置當前活動說話者
     * @param {string} speaker 說話者類型 ('doctor' 或 'patient')
     */
    setActiveSpeaker(speaker) {
        this.currentSpeaker = speaker;
    }
    
    /**
     * 獲取當前手動選擇的說話者
     * @returns {string|null} 說話者類型 ('doctor', 'patient') 或 null
     */
    getManualSpeaker() {
        // 優先使用新的currentSpeaker屬性
        if (this.currentSpeaker) {
            return this.currentSpeaker;
        }
        
        // 返回默認值
        return 'patient';
    }
    
    /**
     * 分析說話者 (醫生還是病人)
     * @param {string} text 對話文本
     * @returns {string} 說話者類型 ('doctor' 或 'patient')
     */
    analyzeSpeaker(text) {
        if (!text) return 'patient'; // 默認
        
        const lowerText = text.toLowerCase();
        
        // 醫生特定術語和專業詞彙
        const medicalTerms = [
            '診斷', '檢查', '病理', '症狀', '藥物', '治療', '劑量', '預後', 
            '轉診', '穿刺', '切片', '造影', '超音波', 'CT', 'MRI', 'X光',
            '胸片', '肺功能', '處方', '副作用', '術前', '術後', '抗生素',
            '抑制劑', '阻斷劑', '免疫', '胃鏡', '腸鏡', '血清', '生化指標'
        ];
        
        // 醫生常用詞和語氣
        const doctorPhrases = [
            '您好', '請問', '能否', '麻煩', '需要', '建議', '應該', '請',
            '讓我', '我們', '必須', '可以', '正常值', '範圍', '標準', '指標',
            '告訴我', '說明一下', '描述一下', '感覺如何', '您有', '您的', '要做', '要服用'
        ];
        
        // 醫生常用問句模式
        const doctorQuestions = [
            /您?(感覺|覺得)怎麼樣/i,
            /您?哪裡不舒服/i,
            /您?有什麼症狀/i,
            /痛(的)?(感覺|程度)(是怎樣|如何)/i,
            /什麼時候(開始|發生)/i,
            /(多久|幾天)了/i,
            /有沒有(吃藥|服藥|用藥|做檢查|看醫生)/i,
            /之前有(沒有)?(類似|這樣|相同)/i,
            /過去有(沒有)?/i,
            /家族中有(沒有)?人/i,
            /您?(平常|平時|最近|經常)/i,
            /需要再(觀察|檢查|服藥)/i,
            /您?(最近|近期)(有沒有)?/i
        ];
        
        // 病人常用表達
        const patientPhrases = [
            '我感覺', '我覺得', '我有', '我的', '我很', '我非常', '我想', 
            '我', '不舒服', '難受', '痛', '疼', '酸', '脹', '麻', '癢', 
            '不適', '不行', '不能', '無法', '沒辦法', '受不了', '我希望', 
            '想請問', '幫我', '希望', '好像', '可能', '有點', '有時候'
        ];
        
        // 病人常見症狀描述
        const symptomDescriptions = [
            '頭痛', '頭暈', '噁心', '嘔吐', '胸悶', '胸痛', '腹痛', '腹瀉', 
            '便秘', '發燒', '咳嗽', '喉嚨痛', '呼吸困難', '疲勞', '全身無力',
            '食慾不振', '睡不好', '睡不著', '失眠', '多尿', '尿頻', '尿急', 
            '尿痛', '血尿', '關節痛', '肌肉痛', '皮疹', '出疹子', '水腫', 
            '起水泡', '發癢', '刺痛', '抽痛', '悶痛', '割痛', '燒灼感'
        ];
        
        // 系統性評分 (而不是簡單計數)
        let doctorScore = 0;
        let patientScore = 0;
        
        // 檢查問句特徵 (極強的醫生指標)
        if (text.includes('?') || text.includes('？')) {
            doctorScore += 5;
        }
        
        // 檢查醫生問診模式
        for (const pattern of doctorQuestions) {
            if (pattern.test(lowerText)) {
                doctorScore += 8; // 非常強的指標
                break;
            }
        }
        
        // 檢查專業醫學術語 (很強的醫生指標)
        for (const term of medicalTerms) {
            if (lowerText.includes(term.toLowerCase())) {
                doctorScore += 3;
            }
        }
        
        // 檢查醫生常用詞和語氣
        for (const phrase of doctorPhrases) {
            if (lowerText.includes(phrase.toLowerCase())) {
                doctorScore += 2;
            }
        }
        
        // 檢查病人常用表達
        for (const phrase of patientPhrases) {
            if (lowerText.includes(phrase.toLowerCase())) {
                patientScore += 2;
            }
        }
        
        // 檢查病人症狀描述 (很強的病人指標)
        for (const symptom of symptomDescriptions) {
            if (lowerText.includes(symptom.toLowerCase())) {
                patientScore += 2.5;
            }
        }
        
        // 字詞長度和結構分析
        // 醫生通常使用較長、結構化的句子
        if (text.length > 25 && text.split(' ').length > 10) {
            doctorScore += 1;
        }
        
        // 分析句式 - 以"您"開頭通常是醫生
        if (lowerText.startsWith('您') || lowerText.startsWith('請您')) {
            doctorScore += 3;
        }
        
        // 分析句式 - 以"我"開頭通常是病人
        if (lowerText.startsWith('我') || lowerText.startsWith('我的') || lowerText.startsWith('我覺得') || lowerText.startsWith('我感覺')) {
            patientScore += 3;
        }
        
        // 考慮對話脈絡 (對話通常是一問一答模式)
        if (this.conversations.length > 0) {
            const lastSpeaker = this.conversations[this.conversations.length - 1].speaker;
            if (lastSpeaker === 'doctor') {
                patientScore += 2; // 醫生說完通常是病人回答
            } else if (lastSpeaker === 'patient') {
                doctorScore += 1.5; // 病人說完可能是醫生提問或回應
            }
        }
        
        console.log(`說話者分析: 醫生得分=${doctorScore}, 病人得分=${patientScore}`);
        
        // 根據分數決定說話者
        if (doctorScore > patientScore + 2) { // 給醫生需要更明確的優勢
            return 'doctor';
        } else if (patientScore >= doctorScore) {
            return 'patient';
        } else {
            // 邊界情況 - 查看上下文或使用默認
            if (this.conversations.length > 0) {
                const lastSpeaker = this.conversations[this.conversations.length - 1].speaker;
                if (lastSpeaker === 'doctor') {
                    return 'patient'; // 對話通常是交替的
                }
            }
            
            // 無法確定時的默認選擇
            return 'patient'; // 默認認為是病人在說話
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
        
        // 初始化各分類空數組
        for (const category in this.classifiers) {
            extractedInfo[category] = [];
        }
        
        // 分離醫生和病人的對話
        const patientSpeeches = this.conversations.filter(item => item.speaker === 'patient');
        const doctorSpeeches = this.conversations.filter(item => item.speaker === 'doctor');
        
        // 從所有對話中提取症狀（無論是醫生還是病人提到的）
        for (const speech of this.conversations) {
            const text = speech.text.toLowerCase();
            
            // 提取特定症狀
            let symptomFound = false;
            
            // 檢查常見主訴症狀
            if (text.includes('發燒') || text.includes('咳嗽') || 
                text.includes('頭痛') || text.includes('喉嚨痛') || 
                text.includes('呼吸困難')) {
                
                // 提取主要症狀
                let mainSymptoms = [];
                if (text.includes('發燒')) mainSymptoms.push('發燒');
                if (text.includes('咳嗽')) mainSymptoms.push('咳嗽');
                if (text.includes('頭痛')) mainSymptoms.push('頭痛');
                if (text.includes('喉嚨痛')) mainSymptoms.push('喉嚨痛');
                if (text.includes('呼吸困難')) mainSymptoms.push('呼吸困難');
                
                // 提取時間信息
                let duration = '';
                if (text.includes('天')) {
                    const matches = text.match(/(\d+)\s*天/);
                    if (matches && matches[1]) {
                        duration = matches[1] + '天';
                    }
                } else if (text.includes('週') || text.includes('星期')) {
                    const matches = text.match(/(\d+)\s*(週|星期)/);
                    if (matches && matches[1]) {
                        duration = matches[1] + matches[2];
                    }
                }
                
                // 構建清晰的主訴
                const cleanChiefComplaint = duration ? 
                    `${mainSymptoms.join('、')}${duration}` : 
                    `${mainSymptoms.join('、')}`;
                
                if (mainSymptoms.length > 0) {
                    extractedInfo.chiefComplaint.push(cleanChiefComplaint);
                    symptomFound = true;
                }
            }
            
            // 胃腸道症狀特別處理到伴隨症狀
            if (text.includes('惡心') || text.includes('嘔吐') || 
                text.includes('腹痛') || text.includes('腹瀉') || 
                text.includes('便秘') || text.includes('胃痛')) {
                
                // 提取實際的症狀作為伴隨症狀
                const symptoms = [];
                if (text.includes('惡心')) symptoms.push('惡心');
                if (text.includes('嘔吐')) symptoms.push('嘔吐');
                if (text.includes('腹痛')) symptoms.push('腹痛');
                if (text.includes('腹瀉')) symptoms.push('腹瀉');
                if (text.includes('便秘')) symptoms.push('便秘');
                if (text.includes('胃痛')) symptoms.push('胃痛');
                
                if (symptoms.length > 0) {
                    extractedInfo.accompaniedSymptoms.push(`伴隨症狀: ${symptoms.join('、')}`);
                    symptomFound = true;
                }
                
                // 如果這是第一句話且尚未設置主訴，將其作為主訴
                if (patientSpeeches.indexOf(speech) === 0 && extractedInfo.chiefComplaint.length === 0) {
                    extractedInfo.chiefComplaint.push(`${symptoms[0]}`);
                }
            }
            
            // 如果已經處理過症狀，跳過下面的通用處理
            if (symptomFound) continue;
            
            // 檢查每個分類的關鍵詞
            let matched = false;
            for (const category in this.classifiers) {
                // 跳過已經匹配的
                if (matched) continue;
                
                const classifier = this.classifiers[category];
                
                // 檢查主要關鍵詞
                for (const keyword of classifier.keywords || []) {
                    if (text.includes(keyword.toLowerCase())) {
                        extractedInfo[category].push(speech.text);
                        matched = true;
                        break;
                    }
                }
                
                // 檢查特定子類別關鍵詞
                if (!matched) {
                    for (const subField in classifier) {
                        if (subField === 'keywords') continue;
                        
                        // 處理數組類型的關鍵詞
                        if (Array.isArray(classifier[subField])) {
                            for (const keyword of classifier[subField]) {
                                if (text.includes(keyword.toLowerCase())) {
                                    extractedInfo[category].push(speech.text);
                                    matched = true;
                                    break;
                                }
                            }
                        }
                        // 處理對象類型的關鍵詞（如symptomGroups）
                        else if (typeof classifier[subField] === 'object') {
                            for (const group in classifier[subField]) {
                                for (const keyword of classifier[subField][group] || []) {
                                    if (text.includes(keyword.toLowerCase())) {
                                        extractedInfo[category].push(speech.text);
                                        matched = true;
                                        break;
                                    }
                                }
                                if (matched) break;
                            }
                        }
                        
                        if (matched) break;
                    }
                }
            }
        }
        
        // 處理醫生的提問和病人的回答
        const qaInfos = this.extractQuestionAnswerPairs();
        
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
        
        // 定義欄位映射表 - 將分析器類別名稱映射到表單欄位ID
        const fieldMapping = {
            'chiefComplaint': 'chief_complaint',
            'presentIllness': 'history_present_illness',
            'accompaniedSymptoms': 'physical_examination', // 伴隨症狀暫時和體格檢查共用欄位
            'pastMedicalHistory': 'past_medical_history',
            'medications': 'medications',
            'allergies': 'allergies',
            'familyHistory': 'family_history',
            'socialHistory': 'social_history',
            'physicalExam': 'physical_examination',
            'vitalSigns': 'vital_signs'
        };
        
        categoryContents.forEach(textarea => {
            const category = textarea.getAttribute('data-category');
            const content = textarea.value;
            
            if (category && content) {
                // 使用映射表找到對應的表單欄位ID
                const fieldId = fieldMapping[category] || category;
                
                // 根據映射後的ID找到表單元素
                const formTextarea = document.getElementById(fieldId);
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
                    
                    console.log(`成功將內容添加到 ${fieldId}`);
                } else {
                    console.warn(`找不到ID為 ${fieldId} 的表單元素`);
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