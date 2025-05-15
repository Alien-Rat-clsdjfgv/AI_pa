import json
import logging
import time
import os
from datetime import datetime
from flask import render_template, request, redirect, url_for, flash, jsonify, session
from app import app, db
from models import TestCase, TestRun
from openai_client import (
    validate_api_key,
    get_available_models,
    run_prompt_test,
)
from utils import get_api_key

@app.route('/')
def index():
    """Home page with API connection test and quick test form"""
    # Check for API key in session or environment
    api_key = get_api_key()
    api_connected = False
    models = []
    error_message = None
    
    if api_key:
        # Try to validate the API key
        api_connected, error = validate_api_key(api_key)
        if api_connected:
            try:
                models = get_available_models(api_key)
                logging.info(f"Successfully loaded {len(models)} models from API")
            except Exception as e:
                logging.error(f"Error loading models: {str(e)}")
                error_message = f"Connected to API but failed to load models: {str(e)}"
        else:
            error_message = error
            logging.warning(f"API validation failed: {error}")
    else:
        logging.info("No API key found in session or environment")
    
    test_cases = TestCase.query.order_by(TestCase.updated_at.desc()).limit(5).all()
    recent_tests = TestRun.query.order_by(TestRun.start_time.desc()).limit(5).all()
    
    # If API key is available in environment but not session, store it in session
    if not 'api_key' in session and os.environ.get("OPENAI_API_KEY"):
        session['api_key'] = os.environ.get("OPENAI_API_KEY")
        logging.info("Using API key from environment variables")
    
    return render_template(
        'index.html', 
        api_connected=api_connected,
        models=models,
        test_cases=test_cases,
        recent_tests=recent_tests,
        error_message=error_message
    )

@app.route('/api/connect', methods=['POST'])
def connect_api():
    """API endpoint to test API key connection"""
    data = request.get_json()
    api_key = data.get('api_key', '')
    use_env_key = data.get('use_env_key', False)
    
    # If no API key provided but use_env_key is true, try to get from environment
    if not api_key and use_env_key:
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if api_key:
            logging.info("Using API key from environment variables")
    
    if not api_key:
        return jsonify({'success': False, 'message': 'No API key available'})
    
    # Test the API key
    success, message = validate_api_key(api_key)
    
    if success:
        session['api_key'] = api_key
        try:
            models = get_available_models(api_key)
            return jsonify({
                'success': True, 
                'message': 'API connection successful',
                'models': models
            })
        except Exception as e:
            logging.error(f"Error fetching models: {str(e)}")
            return jsonify({
                'success': True,
                'message': f'API connected but error loading models: {str(e)}',
                'models': ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo']  # Fallback models
            })
    else:
        return jsonify({'success': False, 'message': message})

@app.route('/api/disconnect', methods=['POST'])
def disconnect_api():
    """Remove API key from session"""
    if 'api_key' in session:
        session.pop('api_key')
    
    return jsonify({'success': True, 'message': 'API disconnected'})

@app.route('/api/test', methods=['POST'])
def run_test():
    """Run a test with the given parameters"""
    api_key = get_api_key()
    if not api_key:
        return jsonify({'success': False, 'message': 'API key is required'})
    
    data = request.get_json()
    save_test_case = data.get('save', False)
    
    # Create a test case from the data
    try:
        # Create a test case if requested
        if save_test_case:
            test_case = TestCase(
                name=data.get('name', 'Unnamed Test'),
                model=data.get('model', 'gpt-4o'),
                prompt=data.get('prompt', ''),
                system_message=data.get('system_message', ''),
                temperature=float(data.get('temperature', 0.7)),
                max_tokens=int(data.get('max_tokens', 1000)),
                top_p=float(data.get('top_p', 1.0)),
                frequency_penalty=float(data.get('frequency_penalty', 0.0)),
                presence_penalty=float(data.get('presence_penalty', 0.0)),
                json_response=bool(data.get('json_response', False))
            )
            db.session.add(test_case)
            db.session.commit()
        else:
            # Create a temporary test case that isn't saved
            test_case = TestCase(
                name="Temporary Test",
                model=data.get('model', 'gpt-4o'),
                prompt=data.get('prompt', ''),
                system_message=data.get('system_message', ''),
                temperature=float(data.get('temperature', 0.7)),
                max_tokens=int(data.get('max_tokens', 1000)),
                top_p=float(data.get('top_p', 1.0)),
                frequency_penalty=float(data.get('frequency_penalty', 0.0)),
                presence_penalty=float(data.get('presence_penalty', 0.0)),
                json_response=bool(data.get('json_response', False))
            )
            
        # Create a test run record
        test_run = TestRun(
            test_case_id=test_case.id if save_test_case else None,
            start_time=datetime.utcnow(),
            status="running",
            api_key_used=True
        )
        
        if save_test_case:
            db.session.add(test_run)
            db.session.commit()
        
        # Run the test
        start_time = time.time()
        result = run_prompt_test(api_key, test_case.to_dict())
        end_time = time.time()
        
        # Update the test run with results
        duration_ms = int((end_time - start_time) * 1000)
        if result.get('success'):
            response_data = result.get('data', {})
            status = "completed"
            error_message = None
            response = json.dumps(response_data.get('response', {}))
            usage = response_data.get('usage', {})
            prompt_tokens = usage.get('prompt_tokens', 0)
            completion_tokens = usage.get('completion_tokens', 0)
            total_tokens = usage.get('total_tokens', 0)
        else:
            status = "failed"
            error_message = result.get('message', 'Unknown error')
            response = None
            prompt_tokens = 0
            completion_tokens = 0
            total_tokens = 0
        
        if save_test_case:
            test_run.end_time = datetime.utcnow()
            test_run.duration_ms = duration_ms
            test_run.status = status
            test_run.response = response
            test_run.error_message = error_message
            test_run.prompt_tokens = prompt_tokens
            test_run.completion_tokens = completion_tokens
            test_run.total_tokens = total_tokens
            db.session.commit()
            
        return jsonify({
            'success': True,
            'test_case_id': test_case.id if save_test_case else None,
            'test_run_id': test_run.id if save_test_case else None,
            'status': status,
            'duration_ms': duration_ms,
            'response': json.loads(response) if response else None,
            'error_message': error_message,
            'usage': {
                'prompt_tokens': prompt_tokens,
                'completion_tokens': completion_tokens,
                'total_tokens': total_tokens
            }
        })
        
    except Exception as e:
        logging.error(f"Error running test: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/test-cases')
def test_cases():
    """View all test cases"""
    test_cases = TestCase.query.order_by(TestCase.updated_at.desc()).all()
    return render_template('test_history.html', test_cases=test_cases)

@app.route('/test-case/<int:id>')
def test_case_detail(id):
    """View a specific test case and its runs"""
    test_case = TestCase.query.get_or_404(id)
    test_runs = TestRun.query.filter_by(test_case_id=id).order_by(TestRun.start_time.desc()).all()
    return render_template('test_detail.html', test_case=test_case, test_runs=test_runs)

@app.route('/api/test-case/<int:id>/run', methods=['POST'])
def run_existing_test(id):
    """Run an existing test case"""
    api_key = get_api_key()
    if not api_key:
        return jsonify({'success': False, 'message': 'API key is required'})
    
    test_case = TestCase.query.get_or_404(id)
    
    # Create a test run record
    test_run = TestRun(
        test_case_id=test_case.id,
        start_time=datetime.utcnow(),
        status="running",
        api_key_used=True
    )
    db.session.add(test_run)
    db.session.commit()
    
    # Run the test
    start_time = time.time()
    result = run_prompt_test(api_key, test_case.to_dict())
    end_time = time.time()
    
    # Update the test run with results
    duration_ms = int((end_time - start_time) * 1000)
    if result.get('success'):
        response_data = result.get('data', {})
        status = "completed"
        error_message = None
        response = json.dumps(response_data.get('response', {}))
        usage = response_data.get('usage', {})
        prompt_tokens = usage.get('prompt_tokens', 0)
        completion_tokens = usage.get('completion_tokens', 0)
        total_tokens = usage.get('total_tokens', 0)
    else:
        status = "failed"
        error_message = result.get('message', 'Unknown error')
        response = None
        prompt_tokens = 0
        completion_tokens = 0
        total_tokens = 0
    
    test_run.end_time = datetime.utcnow()
    test_run.duration_ms = duration_ms
    test_run.status = status
    test_run.response = response
    test_run.error_message = error_message
    test_run.prompt_tokens = prompt_tokens
    test_run.completion_tokens = completion_tokens
    test_run.total_tokens = total_tokens
    db.session.commit()
    
    return jsonify({
        'success': True,
        'test_run_id': test_run.id,
        'status': status,
        'duration_ms': duration_ms,
        'response': json.loads(response) if response else None,
        'error_message': error_message,
        'usage': {
            'prompt_tokens': prompt_tokens,
            'completion_tokens': completion_tokens,
            'total_tokens': total_tokens
        }
    })

@app.route('/api/test-case/<int:id>', methods=['DELETE'])
def delete_test_case(id):
    """Delete a test case and all its runs"""
    test_case = TestCase.query.get_or_404(id)
    db.session.delete(test_case)
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Test case deleted'})
