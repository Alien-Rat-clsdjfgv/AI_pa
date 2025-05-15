import logging
import json
import os
from openai import OpenAI
from openai.types.chat import ChatCompletionMessage

def validate_api_key(api_key):
    """Validate OpenAI API key by attempting to fetch models"""
    if not api_key or api_key.strip() == "":
        return False, "API key is required"
    
    try:
        client = OpenAI(api_key=api_key)
        models = client.models.list()
        return True, "API key is valid"
    except Exception as e:
        logging.error(f"API key validation error: {str(e)}")
        return False, f"API key validation failed: {str(e)}"

def get_available_models(api_key):
    """Get list of available OpenAI models"""
    try:
        client = OpenAI(api_key=api_key)
        models_data = client.models.list()
        
        # Filter for chat completion models only
        chat_models = []
        for model in models_data.data:
            model_id = model.id
            # Include GPT models
            if any(name in model_id for name in ['gpt-4', 'gpt-3.5']):
                chat_models.append(model_id)
        
        # Ensure gpt-4o is included (the newest model)
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        # do not change this unless explicitly requested by the user
        if 'gpt-4o' not in chat_models:
            chat_models.append('gpt-4o')
            
        # Sort models by priority
        def model_priority(model_id):
            if 'gpt-4o' in model_id:
                return 0
            elif 'gpt-4' in model_id:
                return 1
            else:
                return 2
                
        return sorted(chat_models, key=model_priority)
    except Exception as e:
        logging.error(f"Error fetching models: {str(e)}")
        # Return some default models if the API fails
        return ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo']

def run_prompt_test(api_key, test_case):
    """Run a test with OpenAI API"""
    try:
        client = OpenAI(api_key=api_key)
        
        # Set up the messages
        messages = []
        
        # Add system message if present
        if test_case.get('system_message'):
            messages.append({
                "role": "system",
                "content": test_case.get('system_message')
            })
        
        # Add user message
        messages.append({
            "role": "user",
            "content": test_case.get('prompt')
        })
        
        # Set up request parameters
        params = {
            "model": test_case.get('model', 'gpt-4o'),
            "messages": messages,
            "temperature": float(test_case.get('temperature', 0.7)),
            "max_tokens": int(test_case.get('max_tokens', 1000)),
            "top_p": float(test_case.get('top_p', 1.0)),
            "frequency_penalty": float(test_case.get('frequency_penalty', 0.0)),
            "presence_penalty": float(test_case.get('presence_penalty', 0.0)),
        }
        
        # Add response_format if JSON is requested
        if test_case.get('json_response', False):
            params["response_format"] = {"type": "json_object"}
        
        # Log the request parameters for debugging
        logging.debug(f"OpenAI API request params: {params}")
        
        # Make the API call
        response = client.chat.completions.create(**params)
        
        if not response or not response.choices or len(response.choices) == 0:
            raise ValueError("Empty response received from OpenAI API")
            
        # Process the response
        message_content = response.choices[0].message.content
        
        if not message_content:
            raise ValueError("Empty content received from OpenAI API")
        
        # Handle JSON responses
        try:
            if test_case.get('json_response', False):
                message_json = json.loads(message_content)
            else:
                message_json = message_content
        except json.JSONDecodeError as json_err:
            logging.error(f"JSON decode error: {str(json_err)}")
            # Return the raw text if JSON parsing fails
            message_json = message_content
        
        # Return formatted response
        return {
            'success': True,
            'data': {
                'response': message_json,
                'usage': {
                    'prompt_tokens': response.usage.prompt_tokens,
                    'completion_tokens': response.usage.completion_tokens,
                    'total_tokens': response.usage.total_tokens
                }
            }
        }
        
    except Exception as e:
        logging.error(f"Error running test: {str(e)}")
        return {
            'success': False,
            'message': str(e)
        }
