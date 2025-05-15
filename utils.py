import os
from flask import session

def get_api_key():
    """Get API key from session or environment variables"""
    # First try to get from session
    if 'api_key' in session and session['api_key']:
        return session['api_key']
    
    # Then try to get from environment variables
    env_api_key = os.environ.get("OPENAI_API_KEY")
    if env_api_key:
        return env_api_key
    
    # Return None if no API key found
    return None
