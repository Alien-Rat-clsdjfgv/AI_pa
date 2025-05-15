import json
import logging
import re
from datetime import datetime
from openai import OpenAI
from utils import get_api_key

def generate_medical_case(params):
    """
    Generate a medical case using OpenAI API based on provided parameters
    
    Args:
        params (dict): Parameters for generating the case
            - specialty (str): Medical specialty
            - chief_complaint (str): Primary complaint or reason for visit
            - patient_age (int): Patient's age
            - patient_gender (str): Patient's gender
            - complexity (str): Case complexity level (simple, moderate, complex)
            - include_sections (list): Which sections to include in the case
            - model (str): AI model to use
            - system_message (str, optional): System message for the AI
            - template_id (int, optional): ID of the template to use
            - lab_scale (str, optional): Scale of lab tests to include (basic, comprehensive)
            - imaging_type (str, optional): Type of imaging to include (none, xray, ct, mri, ultrasound)
            - accompanied_symptoms (str, optional): Accompanying symptoms
            - medical_history (str, optional): Patient's medical history
            - medications (str, optional): Current medications
            - allergies (str, optional): Known allergies
            - family_history (str, optional): Family medical history
            - social_history (str, optional): Social and lifestyle factors
            
    Returns:
        dict: Generated medical case data and metadata
    """
    api_key = get_api_key()
    if not api_key:
        raise ValueError("API key is required")
    
    client = OpenAI(api_key=api_key)
    
    # Set up the system message
    system_message = params.get('system_message', '')
    if not system_message:
        system_message = """You are an experienced medical professional creating realistic patient cases for education and training purposes. 
Create a detailed and medically accurate case based on the provided information. Use realistic medical terminology, 
lab values, and findings. All cases should be fictional but realistic and medically accurate."""
    
    # Determine sections to include
    default_sections = [
        "chief_complaint", "history_present_illness", "past_medical_history", 
        "medications", "allergies", "family_history", "social_history", 
        "physical_examination", "vital_signs", "laboratory_results", 
        "assessment", "plan"
    ]
    
    include_sections = params.get('include_sections', default_sections)
    
    # Build the prompt
    specialty = params.get('specialty', '')
    complaint = params.get('chief_complaint', '')
    age = params.get('patient_age', 'adult')
    gender = params.get('patient_gender', 'not specified')
    complexity = params.get('complexity', 'moderate')
    
    # Get additional detailed parameters
    lab_scale = params.get('lab_scale', 'basic')
    imaging_type = params.get('imaging_type', 'none')
    accompanied_symptoms = params.get('accompanied_symptoms', '')
    medical_history = params.get('medical_history', '')
    medications = params.get('medications', '')
    allergies = params.get('allergies', '')
    family_history = params.get('family_history', '')
    social_history = params.get('social_history', '')
    
    # Building a more detailed prompt with the additional information
    prompt = f"""Create a realistic and detailed medical case with the following specifications:

Specialty: {specialty}
Chief Complaint: {complaint}
Patient Age: {age}
Patient Gender: {gender}
Complexity Level: {complexity}
"""

    # Add additional parameters to the prompt if provided
    if accompanied_symptoms:
        prompt += f"Accompanied Symptoms: {accompanied_symptoms}\n"
    
    if medical_history:
        prompt += f"Past Medical History: {medical_history}\n"
        
    if medications:
        prompt += f"Current Medications: {medications}\n"
        
    if allergies:
        prompt += f"Allergies: {allergies}\n"
        
    if family_history:
        prompt += f"Family History: {family_history}\n"
        
    if social_history:
        prompt += f"Social History: {social_history}\n"
    
    # Laboratory and imaging guidance
    prompt += f"""
Laboratory Tests: Include {lab_scale} laboratory tests appropriate for this specialty and complaint.
Imaging: Include {imaging_type} imaging results if appropriate for this case.

Please include the following sections, formatted with section headers in Markdown:
"""

    for section in include_sections:
        formatted_section = section.replace('_', ' ').title()
        prompt += f"- {formatted_section}\n"
    
    prompt += """
Ensure all medical information is realistic and accurate. Use proper medical terminology and realistic values for vitals and lab results.
Format your response as a medical case report with clear section headings using Markdown (## Section Title).

For the History of Present Illness section, include:
1. Duration and onset of symptoms
2. Characteristics and severity
3. Aggravating and alleviating factors
4. Relevant associated symptoms
5. Impact on daily activities
6. Prior treatments or evaluations

For laboratory results, provide realistic reference ranges in parentheses.

Begin with a brief title for the case that captures the key aspects."""

    # Set up the messages
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": prompt}
    ]
    
    # Set up request parameters
    request_params = {
        "model": params.get('model', 'gpt-4o'),
        "messages": messages,
        "temperature": float(params.get('temperature', 0.7)),
        "max_tokens": int(params.get('max_tokens', 2000)),
        "top_p": float(params.get('top_p', 1.0)),
        "frequency_penalty": float(params.get('frequency_penalty', 0.0)),
        "presence_penalty": float(params.get('presence_penalty', 0.0)),
    }
    
    try:
        # Make the API call
        logging.info(f"Generating medical case with parameters: {params}")
        response = client.chat.completions.create(**request_params)
        
        if not response or not response.choices or len(response.choices) == 0:
            raise ValueError("Empty response received from OpenAI API")
            
        content = response.choices[0].message.content
        
        if not content:
            raise ValueError("Empty content received from OpenAI API")
        
        # Parse the response into structured sections
        parsed_case = parse_case_content(content)
        
        # Add metadata
        metadata = {
            'generated_at': datetime.utcnow().isoformat(),
            'model_used': params.get('model', 'gpt-4o'),
            'parameters': {
                'specialty': specialty,
                'chief_complaint': complaint,
                'patient_age': age,
                'patient_gender': gender,
                'complexity': complexity
            },
            'prompt_used': prompt,
            'system_message': system_message,
            'tokens': {
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens
            }
        }
        
        return {
            'success': True,
            'case': parsed_case,
            'metadata': metadata,
            'raw_content': content
        }
        
    except Exception as e:
        logging.error(f"Error generating medical case: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def parse_case_content(content):
    """
    Parse raw case content into structured sections
    
    Args:
        content (str): Raw content from the AI
        
    Returns:
        dict: Structured case data
    """
    # Extract title (assume first line is title)
    lines = content.strip().split('\n')
    title = lines[0].strip().lstrip('#').strip()
    
    # Regular expression to find markdown section headers
    section_pattern = r'##\s+(.*?)\s*\n(.*?)(?=\n##\s+|\Z)'
    matches = re.findall(section_pattern, content, re.DOTALL)
    
    sections = {}
    sections['title'] = title
    
    for section_name, section_content in matches:
        # Convert section name to snake_case for keys
        key = section_name.lower().strip().replace(' ', '_')
        sections[key] = section_content.strip()
    
    return sections

def generate_present_illness(params):
    """
    Generate a detailed Present Illness section based on provided parameters
    
    Args:
        params (dict): Parameters for generating the present illness
            - chief_complaint (str): Primary complaint or reason for visit
            - patient_age (int): Patient's age
            - patient_gender (str): Patient's gender
            - accompanied_symptoms (str, optional): Accompanying symptoms
            - present_illness_details (str, optional): Additional details about the present illness
            - model (str, optional): AI model to use
            
    Returns:
        dict: Generated present illness text and metadata
    """
    api_key = get_api_key()
    if not api_key:
        raise ValueError("API key is required")
    
    client = OpenAI(api_key=api_key)
    
    # Extract parameters
    chief_complaint = params.get('chief_complaint', '')
    age = params.get('patient_age', 'adult')
    gender = params.get('patient_gender', 'not specified')
    accompanied_symptoms = params.get('accompanied_symptoms', '')
    present_illness_details = params.get('present_illness_details', '')
    
    if not chief_complaint:
        raise ValueError("Chief complaint is required to generate present illness")
    
    # System message for present illness generation
    system_message = """You are an experienced medical professional creating a detailed History of Present Illness (HPI) 
for a patient case. Focus only on creating a medically accurate and detailed HPI section based on the provided information.
Include details about symptom onset, duration, characteristics, aggravating/alleviating factors, and relevant negative findings."""
    
    # Build the prompt
    prompt = f"""Create a detailed History of Present Illness (HPI) for a {age} year old {gender} patient with the following:

Chief Complaint: {chief_complaint}
"""
    
    if accompanied_symptoms:
        prompt += f"Accompanied Symptoms: {accompanied_symptoms}\n"
    
    if present_illness_details:
        prompt += f"Additional Details: {present_illness_details}\n"
    
    prompt += """
Please create a detailed, realistic History of Present Illness that includes:
1. When and how the symptoms started
2. Progression of symptoms over time
3. Severity and characteristics of symptoms
4. Aggravating and alleviating factors
5. Related symptoms or relevant negative findings
6. Prior treatments attempted (if any)
7. Impact on daily activities

Ensure the HPI is coherent, realistic, and appropriate for the chief complaint. 
Write in a professional medical style using proper medical terminology.
"""
    
    # Set up the messages
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": prompt}
    ]
    
    # Set up request parameters
    request_params = {
        "model": params.get('model', 'gpt-4o'),
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 800,
    }
    
    try:
        # Make the API call
        logging.info(f"Generating present illness with chief complaint: {chief_complaint}")
        response = client.chat.completions.create(**request_params)
        
        if not response or not response.choices or len(response.choices) == 0:
            raise ValueError("Empty response received from OpenAI API")
            
        content = response.choices[0].message.content
        
        if not content:
            raise ValueError("Empty content received from OpenAI API")
        
        # Return the generated present illness with metadata
        return {
            'success': True,
            'present_illness': content,
            'metadata': {
                'generated_at': datetime.utcnow().isoformat(),
                'model_used': params.get('model', 'gpt-4o'),
                'parameters': {
                    'chief_complaint': chief_complaint,
                    'patient_age': age,
                    'patient_gender': gender,
                }
            }
        }
        
    except Exception as e:
        logging.error(f"Error generating present illness: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

def extract_diagnoses_from_assessment(assessment_text):
    """
    Extract possible diagnoses from assessment section
    
    Args:
        assessment_text (str): Text from assessment section
        
    Returns:
        list: List of potential diagnoses
    """
    # Simple implementation - in a real system this would be more sophisticated
    diagnoses = []
    
    # Common patterns for diagnoses in assessment
    diagnosis_patterns = [
        r'(diagnos\w+):?\s*(.*?)(?:\.|$)',
        r'(impression):?\s*(.*?)(?:\.|$)',
        r'(\d+\.\s*)(.*?)(?:\.|$)',
        r'(assessment):?\s*(.*?)(?:\.|$)'
    ]
    
    for pattern in diagnosis_patterns:
        matches = re.finditer(pattern, assessment_text, re.IGNORECASE)
        for match in matches:
            if len(match.groups()) >= 2:
                diagnosis = match.group(2).strip()
                if diagnosis and len(diagnosis) > 3:  # Avoid short/meaningless matches
                    diagnoses.append(diagnosis)
    
    # If no diagnoses found with patterns, take the first sentence
    if not diagnoses and assessment_text:
        first_sentence = assessment_text.split('.')[0].strip()
        if first_sentence:
            diagnoses.append(first_sentence)
    
    return diagnoses