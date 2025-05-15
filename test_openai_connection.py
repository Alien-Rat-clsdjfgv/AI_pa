import os
import sys
from openai import OpenAI

def test_connection():
    """Test OpenAI API connection"""
    api_key = os.environ.get("OPENAI_API_KEY")
    
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable not found")
        return False
        
    try:
        client = OpenAI(api_key=api_key)
        models = client.models.list()
        
        print("✓ Connection successful!")
        print(f"✓ Found {len(models.data)} models")
        
        # Test a simple chat completion
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "user", "content": "Hello, please respond with a simple greeting."}
            ],
            max_tokens=50
        )
        
        content = response.choices[0].message.content
        print(f"✓ Received response: {content}")
        print(f"✓ Tokens used: {response.usage.total_tokens}")
        
        return True
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)