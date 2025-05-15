"""
提供醫療病例報告的不同導出格式
"""
import logging
import json
import re
from datetime import datetime
from flask import render_template, Response

def export_as_text(case):
    """將醫療病例導出為純文本格式
    
    Args:
        case: 醫療病例數據
        
    Returns:
        str: 格式化的文本
    """
    text = f"醫療病例記錄\n"
    text += f"="*50 + "\n\n"
    
    text += f"標題: {case.title}\n"
    text += f"生成日期: {case.created_at.strftime('%Y-%m-%d %H:%M')}\n"
    text += f"專科: {case.specialty.name if case.specialty else '未指定'}\n\n"
    
    text += f"患者信息\n"
    text += f"-"*50 + "\n"
    text += f"年齡: {case.patient_age or '未指定'}\n"
    text += f"性別: {case.patient_gender or '未指定'}\n\n"
    
    # 主訴
    if case.chief_complaint:
        text += f"主訴\n"
        text += f"-"*50 + "\n"
        text += f"{case.chief_complaint}\n\n"
    
    # 現病史
    if case.history_present_illness:
        text += f"現病史\n"
        text += f"-"*50 + "\n"
        text += f"{case.history_present_illness}\n\n"
    
    # 過去病史
    if case.past_medical_history:
        text += f"過去病史\n"
        text += f"-"*50 + "\n"
        text += f"{case.past_medical_history}\n\n"
    
    # 用藥史
    if case.medications:
        text += f"目前用藥\n"
        text += f"-"*50 + "\n"
        text += f"{case.medications}\n\n"
        
    # 過敏史
    if case.allergies:
        text += f"過敏史\n"
        text += f"-"*50 + "\n"
        text += f"{case.allergies}\n\n"
    
    # 家族史
    if case.family_history:
        text += f"家族史\n"
        text += f"-"*50 + "\n"
        text += f"{case.family_history}\n\n"
    
    # 社會史
    if case.social_history:
        text += f"社會史\n"
        text += f"-"*50 + "\n"
        text += f"{case.social_history}\n\n"
    
    # 體格檢查
    if case.physical_examination:
        text += f"體格檢查\n"
        text += f"-"*50 + "\n"
        text += f"{case.physical_examination}\n\n"
    
    # 生命體徵
    if case.vital_signs:
        text += f"生命體徵\n"
        text += f"-"*50 + "\n"
        text += f"{case.vital_signs}\n\n"
    
    # 實驗室結果
    if case.laboratory_results:
        text += f"實驗室結果\n"
        text += f"-"*50 + "\n"
        text += f"{case.laboratory_results}\n\n"
    
    # 影像結果
    if case.imaging_results:
        text += f"影像結果\n"
        text += f"-"*50 + "\n"
        text += f"{case.imaging_results}\n\n"
    
    # 評估
    if case.assessment:
        text += f"評估\n"
        text += f"-"*50 + "\n"
        text += f"{case.assessment}\n\n"
        if case.diagnoses:
            text += "診斷:\n"
            for diagnosis in case.diagnoses:
                text += f"- {diagnosis.name}"
                if diagnosis.icd_code:
                    text += f" (ICD: {diagnosis.icd_code})"
                text += "\n"
            text += "\n"
    
    # 計劃
    if case.plan:
        text += f"治療計劃\n"
        text += f"-"*50 + "\n"
        text += f"{case.plan}\n\n"
    
    text += f"="*50 + "\n"
    text += f"注意：本病例為AI輔助生成，僅供教育和培訓目的使用。\n"
    
    return text

def export_as_html(case):
    """將醫療病例導出為HTML格式
    
    Args:
        case: 醫療病例數據
        
    Returns:
        str: HTML格式的報告
    """
    # 將換行轉換為HTML的<br>
    def nl2br(text):
        if text:
            return text.replace('\n', '<br>')
        return ''

    # 準備診斷列表
    diagnoses = []
    if case.diagnoses:
        for diagnosis in case.diagnoses:
            diag_text = diagnosis.name
            if diagnosis.icd_code:
                diag_text += f" (ICD: {diagnosis.icd_code})"
            diagnoses.append(diag_text)
    
    # 準備模板數據
    data = {
        'title': case.title,
        'generated_date': case.created_at.strftime('%Y-%m-%d %H:%M'),
        'specialty': case.specialty.name if case.specialty else '未指定',
        'patient_age': case.patient_age or '未指定',
        'patient_gender': case.patient_gender or '未指定',
        'chief_complaint': nl2br(case.chief_complaint),
        'history_present_illness': nl2br(case.history_present_illness),
        'past_medical_history': nl2br(case.past_medical_history),
        'medications': nl2br(case.medications),
        'allergies': nl2br(case.allergies),
        'family_history': nl2br(case.family_history),
        'social_history': nl2br(case.social_history),
        'physical_examination': nl2br(case.physical_examination),
        'vital_signs': nl2br(case.vital_signs),
        'laboratory_results': nl2br(case.laboratory_results),
        'imaging_results': nl2br(case.imaging_results),
        'assessment': nl2br(case.assessment),
        'diagnoses': diagnoses,
        'plan': nl2br(case.plan),
    }
    
    # 使用render_template渲染HTML (此功能需要在routes中實現)
    html = """
    <!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>醫療病例報告</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            h1 {
                color: #2c3e50;
                border-bottom: 2px solid #3498db;
                padding-bottom: 10px;
            }
            h2 {
                color: #2980b9;
                margin-top: 25px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            .patient-info {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }
            .section {
                margin-bottom: 20px;
            }
            .diagnosis-item {
                margin-bottom: 5px;
            }
            .footer {
                margin-top: 40px;
                border-top: 1px solid #ddd;
                padding-top: 10px;
                font-size: 0.8em;
                color: #777;
            }
            @media print {
                body {
                    max-width: 100%;
                    padding: 0;
                }
                .no-print {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <h1>醫療病例報告</h1>
        
        <div class="patient-info">
            <h2>患者資訊</h2>
            <p><strong>病例標題:</strong> {title}</p>
            <p><strong>生成日期:</strong> {generated_date}</p>
            <p><strong>專科:</strong> {specialty}</p>
            <p><strong>年齡:</strong> {patient_age}</p>
            <p><strong>性別:</strong> {patient_gender}</p>
        </div>
    """.format(**data)
    
    # 主訴
    if case.chief_complaint:
        html += """
        <div class="section">
            <h2>主訴</h2>
            <p>{chief_complaint}</p>
        </div>
        """.format(**data)
    
    # 現病史
    if case.history_present_illness:
        html += """
        <div class="section">
            <h2>現病史</h2>
            <p>{history_present_illness}</p>
        </div>
        """.format(**data)
    
    # 過去病史
    if case.past_medical_history:
        html += """
        <div class="section">
            <h2>過去病史</h2>
            <p>{past_medical_history}</p>
        </div>
        """.format(**data)
    
    # 用藥史
    if case.medications:
        html += """
        <div class="section">
            <h2>目前用藥</h2>
            <p>{medications}</p>
        </div>
        """.format(**data)
    
    # 過敏史
    if case.allergies:
        html += """
        <div class="section">
            <h2>過敏史</h2>
            <p>{allergies}</p>
        </div>
        """.format(**data)
    
    # 家族史
    if case.family_history:
        html += """
        <div class="section">
            <h2>家族史</h2>
            <p>{family_history}</p>
        </div>
        """.format(**data)
    
    # 社會史
    if case.social_history:
        html += """
        <div class="section">
            <h2>社會史</h2>
            <p>{social_history}</p>
        </div>
        """.format(**data)
    
    # 體格檢查
    if case.physical_examination:
        html += """
        <div class="section">
            <h2>體格檢查</h2>
            <p>{physical_examination}</p>
        </div>
        """.format(**data)
    
    # 生命體徵
    if case.vital_signs:
        html += """
        <div class="section">
            <h2>生命體徵</h2>
            <p>{vital_signs}</p>
        </div>
        """.format(**data)
    
    # 實驗室結果
    if case.laboratory_results:
        html += """
        <div class="section">
            <h2>實驗室結果</h2>
            <p>{laboratory_results}</p>
        </div>
        """.format(**data)
    
    # 影像結果
    if case.imaging_results:
        html += """
        <div class="section">
            <h2>影像結果</h2>
            <p>{imaging_results}</p>
        </div>
        """.format(**data)
    
    # 評估
    if case.assessment:
        html += """
        <div class="section">
            <h2>評估</h2>
            <p>{assessment}</p>
        """.format(**data)
        
        # 診斷
        if data['diagnoses']:
            html += """
            <div>
                <h3>診斷:</h3>
                <ul>
            """
            for diagnosis in data['diagnoses']:
                html += f"<li class='diagnosis-item'>{diagnosis}</li>"
            html += """
                </ul>
            </div>
            """
        
        html += "</div>"
    
    # 計劃
    if case.plan:
        html += """
        <div class="section">
            <h2>治療計劃</h2>
            <p>{plan}</p>
        </div>
        """.format(**data)
    
    # 頁腳
    html += """
        <div class="footer">
            <p>注意：本病例為AI輔助生成，僅供教育和培訓目的使用。</p>
            <p class="no-print">生成日期: {generated_date}</p>
        </div>
    </body>
    </html>
    """.format(**data)
    
    return html

def export_as_json(case):
    """將醫療病例導出為JSON格式
    
    Args:
        case: 醫療病例數據
        
    Returns:
        str: JSON字符串
    """
    return json.dumps(case.to_dict(), ensure_ascii=False, indent=2)

def export_case(case, format_type):
    """根據指定格式導出病例
    
    Args:
        case: 醫療病例數據
        format_type: 導出格式 ('txt', 'html', 'json')
        
    Returns:
        tuple: (content, mime_type, filename)
    """
    now = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename_base = f"medical_case_{case.id}_{now}"
    
    if format_type == 'txt':
        content = export_as_text(case)
        mime_type = 'text/plain'
        filename = f"{filename_base}.txt"
    elif format_type == 'html':
        content = export_as_html(case)
        mime_type = 'text/html'
        filename = f"{filename_base}.html"
    elif format_type == 'json':
        content = export_as_json(case)
        mime_type = 'application/json'
        filename = f"{filename_base}.json"
    else:
        raise ValueError(f"Unsupported export format: {format_type}")
    
    return content, mime_type, filename