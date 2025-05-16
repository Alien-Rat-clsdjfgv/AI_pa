/**
 * 簡化版醫療語音輸入系統
 * 專注於可靠性和穩定性
 */

document.addEventListener('DOMContentLoaded', function() {
    // 檢查瀏覽器支持
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('您的瀏覽器不支持語音識別功能');
        return;
    }

    // UI 元素
    let voiceButton;
    let statusDisplay;
    let conversationPanel;
    let speakerToggle;
    
    // 語音識別變量
    let recognition;
    let isRecording = false;
    let currentSpeaker = 'patient'; // 默認為病人
    
    // 對話存儲
    const conversations = [];
    
    // 初始化
    function initialize() {
        createUI();
        setupListeners();
        setupRecognition();
        console.log('簡化版語音系統初始化完成');
    }
    
    // 創建基本UI
    function createUI() {
        // 主按鈕
        voiceButton = document.createElement('button');
        voiceButton.id = 'simple-voice-button';
        voiceButton.className = 'btn btn-primary position-fixed';
        voiceButton.style.bottom = '20px';
        voiceButton.style.right = '20px';
        voiceButton.style.width = '60px';
        voiceButton.style.height = '60px';
        voiceButton.style.borderRadius = '50%';
        voiceButton.style.zIndex = '1000';
        voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
        document.body.appendChild(voiceButton);
        
        // 狀態顯示
        statusDisplay = document.createElement('div');
        statusDisplay.id = 'voice-status';
        statusDisplay.className = 'badge bg-secondary position-fixed d-none';
        statusDisplay.style.bottom = '85px';
        statusDisplay.style.right = '20px';
        statusDisplay.style.zIndex = '1000';
        statusDisplay.textContent = '準備就緒';
        document.body.appendChild(statusDisplay);
        
        // 說話者切換
        speakerToggle = document.createElement('div');
        speakerToggle.id = 'speaker-toggle';
        speakerToggle.className = 'btn-group position-fixed d-none';
        speakerToggle.style.bottom = '85px';
        speakerToggle.style.right = '85px';
        speakerToggle.style.zIndex = '1000';
        speakerToggle.innerHTML = `
            <button type="button" class="btn btn-sm btn-outline-primary" data-speaker="doctor">
                <i class="fas fa-user-md"></i> 醫生
            </button>
            <button type="button" class="btn btn-sm btn-success" data-speaker="patient">
                <i class="fas fa-user"></i> 病人
            </button>
        `;
        document.body.appendChild(speakerToggle);
        
        // 對話面板
        conversationPanel = document.createElement('div');
        conversationPanel.id = 'conversation-panel';
        conversationPanel.className = 'card position-fixed d-none';
        conversationPanel.style.top = '20px';
        conversationPanel.style.right = '20px';
        conversationPanel.style.width = '300px';
        conversationPanel.style.maxHeight = '80%';
        conversationPanel.style.overflow = 'auto';
        conversationPanel.style.zIndex = '999';
        conversationPanel.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">對話記錄</h6>
                <div>
                    <button id="clear-conversation" class="btn btn-sm btn-outline-secondary">
                        <i class="fas fa-eraser"></i>
                    </button>
                    <button id="close-conversation" class="btn btn-sm btn-outline-danger">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="card-body p-0">
                <div id="conversations-list" class="list-group list-group-flush">
                    <div class="list-group-item text-center text-muted">
                        <small>目前沒有對話記錄</small>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button id="analyze-conversation" class="btn btn-sm btn-primary w-100">
                    <i class="fas fa-brain"></i> 分析與填入
                </button>
            </div>
        `;
        document.body.appendChild(conversationPanel);
        
        // 添加必要的CSS樣式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(0.95); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
                100% { transform: scale(0.95); opacity: 1; }
            }
            .recording {
                animation: pulse 1.5s infinite;
                background-color: #dc3545 !important;
            }
            .flash {
                animation: flash 0.5s;
            }
            @keyframes flash {
                0% { background-color: rgba(255, 193, 7, 0.2); }
                100% { background-color: transparent; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 設置事件監聽
    function setupListeners() {
        // 語音按鈕點擊事件
        voiceButton.addEventListener('click', toggleRecording);
        
        // 切換說話者
        speakerToggle.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function() {
                const speaker = this.getAttribute('data-speaker');
                setSpeaker(speaker);
            });
        });
        
        // 清空對話
        document.getElementById('clear-conversation').addEventListener('click', clearConversations);
        
        // 關閉對話面板
        document.getElementById('close-conversation').addEventListener('click', function() {
            conversationPanel.classList.add('d-none');
        });
        
        // 分析對話
        document.getElementById('analyze-conversation').addEventListener('click', analyzeConversations);
    }
    
    // 設置語音識別
    function setupRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'zh-TW';
        
        // 設置事件處理器
        recognition.onresult = handleResult;
        recognition.onerror = handleError;
        recognition.onend = handleEnd;
    }
    
    // 切換錄音狀態
    function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }
    
    // 開始錄音
    function startRecording() {
        try {
            recognition.start();
            isRecording = true;
            
            // 更新UI
            voiceButton.classList.add('recording');
            voiceButton.innerHTML = '<i class="fas fa-stop"></i>';
            
            statusDisplay.textContent = '正在聆聽...';
            statusDisplay.classList.remove('d-none', 'bg-secondary');
            statusDisplay.classList.add('bg-danger');
            
            speakerToggle.classList.remove('d-none');
            conversationPanel.classList.remove('d-none');
            
            console.log('語音識別已啟動');
        } catch (e) {
            console.error('啟動語音識別失敗:', e);
            // 重置狀態
            isRecording = false;
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
            
            statusDisplay.textContent = '已停止';
            statusDisplay.classList.remove('bg-danger');
            statusDisplay.classList.add('bg-secondary');
            
            speakerToggle.classList.add('d-none');
            
            setTimeout(() => {
                statusDisplay.classList.add('d-none');
            }, 2000);
            
            console.log('語音識別已停止');
        } catch (e) {
            console.error('停止語音識別失敗:', e);
        }
    }
    
    // 設置當前說話者
    function setSpeaker(speaker) {
        currentSpeaker = speaker;
        
        // 更新UI
        const doctorBtn = speakerToggle.querySelector('[data-speaker="doctor"]');
        const patientBtn = speakerToggle.querySelector('[data-speaker="patient"]');
        
        if (speaker === 'doctor') {
            doctorBtn.classList.remove('btn-outline-primary');
            doctorBtn.classList.add('btn-primary');
            
            patientBtn.classList.remove('btn-success');
            patientBtn.classList.add('btn-outline-success');
        } else {
            doctorBtn.classList.remove('btn-primary');
            doctorBtn.classList.add('btn-outline-primary');
            
            patientBtn.classList.remove('btn-outline-success');
            patientBtn.classList.add('btn-success');
        }
        
        console.log('當前說話者設為:', speaker);
    }
    
    // 處理語音識別結果
    function handleResult(event) {
        const results = event.results;
        const lastResult = results[results.length - 1];
        const transcript = lastResult[0].transcript.trim();
        
        if (lastResult.isFinal && transcript) {
            console.log('識別結果:', transcript);
            
            // 顯示中間結果以提供即時反饋
            statusDisplay.textContent = `識別: "${transcript.substring(0, 30)}${transcript.length > 30 ? '...' : ''}"`;
            
            // 添加到對話記錄
            addConversation(transcript, currentSpeaker);
            
            // 提供一些視覺反饋
            statusDisplay.classList.add('bg-success');
            setTimeout(() => {
                statusDisplay.classList.remove('bg-success');
                statusDisplay.classList.add('bg-danger');
                statusDisplay.textContent = '正在聆聽...';
            }, 1000);
        }
    }
    
    // 處理語音識別錯誤
    function handleError(event) {
        console.error('語音識別錯誤:', event.error);
        
        if (event.error === 'no-speech') {
            statusDisplay.textContent = '未檢測到語音';
        } else if (event.error === 'audio-capture') {
            statusDisplay.textContent = '無法訪問麥克風';
            stopRecording();
        } else if (event.error === 'not-allowed') {
            statusDisplay.textContent = '麥克風訪問被拒絕';
            stopRecording();
        }
    }
    
    // 處理語音識別結束
    function handleEnd() {
        console.log('語音識別自動結束');
        
        // 如果仍在錄音狀態，嘗試重新啟動
        if (isRecording) {
            try {
                recognition.start();
                console.log('語音識別已重新啟動');
            } catch (e) {
                console.error('重新啟動語音識別失敗:', e);
                // 如果重啟失敗，重置狀態
                isRecording = false;
                voiceButton.classList.remove('recording');
                voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
            }
        }
    }
    
    // 添加對話
    function addConversation(text, speaker) {
        // 保存對話記錄
        const conversation = {
            text: text,
            speaker: speaker,
            timestamp: new Date()
        };
        
        conversations.push(conversation);
        updateConversationsUI();
    }
    
    // 更新對話UI
    function updateConversationsUI() {
        const list = document.getElementById('conversations-list');
        
        // 清空當前內容
        list.innerHTML = '';
        
        if (conversations.length === 0) {
            list.innerHTML = `
                <div class="list-group-item text-center text-muted">
                    <small>目前沒有對話記錄</small>
                </div>
            `;
            return;
        }
        
        // 添加對話項目
        conversations.forEach((item, index) => {
            const element = document.createElement('div');
            element.className = 'list-group-item';
            
            // 根據說話者設置不同的樣式
            if (item.speaker === 'doctor') {
                element.classList.add('bg-light');
            }
            
            const time = formatTime(item.timestamp);
            
            element.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge ${item.speaker === 'doctor' ? 'bg-primary' : 'bg-success'}">
                        ${item.speaker === 'doctor' ? '醫生' : '病人'}
                    </span>
                    <small class="text-muted">${time}</small>
                </div>
                <p class="mb-0">${item.text}</p>
            `;
            
            list.appendChild(element);
        });
        
        // 滾動到底部
        conversationPanel.scrollTop = conversationPanel.scrollHeight;
    }
    
    // 格式化時間
    function formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
    
    // 清空對話
    function clearConversations() {
        conversations.length = 0;
        updateConversationsUI();
        console.log('對話記錄已清空');
    }
    
    // 分析對話
    function analyzeConversations() {
        if (conversations.length === 0) {
            alert('沒有對話內容可分析');
            return;
        }
        
        console.log('分析對話內容...');
        
        // 按說話者分類對話
        const doctorSpeeches = conversations.filter(item => item.speaker === 'doctor')
            .map(item => item.text);
        
        const patientSpeeches = conversations.filter(item => item.speaker === 'patient')
            .map(item => item.text);
        
        // 分類結果存儲
        const classifiedContent = {
            // 主訴
            chiefComplaint: extractChiefComplaint(patientSpeeches),
            // 現病史
            presentIllness: extractPresentIllness(patientSpeeches, doctorSpeeches),
            // 過去病史
            pastMedicalHistory: extractPastHistory(patientSpeeches, doctorSpeeches),
            // 藥物史
            medications: extractMedications(patientSpeeches, doctorSpeeches),
            // 過敏史
            allergies: extractAllergies(patientSpeeches, doctorSpeeches)
        };
        
        // 顯示分析結果
        showAnalysisResults(classifiedContent);
    }
    
    // 提取主訴
    function extractChiefComplaint(patientSpeeches) {
        // 尋找包含症狀詞的句子
        const symptomKeywords = [
            '頭痛', '頭暈', '噁心', '嘔吐', '胸悶', '胸痛', '腹痛', '腹瀉', '便秘', 
            '咳嗽', '咳痰', '呼吸困難', '喉嚨痛', '發燒', '發熱', '疼痛', '痛', 
            '不適', '不舒服', '難受', '住院'
        ];
        
        // 主訴通常是病人說的第一句話，所以優先考慮前幾句話
        const prioritySpeeches = patientSpeeches.slice(0, Math.min(3, patientSpeeches.length));
        
        // 尋找最可能的主訴
        for (const speech of prioritySpeeches) {
            // 如果直接包含"主訴"關鍵詞
            if (speech.includes('主訴')) {
                return speech;
            }
            
            // 檢查是否包含症狀關鍵詞
            for (const keyword of symptomKeywords) {
                if (speech.includes(keyword)) {
                    // 檢查這個句子是否簡短明了
                    if (speech.length < 50) {
                        return speech;
                    } else {
                        // 如果句子太長，嘗試提取包含關鍵詞的片段
                        const keywordIndex = speech.indexOf(keyword);
                        const start = Math.max(0, keywordIndex - 10);
                        const end = Math.min(speech.length, keywordIndex + keyword.length + 20);
                        return speech.substring(start, end);
                    }
                }
            }
        }
        
        // 如果沒有找到明確的主訴，使用第一句病人的描述的前30個字符
        if (patientSpeeches.length > 0) {
            const firstSpeech = patientSpeeches[0];
            return firstSpeech.length > 30 ? firstSpeech.substring(0, 30) + "..." : firstSpeech;
        }
        
        return '';
    }
    
    // 提取現病史
    function extractPresentIllness(patientSpeeches, doctorSpeeches) {
        const relevantSpeeches = [];
        
        // 查找醫生問關於現病史的問題
        const historyQuestions = doctorSpeeches.filter(speech => 
            speech.includes('什麼時候') || 
            speech.includes('多久了') || 
            speech.includes('怎麼發生的') ||
            speech.includes('開始的') ||
            speech.includes('病史')
        );
        
        // 如果有相關提問，找到可能的回答
        if (historyQuestions.length > 0) {
            // 簡單的方法：假設問題之後的病人回答是對應的現病史
            const questionIndices = [];
            doctorSpeeches.forEach((speech, index) => {
                if (historyQuestions.includes(speech)) {
                    questionIndices.push(index);
                }
            });
            
            // 獲取問題之後的回答
            questionIndices.forEach(index => {
                if (index < patientSpeeches.length - 1) {
                    relevantSpeeches.push(patientSpeeches[index + 1]);
                }
            });
        }
        
        // 查找包含時間關鍵詞的病人描述
        const timeKeywords = ['天前', '週前', '星期前', '月前', '年前', '昨天', '今天', '早上', '下午', '晚上'];
        patientSpeeches.forEach(speech => {
            for (const keyword of timeKeywords) {
                if (speech.includes(keyword) && !relevantSpeeches.includes(speech)) {
                    relevantSpeeches.push(speech);
                    break;
                }
            }
        });
        
        return relevantSpeeches.join('\n');
    }
    
    // 提取過去病史
    function extractPastHistory(patientSpeeches, doctorSpeeches) {
        const relevantSpeeches = [];
        
        // 查找醫生問關於過去病史的問題
        const pastHistoryQuestions = doctorSpeeches.filter(speech => 
            speech.includes('過去病史') || 
            speech.includes('以前得過什麼病') || 
            speech.includes('慢性病') ||
            speech.includes('曾經')
        );
        
        // 尋找相關回答
        if (pastHistoryQuestions.length > 0) {
            // 獲取問題索引
            const questionIndices = [];
            doctorSpeeches.forEach((speech, index) => {
                if (pastHistoryQuestions.includes(speech)) {
                    questionIndices.push(index);
                }
            });
            
            // 獲取問題之後的回答
            questionIndices.forEach(index => {
                if (index < patientSpeeches.length - 1) {
                    relevantSpeeches.push(patientSpeeches[index + 1]);
                }
            });
        }
        
        // 查找包含過去病史關鍵詞的病人描述
        const pastHistoryKeywords = ['高血壓', '糖尿病', '心臟病', '手術', '住院', '曾經', '過去'];
        patientSpeeches.forEach(speech => {
            for (const keyword of pastHistoryKeywords) {
                if (speech.includes(keyword) && !relevantSpeeches.includes(speech)) {
                    relevantSpeeches.push(speech);
                    break;
                }
            }
        });
        
        return relevantSpeeches.join('\n');
    }
    
    // 提取藥物史
    function extractMedications(patientSpeeches, doctorSpeeches) {
        const relevantSpeeches = [];
        
        // 查找醫生問關於藥物的問題
        const medicationQuestions = doctorSpeeches.filter(speech => 
            speech.includes('吃什麼藥') || 
            speech.includes('服用') || 
            speech.includes('用藥') ||
            speech.includes('藥物史')
        );
        
        // 尋找相關回答
        if (medicationQuestions.length > 0) {
            // 獲取問題索引
            const questionIndices = [];
            doctorSpeeches.forEach((speech, index) => {
                if (medicationQuestions.includes(speech)) {
                    questionIndices.push(index);
                }
            });
            
            // 獲取問題之後的回答
            questionIndices.forEach(index => {
                if (index < patientSpeeches.length - 1) {
                    relevantSpeeches.push(patientSpeeches[index + 1]);
                }
            });
        }
        
        // 查找包含藥物關鍵詞的病人描述
        const medicationKeywords = ['藥', '吃', '服用', '用', '治療', '降壓', '降糖'];
        patientSpeeches.forEach(speech => {
            for (const keyword of medicationKeywords) {
                if (speech.includes(keyword) && !relevantSpeeches.includes(speech)) {
                    relevantSpeeches.push(speech);
                    break;
                }
            }
        });
        
        return relevantSpeeches.join('\n');
    }
    
    // 提取過敏史
    function extractAllergies(patientSpeeches, doctorSpeeches) {
        const relevantSpeeches = [];
        
        // 查找醫生問關於過敏的問題
        const allergyQuestions = doctorSpeeches.filter(speech => 
            speech.includes('過敏') || 
            speech.includes('不良反應') || 
            speech.includes('藥物過敏')
        );
        
        // 尋找相關回答
        if (allergyQuestions.length > 0) {
            // 獲取問題索引
            const questionIndices = [];
            doctorSpeeches.forEach((speech, index) => {
                if (allergyQuestions.includes(speech)) {
                    questionIndices.push(index);
                }
            });
            
            // 獲取問題之後的回答
            questionIndices.forEach(index => {
                if (index < patientSpeeches.length - 1) {
                    relevantSpeeches.push(patientSpeeches[index + 1]);
                }
            });
        }
        
        // 查找包含過敏關鍵詞的病人描述
        const allergyKeywords = ['過敏', '不適', '反應', '藥物反應'];
        patientSpeeches.forEach(speech => {
            for (const keyword of allergyKeywords) {
                if (speech.includes(keyword) && !relevantSpeeches.includes(speech)) {
                    relevantSpeeches.push(speech);
                    break;
                }
            }
        });
        
        // 如果沒找到任何過敏相關信息，默認為"否認藥物過敏史"
        if (relevantSpeeches.length === 0) {
            return "否認藥物過敏史";
        }
        
        return relevantSpeeches.join('\n');
    }
    
    // 顯示分析結果
    function showAnalysisResults(results) {
        // 創建模態框
        const modalId = 'analysis-results-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.tabIndex = '-1';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">對話分析結果</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-info mb-3">
                                系統已分析對話並提取以下信息。請審覽並確認。
                            </div>
                            <div id="analysis-content"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" id="apply-results-btn" class="btn btn-primary">套用到病例</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // 填充內容
        const contentContainer = document.getElementById('analysis-content');
        contentContainer.innerHTML = '';
        
        const categories = [
            { id: 'chiefComplaint', title: '主訴' },
            { id: 'presentIllness', title: '現病史' },
            { id: 'pastMedicalHistory', title: '過去病史' },
            { id: 'medications', title: '用藥史' },
            { id: 'allergies', title: '過敏史' }
        ];
        
        categories.forEach(category => {
            if (results[category.id]) {
                const section = document.createElement('div');
                section.className = 'mb-3';
                section.innerHTML = `
                    <h6>${category.title}</h6>
                    <div class="card">
                        <div class="card-body">
                            <textarea class="form-control category-content" data-category="${category.id}" rows="3">${results[category.id]}</textarea>
                        </div>
                    </div>
                `;
                contentContainer.appendChild(section);
            }
        });
        
        // 應用結果按鈕事件
        document.getElementById('apply-results-btn').addEventListener('click', function() {
            applyResults();
            const modalInstance = bootstrap.Modal.getInstance(modal);
            modalInstance.hide();
        });
        
        // 顯示模態框
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    }
    
    // 應用分析結果到表單
    function applyResults() {
        const textareas = document.querySelectorAll('.category-content');
        
        // 映射類別ID到表單字段ID
        const categoryToFieldMapping = {
            'chiefComplaint': 'chief_complaint',
            'presentIllness': 'history_present_illness',
            'pastMedicalHistory': 'past_medical_history',
            'medications': 'medications',
            'allergies': 'allergies',
            'physical_examination': 'physical_examination'
        };
        
        textareas.forEach(textarea => {
            const category = textarea.getAttribute('data-category');
            const content = textarea.value;
            
            if (category && content) {
                // 使用映射獲取正確的表單字段ID
                const fieldId = categoryToFieldMapping[category] || category;
                
                // 尋找對應的表單字段
                const formField = document.getElementById(fieldId);
                if (formField) {
                    // 添加到現有內容
                    if (formField.value) {
                        formField.value += '\n\n' + content;
                    } else {
                        formField.value = content;
                    }
                    
                    // 視覺反饋
                    formField.classList.add('flash');
                    setTimeout(() => {
                        formField.classList.remove('flash');
                    }, 500);
                    
                    // 在控制台記錄，以幫助調試
                    console.log(`將內容添加到 ${fieldId}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);
                } else {
                    console.warn(`找不到字段: ${fieldId} 對應於類別 ${category}`);
                }
            }
        });
        
        console.log('分析結果已應用到表單');
    }
    
    // 初始化系統
    initialize();
    
    // 對外暴露API
    window.simpleVoice = {
        start: startRecording,
        stop: stopRecording,
        clear: clearConversations,
        analyze: analyzeConversations
    };
});