"""原始路由模塊 - 保留基本功能的相容性"""

from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash
from extensions import db
from utils import get_api_key
from services.openai_client import validate_api_key, run_prompt_test


# 創建藍圖
original_bp = Blueprint('original', __name__, url_prefix='/original')

@original_bp.route('/')
def index():
    """原始首頁 - OpenAI API 測試平台"""
    # 檢查API金鑰
    api_key = get_api_key()
    api_connected = api_key is not None
    
    # 呈現模板
    return render_template('index.html', api_connected=api_connected)
    
@original_bp.route('/connect', methods=['POST'])
def connect_api():
    """API 端點來測試 API 金鑰連接"""
    api_key = request.json.get('api_key')
    
    if not api_key:
        return jsonify({'success': False, 'message': 'API 金鑰是必需的'})
    
    try:
        # 驗證 API 金鑰
        valid = validate_api_key(api_key)
        
        if valid:
            # 保存 API 金鑰到會話
            session['api_key'] = api_key
            
            # 獲取可用模型
            models = []
            
            return jsonify({
                'success': True,
                'message': 'API 連接成功',
                'models': models
            })
        else:
            return jsonify({
                'success': False,
                'message': 'API 金鑰驗證失敗'
            })
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
        
@original_bp.route('/disconnect', methods=['POST'])
def disconnect_api():
    """從會話中刪除 API 金鑰"""
    session.pop('api_key', None)
    return jsonify({'success': True})
    
@original_bp.route('/run-test', methods=['POST'])
def run_test():
    """使用給定參數運行測試"""
    api_key = get_api_key()
    if not api_key:
        return jsonify({'success': False, 'message': 'API 金鑰是必需的'})
    
    data = request.json
    
    # 保存測試案例
    save_test = data.get('save_test', False)
    
    try:
        # 創建測試案例參數
        test_params = {
            'model': data.get('model', 'gpt-4o'),
            'prompt': data.get('prompt', ''),
            'system_message': data.get('system_message', ''),
            'temperature': float(data.get('temperature', 0.7)),
            'max_tokens': int(data.get('max_tokens', 1000)),
            'top_p': float(data.get('top_p', 1.0)),
            'frequency_penalty': float(data.get('frequency_penalty', 0.0)),
            'presence_penalty': float(data.get('presence_penalty', 0.0)),
            'json_response': data.get('json_response', False),
        }
        
        # 運行測試
        result = openai_client.run_prompt_test(api_key, test_params)
        
        return jsonify({'success': True, 'result': result})
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})