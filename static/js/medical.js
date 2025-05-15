document.addEventListener('DOMContentLoaded', function() {
    // 為常見主訴下拉菜單項添加點擊事件
    document.querySelectorAll('[data-complaint]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const complaint = this.getAttribute('data-complaint');
            const chiefComplaintField = document.getElementById('chief_complaint');
            if (chiefComplaintField) {
                chiefComplaintField.value = complaint;
            }
        });
    });

    // 定義各專科常見症狀和相關項目
    const specialtyRelatedItems = {
        '內科': {
            complaints: ['發燒', '頭痛', '胸悶', '呼吸困難', '全身無力'],
            physical: ['發燒 (38.5°C)', '心跳過速', '肺部囉音', '輕微腹壓痛'],
            pastHistory: ['高血壓', '糖尿病', '高血脂', '心臟病']
        },
        '心臟科': {
            complaints: ['胸痛', '呼吸困難', '心悸', '頭暈', '水腫', '運動後胸悶'],
            physical: ['頸靜脈怒張', '下肢水腫', '心律不整', '心雜音', 'S3心音'],
            pastHistory: ['高血壓', '冠心病', '心肌梗塞', '心臟衰竭', '心房顫動']
        },
        '呼吸科': {
            complaints: ['咳嗽', '呼吸困難', '胸痛', '痰多', '咳血', '夜間憋醒'],
            physical: ['肺部濕囉音', '呼吸音減弱', '哮鳴音', '肋間隙凹陷', '呼吸急促'],
            pastHistory: ['肺炎', '氣喘', '慢性阻塞性肺病', '肺結核', '肺纖維化']
        },
        '腸胃科': {
            complaints: ['腹痛', '腹瀉', '便秘', '噁心嘔吐', '消化不良', '血便', '黑便'],
            physical: ['腹部壓痛', '腸鳴音亢進', '肝脾腫大', '右上腹壓痛', '反跳痛'],
            pastHistory: ['胃潰瘍', '十二指腸潰瘍', '胃食道逆流', '膽結石', '胰臟炎']
        },
        '神經科': {
            complaints: ['頭痛', '頭暈', '癲癇發作', '肢體無力', '感覺異常', '視力模糊', '步態不穩'],
            physical: ['巴彬斯基徵陽性', '深部腱反射亢進', '感覺異常', '肌力減退', '共濟失調'],
            pastHistory: ['腦中風', '癲癇', '帕金森氏症', '多發性硬化症', '肌無力']
        },
        '腎臟科': {
            complaints: ['水腫', '血尿', '尿量減少', '尿量增多', '尿頻', '尿急', '腰痛'],
            physical: ['下肢水腫', '腎臟叩擊痛', '血壓升高', '腹水'],
            pastHistory: ['腎功能不全', '腎病症候群', '腎結石', '多囊腎', '腎小球腎炎']
        },
        '風濕免疫科': {
            complaints: ['關節疼痛', '關節腫脹', '皮疹', '肌肉痠痛', '臉部蝴蝶斑', '疲勞'],
            physical: ['關節腫脹', '關節壓痛', '關節活動受限', '皮疹', '肌肉壓痛'],
            pastHistory: ['類風濕性關節炎', '紅斑性狼瘡', '硬皮病', '血管炎', '多發性肌炎']
        },
        '內分泌科': {
            complaints: ['口渴多飲', '多尿', '體重減輕', '疲勞', '視力模糊', '怕熱', '怕冷'],
            physical: ['甲狀腺腫大', '皮膚乾燥', '震顫', '多毛', '眼球突出'],
            pastHistory: ['糖尿病', '甲狀腺功能亢進', '甲狀腺功能低下', '庫欣氏症', '腎上腺功能不全']
        },
        '血液腫瘤科': {
            complaints: ['疲勞', '體重減輕', '盜汗', '淋巴結腫大', '容易出血', '臉色蒼白'],
            physical: ['淋巴結腫大', '脾臟腫大', '貧血', '瘀斑', '出血點'],
            pastHistory: ['白血病', '淋巴瘤', '多發性骨髓瘤', '貧血', '血小板減少症']
        },
        '感染科': {
            complaints: ['發燒', '寒顫', '全身無力', '咳嗽', '腹瀉', '皮疹'],
            physical: ['發燒', '皮疹', '淋巴結腫大', '咽喉發紅', '肺部濕囉音'],
            pastHistory: ['肺結核', '愛滋病', '病毒性肝炎', '梅毒', '瘧疾']
        },
        '急診醫學': {
            complaints: ['胸痛', '呼吸困難', '意識改變', '嚴重頭痛', '嚴重腹痛', '外傷', '出血'],
            physical: ['意識不清', '血壓不穩', '出血', '骨折', '瞳孔不等大', '神經功能缺損'],
            pastHistory: ['高血壓', '糖尿病', '心臟病', '癲癇', '用血液稀釋劑']
        },
        '皮膚科': {
            complaints: ['皮疹', '搔癢', '皮膚乾燥', '皮膚疼痛', '皮膚腫塊', '脫髮'],
            physical: ['紅疹', '丘疹', '水泡', '濕疹', '鱗屑', '色素沉著'],
            pastHistory: ['異位性皮膚炎', '乾癬', '蕁麻疹', '皮膚真菌感染', '帶狀皰疹']
        },
        '精神科': {
            complaints: ['失眠', '心情低落', '焦慮', '情緒不穩', '幻覺', '妄想', '注意力不集中'],
            physical: ['精神狀態異常', '思維邏輯紊亂', '情感表達異常', '幻覺表現', '自殘傾向'],
            pastHistory: ['重度憂鬱症', '雙相情感障礙', '焦慮症', '思覺失調症', '強迫症']
        },
        '骨科': {
            complaints: ['關節疼痛', '關節腫脹', '背痛', '頸痛', '肢體活動受限', '骨折', '扭傷'],
            physical: ['關節腫脹', '關節活動受限', '肌肉萎縮', '脊椎側彎', '關節不穩'],
            pastHistory: ['骨折史', '骨質疏鬆症', '腰椎間盤突出', '退化性關節炎', '類風濕性關節炎']
        },
        '泌尿科': {
            complaints: ['排尿困難', '尿頻', '尿急', '尿痛', '血尿', '陰囊腫脹', '性功能障礙'],
            physical: ['前列腺觸診異常', '外生殖器異常', '陰囊腫脹', '尿道口分泌物'],
            pastHistory: ['攝護腺肥大', '泌尿道感染', '尿道結石', '性傳播疾病', '睪丸炎']
        },
        '婦產科': {
            complaints: ['月經異常', '陰道出血', '下腹痛', '白帶異常', '乳房腫塊', '懷孕症狀'],
            physical: ['子宮頸檢查異常', '子宮大小異常', '乳房觸診異常', '骨盆腔觸診疼痛'],
            pastHistory: ['子宮肌瘤', '卵巢囊腫', '子宮內膜異位症', '多囊性卵巢症候群', '產後出血']
        },
        '眼科': {
            complaints: ['視力模糊', '眼睛疼痛', '紅眼', '畏光', '眼睛乾澀', '複視', '眼壓感'],
            physical: ['結膜充血', '瞳孔異常', '眼壓升高', '視力下降', '眼底出血'],
            pastHistory: ['青光眼', '白內障', '黃斑部病變', '結膜炎', '視網膜剝離']
        },
        '耳鼻喉科': {
            complaints: ['耳痛', '聽力下降', '耳鳴', '鼻塞', '流鼻血', '喉嚨痛', '吞嚥困難'],
            physical: ['外耳道發紅', '鼓膜異常', '鼻腔黏膜腫脹', '扁桃體腫大', '聽力檢查異常'],
            pastHistory: ['中耳炎', '鼻竇炎', '過敏性鼻炎', '咽喉炎', '聽力喪失']
        },
        '兒科': {
            complaints: ['發燒', '咳嗽', '嘔吐', '腹瀉', '生長遲緩', '不進食', '哭鬧不安'],
            physical: ['發燒', '脫水', '肺部囉音', '生長曲線異常', '皮疹', '頸部僵硬'],
            pastHistory: ['早產', '先天性疾病', '小兒哮喘', '熱性痙攣', '幼年糖尿病']
        }
    };

    // 初始化專科相關按鈕
    function updateSpecialtyButtons(specialty) {
        // 檢查專科是否存在，如果不存在就使用通用專科數據
        // 如果指定的專科在數據中不存在，則使用內科數據作為默認
        const defaultSpecialty = '內科';
        const availableSpecialties = Object.keys(specialtyRelatedItems);
        
        if (!availableSpecialties.includes(specialty)) {
            console.log(`找不到專科 "${specialty}" 的相關數據，使用 "${defaultSpecialty}" 數據作為默認`);
            specialty = defaultSpecialty;
        }
        
        const specialtyData = specialtyRelatedItems[specialty];
        
        console.log(`更新專科按鈕為: ${specialty}`);
        
        // 確保數據存在
        if (!specialtyData) {
            console.error(`無法找到專科 "${specialty}" 的數據`);
            return;
        }
        
        // 更新主訴按鈕
        const complaintButtons = document.querySelector('.common-complaint-buttons-container');
        if (complaintButtons) {
            let buttonsHtml = '';
            
            if (specialtyData.complaints && specialtyData.complaints.length > 0) {
                specialtyData.complaints.forEach(complaint => {
                    buttonsHtml += `<button type="button" class="btn btn-sm btn-outline-secondary common-complaint-btn" 
                                    data-complaint="${complaint}" data-target="chief_complaint">${complaint}</button>`;
                });
            } else {
                // 如果沒有數據，顯示一些通用的按鈕
                buttonsHtml = `<button type="button" class="btn btn-sm btn-outline-secondary common-complaint-btn" 
                              data-complaint="發燒" data-target="chief_complaint">發燒</button>
                              <button type="button" class="btn btn-sm btn-outline-secondary common-complaint-btn" 
                              data-complaint="頭痛" data-target="chief_complaint">頭痛</button>`;
            }
            
            complaintButtons.innerHTML = buttonsHtml;
            
            // 重新綁定事件
            document.querySelectorAll('.common-complaint-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const complaint = this.getAttribute('data-complaint');
                    const targetId = this.getAttribute('data-target') || 'chief_complaint';
                    const targetField = document.getElementById(targetId);
                    
                    if (targetField) {
                        targetField.value = complaint;
                    } else {
                        console.error(`無法找到目標欄位: ${targetId}`);
                    }
                });
            });
        } else {
            console.error('找不到主訴按鈕容器');
        }
        
        // 更新體格檢查按鈕
        const peButtons = document.querySelector('.physical-examination-buttons-container');
        if (peButtons) {
            let buttonsHtml = '';
            
            if (specialtyData.physical && specialtyData.physical.length > 0) {
                specialtyData.physical.forEach(pe => {
                    // 提取按鈕顯示文本（使用第一個詞）
                    const buttonText = pe.split(' ')[0];
                    buttonsHtml += `<button type="button" class="btn btn-sm btn-outline-secondary symptom-pe-btn" 
                                   data-symptom-pe="${pe}" data-target="physical_examination">${buttonText}</button>`;
                });
            } else {
                // 如果沒有數據，顯示一些通用的體檢按鈕
                buttonsHtml = `<button type="button" class="btn btn-sm btn-outline-secondary symptom-pe-btn" 
                              data-symptom-pe="發燒 (38.5°C)" data-target="physical_examination">發燒</button>
                              <button type="button" class="btn btn-sm btn-outline-secondary symptom-pe-btn" 
                              data-symptom-pe="血壓 (140/90 mmHg)" data-target="physical_examination">血壓</button>`;
            }
            
            peButtons.innerHTML = buttonsHtml;
            
            // 重新綁定事件
            document.querySelectorAll('.symptom-pe-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const symptomPe = this.getAttribute('data-symptom-pe');
                    const textareaId = this.getAttribute('data-target');
                    const textarea = document.getElementById(textareaId);
                    
                    if (textarea) {
                        if (textarea.value) {
                            textarea.value += "\n" + symptomPe;
                        } else {
                            textarea.value = symptomPe;
                        }
                    } else {
                        console.error(`無法找到目標欄位: ${textareaId}`);
                    }
                });
            });
        } else {
            console.error('找不到體格檢查按鈕容器');
        }
        
        // 更新過去病史按鈕
        const pastHistoryButtons = document.querySelector('.past-history-buttons-container');
        if (pastHistoryButtons) {
            let buttonsHtml = '';
            
            if (specialtyData.pastHistory && specialtyData.pastHistory.length > 0) {
                specialtyData.pastHistory.forEach(history => {
                    buttonsHtml += `<button type="button" class="btn btn-sm btn-outline-info past-history-btn" 
                                   data-history="${history}" data-target="past_medical_history">${history}</button>`;
                });
            } else {
                // 如果沒有數據，顯示一些通用的過去病史按鈕
                buttonsHtml = `<button type="button" class="btn btn-sm btn-outline-info past-history-btn" 
                              data-history="高血壓" data-target="past_medical_history">高血壓</button>
                              <button type="button" class="btn btn-sm btn-outline-info past-history-btn" 
                              data-history="糖尿病" data-target="past_medical_history">糖尿病</button>`;
            }
            
            pastHistoryButtons.innerHTML = buttonsHtml;
            
            // 重新綁定事件
            document.querySelectorAll('.past-history-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const history = this.getAttribute('data-history');
                    const textareaId = this.getAttribute('data-target');
                    const textarea = document.getElementById(textareaId);
                    
                    if (textarea) {
                        if (textarea.value) {
                            textarea.value += "\n" + history;
                        } else {
                            textarea.value = history;
                        }
                    } else {
                        console.error(`無法找到目標欄位: ${textareaId}`);
                    }
                });
            });
        } else {
            console.error('找不到過去病史按鈕容器');
        }
    }

    // 專科模板選擇按鈕
    document.querySelectorAll('.specialty-template-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const specialty = this.getAttribute('data-specialty');
            const templateId = this.getAttribute('data-template');
            
            // 更新表單的專科選擇
            const specialtySelect = document.getElementById('specialty');
            if (specialtySelect) {
                specialtySelect.value = specialty;
                
                // 更新專科相關按鈕
                updateSpecialtyButtons(specialty);
            }
            
            // 如果有關聯的模板ID，則設置模板
            if (templateId) {
                const templateSelect = document.getElementById('templateSelect');
                if (templateSelect) {
                    templateSelect.value = templateId;
                    // 觸發模板選擇事件
                    const event = new Event('change');
                    templateSelect.dispatchEvent(event);
                }
            }
        });
    });
    
    // 專科選擇變更時更新按鈕
    const specialtySelect = document.getElementById('specialty');
    if (specialtySelect) {
        specialtySelect.addEventListener('change', function() {
            updateSpecialtyButtons(this.value);
        });
        
        // 初始化按鈕（頁面載入時）
        if (specialtySelect.value) {
            updateSpecialtyButtons(specialtySelect.value);
            console.log('初始化完成：根據當前選擇的專科更新按鈕', specialtySelect.value);
        } else {
            // 如果沒有選擇專科，使用內科作為默認
            updateSpecialtyButtons('內科');
            console.log('初始化完成：使用默認專科(內科)更新按鈕');
        }
        
        // 確保語音輸入功能正常工作
        // 在更新按鈕後，向全局window發送一個事件，通知語音輸入系統重新檢查按鈕
        setTimeout(function() {
            const event = new CustomEvent('buttonsUpdated');
            window.dispatchEvent(event);
            console.log('向語音輸入系統發送按鈕更新通知');
        }, 500);
    }

    // 實驗室檢查規模按鈕
    document.querySelectorAll('.lab-complexity-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const complexity = this.getAttribute('data-complexity');
            document.getElementById('labComplexity').value = complexity;
        });
    });

    // 常見主訴快速按鈕
    document.querySelectorAll('.common-complaint-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const complaint = this.getAttribute('data-complaint');
            const targetId = this.getAttribute('data-target') || 'chief_complaint';
            const targetField = document.getElementById(targetId);
            
            if (targetField) {
                targetField.value = complaint;
            } else {
                console.error(`無法找到目標欄位: ${targetId}`);
            }
        });
    });
    
    // 現病史按鈕
    document.querySelectorAll('.present-illness-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const illness = this.getAttribute('data-illness');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + illness;
                } else {
                    textarea.value = illness;
                }
            }
        });
    });
    
    // 伴隨症狀與體格檢查(PE)按鈕
    document.querySelectorAll('.symptom-pe-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const symptomPe = this.getAttribute('data-symptom-pe');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + symptomPe;
                } else {
                    textarea.value = symptomPe;
                }
            }
        });
    });
    
    // 過去病史按鈕
    document.querySelectorAll('.past-history-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const history = this.getAttribute('data-history');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + history;
                } else {
                    textarea.value = history;
                }
            }
        });
    });
    
    // 目前用藥按鈕
    document.querySelectorAll('.medication-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const medication = this.getAttribute('data-medication');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + medication;
                } else {
                    textarea.value = medication;
                }
            }
        });
    });
    
    // 過敏史按鈕
    document.querySelectorAll('.allergy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const allergy = this.getAttribute('data-allergy');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + allergy;
                } else {
                    textarea.value = allergy;
                }
            }
        });
    });
    
    // 家族史按鈕
    document.querySelectorAll('.family-history-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const familyHistory = this.getAttribute('data-family-history');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + familyHistory;
                } else {
                    textarea.value = familyHistory;
                }
            }
        });
    });
    
    // 社會史按鈕
    document.querySelectorAll('.social-history-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const socialHistory = this.getAttribute('data-social-history');
            const textareaId = this.getAttribute('data-target');
            const textarea = document.getElementById(textareaId);
            
            if (textarea) {
                if (textarea.value) {
                    textarea.value += "\n" + socialHistory;
                } else {
                    textarea.value = socialHistory;
                }
            }
        });
    });
});