import json
import logging
from openai import OpenAI
from utils import get_api_key
from models.medical_case import MedicalCase, QuestionnaireItem

def generate_questions_for_case(case_id):
    """
    Generate recommended questions and exams for a medical case based on its details
    
    Args:
        case_id (int): ID of the medical case
        
    Returns:
        dict: Generated questionnaire items and metadata
    """
    api_key = get_api_key()
    if not api_key:
        raise ValueError("API key is required")
    
    # Get the case
    case = MedicalCase.query.get(case_id)
    if not case:
        raise ValueError(f"Case with ID {case_id} not found")
    
    client = OpenAI(api_key=api_key)
    
    # Build context from case data
    case_context = f"""
Medical Case Information:
- Patient: {case.patient_age} year old {case.patient_gender}
- Chief Complaint: {case.chief_complaint}
- Specialty: {case.specialty.name if case.specialty else "General"}

{case.history_present_illness or ""}

{case.past_medical_history or ""}

{case.medications or ""}

{case.allergies or ""}

{case.physical_examination or ""}

{case.vital_signs or ""}
"""
    
    # Create the prompt
    prompt = f"""Based on the following medical case information, please generate:
1. A list of 10-15 important questions to ask this patient during the clinical interview
2. A list of 5-10 recommended physical examination procedures to perform
3. A short paragraph suggesting a logical order/flow for the clinical questioning

Respond in JSON format with the following structure:
{{
  "questions": ["Question 1", "Question 2", ...], 
  "exams": ["Exam 1", "Exam 2", ...],
  "questionnaire_flow": "Logical flow description..."
}}

Case Information:
{case_context}
"""
    
    system_message = """You are an experienced medical professional assisting with patient interviews. 
Generate relevant, focused, and clinically appropriate questions and physical examination procedures 
for the described patient case. Be specific and practical. Format your entire response as valid JSON."""
    
    try:
        # Make the API call
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=2000
        )
        
        # Parse the response
        content = response.choices[0].message.content if response.choices and response.choices[0].message else None
        if not content:
            logging.error("Empty or missing content in API response")
            raise ValueError("No content returned from OpenAI API")
            
        logging.info(f"Raw response content: {content}")
        
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            logging.error(f"JSON parse error: {str(e)}")
            logging.error(f"Content that failed to parse: {content}")
            # Try to fix common JSON errors
            try:
                # Sometimes the model might not properly close JSON structures
                fixed_content = content
                if fixed_content and not fixed_content.strip().endswith('}'):
                    fixed_content = fixed_content + '}'
                data = json.loads(fixed_content)
                logging.info("Successfully parsed JSON after fixing format")
            except:
                # If fixing fails, use default structure
                logging.error("Failed to fix JSON, using default structure")
                data = {
                    "questions": [
                        "What is the duration of your symptoms?",
                        "Have you experienced this before?",
                        "Are you taking any medications?",
                        "Do you have any known allergies?",
                        "Have you had any recent changes in your health?"
                    ],
                    "exams": [
                        "Check vital signs",
                        "Conduct physical examination relevant to complaints",
                        "Check for any visible abnormalities"
                    ],
                    "questionnaire_flow": "Start with open-ended questions about symptoms, then ask about medical history, finally conduct relevant physical examination."
                }
        
        # Validate response structure and provide defaults for missing keys
        for required_key in ['questions', 'exams', 'questionnaire_flow']:
            if required_key not in data:
                logging.warning(f"Missing required key in response: {required_key}")
                if required_key == 'questions':
                    data['questions'] = ["What is the nature of your symptoms?", 
                                        "When did your symptoms start?"]
                elif required_key == 'exams':
                    data['exams'] = ["General physical examination"]
                elif required_key == 'questionnaire_flow':
                    data['questionnaire_flow'] = "Ask general questions first, then conduct examination."
        
        # Store the generated items in the database
        save_questionnaire_items(case, data)
        
        return {
            'success': True,
            'data': data,
            'case_id': case_id
        }
        
    except Exception as e:
        logging.error(f"Error generating questionnaire: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'case_id': case_id
        }

def save_questionnaire_items(case, data):
    """
    Save questionnaire items to the database
    
    Args:
        case (MedicalCase): The medical case
        data (dict): Generated questionnaire data
    """
    from app import db
    
    try:
        # First delete any existing items
        QuestionnaireItem.query.filter_by(case_id=case.id).delete()
        
        # Add new items
        if 'questions' in data and isinstance(data['questions'], list):
            for i, question in enumerate(data['questions']):
                if question and isinstance(question, str):
                    item = QuestionnaireItem(
                        text=question,
                        item_type='question',
                        is_ai_generated=True,
                        priority=i,
                        case_id=case.id
                    )
                    db.session.add(item)
        
        if 'exams' in data and isinstance(data['exams'], list):
            for i, exam in enumerate(data['exams']):
                if exam and isinstance(exam, str):
                    item = QuestionnaireItem(
                        text=exam,
                        item_type='exam',
                        is_ai_generated=True,
                        priority=i,
                        case_id=case.id
                    )
                    db.session.add(item)
        
        db.session.commit()
        logging.info(f"Saved {len(data.get('questions', []))} questions and {len(data.get('exams', []))} exams for case {case.id}")
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error saving questionnaire items: {str(e)}")
        raise

def get_questionnaire_items(case_id):
    """
    Get questionnaire items for a case, or generate them if none exist
    
    Args:
        case_id (int): ID of the medical case
        
    Returns:
        dict: Questionnaire items and flow
    """
    # Get the case
    case = MedicalCase.query.get(case_id)
    if not case:
        raise ValueError(f"Case with ID {case_id} not found")
    
    # Check if items already exist
    questions = QuestionnaireItem.query.filter_by(case_id=case_id, item_type='question').order_by(QuestionnaireItem.priority).all()
    exams = QuestionnaireItem.query.filter_by(case_id=case_id, item_type='exam').order_by(QuestionnaireItem.priority).all()
    
    # If no items exist, generate them
    if not questions and not exams:
        result = generate_questions_for_case(case_id)
        if not result['success']:
            # Return empty lists if generation failed
            return {
                'questions': [],
                'exams': [],
                'questionnaire_flow': 'Failed to generate questionnaire items.'
            }
        
        # Refresh from database
        questions = QuestionnaireItem.query.filter_by(case_id=case_id, item_type='question').order_by(QuestionnaireItem.priority).all()
        exams = QuestionnaireItem.query.filter_by(case_id=case_id, item_type='exam').order_by(QuestionnaireItem.priority).all()
        
        # Get flow from result
        flow = result['data'].get('questionnaire_flow', '')
    else:
        # Use placeholders if items exist but no flow was saved
        # In a real system, you'd store the flow as well
        flow = """
        Begin with open-ended questions about the chief complaint. 
        Proceed to more specific questions about onset, duration, and severity. 
        Then explore past medical history, medications, and allergies.
        Complete the interview with review of systems and social history.
        """
    
    return {
        'questions': [q.text for q in questions],
        'exams': [e.text for e in exams],
        'questionnaire_flow': flow
    }

def save_selected_items(case_id, selected_questions, selected_exams):
    """
    Save selected questionnaire items
    
    Args:
        case_id (int): ID of the medical case
        selected_questions (list): List of selected question texts
        selected_exams (list): List of selected exam texts
        
    Returns:
        bool: Success status
    """
    from app import db
    
    try:
        # Reset all selections
        QuestionnaireItem.query.filter_by(case_id=case_id).update({'is_selected': False})
        
        # Update selected questions
        for question_text in selected_questions:
            items = QuestionnaireItem.query.filter_by(case_id=case_id, text=question_text, item_type='question').all()
            for item in items:
                item.is_selected = True
        
        # Update selected exams
        for exam_text in selected_exams:
            items = QuestionnaireItem.query.filter_by(case_id=case_id, text=exam_text, item_type='exam').all()
            for item in items:
                item.is_selected = True
        
        db.session.commit()
        return True
    except Exception as e:
        logging.error(f"Error saving selected items: {str(e)}")
        db.session.rollback()
        return False