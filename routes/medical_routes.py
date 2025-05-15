import logging
import json
from datetime import datetime
from flask import render_template, request, redirect, url_for, flash, jsonify, session
from app import app, db
from models.medical_case import MedicalCase, MedicalSpecialty, Diagnosis, CaseTemplate
from services.medical_case_generator import generate_medical_case, extract_diagnoses_from_assessment
from utils import get_api_key

@app.route('/index')
@app.route('/')
def index():
    """Alias for the original index route"""
    # Redirect to original index
    return redirect(url_for('medical_home'))

@app.route('/medical', methods=['GET'])
def medical_home():
    """Medical case generator home page"""
    # Check for API key connection
    api_key = get_api_key()
    api_connected = api_key is not None
    
    # Get medical specialties for dropdown
    specialties = MedicalSpecialty.query.order_by(MedicalSpecialty.name).all()
    
    # Get recent cases for display
    recent_cases = MedicalCase.query.order_by(MedicalCase.created_at.desc()).limit(5).all()
    
    # Get case templates for dropdown
    templates = CaseTemplate.query.order_by(CaseTemplate.name).all()
    
    return render_template(
        'medical/home.html',
        api_connected=api_connected,
        specialties=specialties,
        recent_cases=recent_cases,
        templates=templates
    )

@app.route('/medical/generate', methods=['POST'])
def generate_case():
    """Generate a medical case"""
    api_key = get_api_key()
    if not api_key:
        return jsonify({'success': False, 'message': 'API key is required'})
    
    data = request.get_json()
    save_case = data.get('save', False)
    
    # Prepare generation parameters
    params = {
        'specialty': data.get('specialty', ''),
        'chief_complaint': data.get('chief_complaint', ''),
        'patient_age': data.get('patient_age', 'adult'),
        'patient_gender': data.get('patient_gender', 'not specified'),
        'complexity': data.get('complexity', 'moderate'),
        'include_sections': data.get('include_sections', []),
        'model': data.get('model', 'gpt-4o'),
        'system_message': data.get('system_message', ''),
        'temperature': float(data.get('temperature', 0.7)),
        'max_tokens': int(data.get('max_tokens', 2000)),
    }
    
    try:
        # Generate the case
        result = generate_medical_case(params)
        
        if not result.get('success'):
            return jsonify({
                'success': False, 
                'message': result.get('error', 'Unknown error generating case')
            })
        
        case_data = result.get('case', {})
        metadata = result.get('metadata', {})
        
        # If requested to save the case, store it in the database
        if save_case:
            # Look up specialty (or create if not found)
            specialty = None
            specialty_name = params.get('specialty')
            if specialty_name:
                specialty = MedicalSpecialty.query.filter_by(name=specialty_name).first()
                if not specialty:
                    specialty = MedicalSpecialty(
                        name=specialty_name
                    )
                    db.session.add(specialty)
                    db.session.commit()
            
            # Create the case record
            patient_age = None
            try:
                patient_age = int(params.get('patient_age'))
            except (ValueError, TypeError):
                # Handle non-integer age values (e.g., "adult", "elderly")
                patient_age = None
                
            medical_case = MedicalCase(
                title=case_data.get('title', 'Untitled Case'),
                patient_age=patient_age,
                patient_gender=params.get('patient_gender'),
                chief_complaint=case_data.get('chief_complaint', ''),
                history_present_illness=case_data.get('history_of_present_illness') or case_data.get('history_present_illness', ''),
                past_medical_history=case_data.get('past_medical_history', ''),
                medications=case_data.get('medications', ''),
                allergies=case_data.get('allergies', ''),
                family_history=case_data.get('family_history', ''),
                social_history=case_data.get('social_history', ''),
                physical_examination=case_data.get('physical_examination', ''),
                vital_signs=case_data.get('vital_signs', ''),
                laboratory_results=case_data.get('laboratory_results', ''),
                imaging_results=case_data.get('imaging_results', ''),
                assessment=case_data.get('assessment', ''),
                plan=case_data.get('plan', ''),
                specialty_id=specialty.id if specialty else None,
                prompt_used=metadata.get('prompt_used', ''),
                system_message=metadata.get('system_message', ''),
                ai_model=metadata.get('model_used', 'gpt-4o')
            )
            
            db.session.add(medical_case)
            db.session.commit()
            
            # Extract and save diagnoses
            assessment_text = case_data.get('assessment', '')
            if assessment_text:
                diagnoses = extract_diagnoses_from_assessment(assessment_text)
                for diagnosis_name in diagnoses:
                    diagnosis = Diagnosis(
                        name=diagnosis_name,
                        case_id=medical_case.id
                    )
                    db.session.add(diagnosis)
                
                db.session.commit()
            
            # Add the case ID to the response
            result['case_id'] = medical_case.id
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        logging.error(f"Error generating medical case: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/medical/cases', methods=['GET'])
def list_cases():
    """List all medical cases"""
    cases = MedicalCase.query.order_by(MedicalCase.created_at.desc()).all()
    specialties = MedicalSpecialty.query.order_by(MedicalSpecialty.name).all()
    
    return render_template(
        'medical/cases.html',
        cases=cases,
        specialties=specialties
    )

@app.route('/medical/case/<int:id>', methods=['GET'])
def view_case(id):
    """View a specific medical case"""
    case = MedicalCase.query.get_or_404(id)
    return render_template('medical/view_case.html', case=case)

@app.route('/medical/case/<int:id>/questionnaire', methods=['GET'])
def case_questionnaire(id):
    """Generate and view questionnaire for a medical case"""
    from services.questionnaire_generator import get_questionnaire_items
    
    case = MedicalCase.query.get_or_404(id)
    
    try:
        questionnaire = get_questionnaire_items(id)
        return render_template(
            'medical/recommended_questions.html',
            case=case,
            recommended_questions=questionnaire['questions'],
            recommended_exams=questionnaire['exams'],
            questionnaire_flow=questionnaire['questionnaire_flow']
        )
    except Exception as e:
        flash(f'Error generating questionnaire: {str(e)}', 'danger')
        return redirect(url_for('view_case', id=id))

@app.route('/medical/save-questionnaire', methods=['POST'])
def save_questionnaire():
    """Save selected questionnaire items"""
    from services.questionnaire_generator import save_selected_items
    
    data = request.get_json()
    case_id = data.get('case_id')
    questions = data.get('questions', [])
    exams = data.get('exams', [])
    
    if not case_id:
        return jsonify({'success': False, 'message': 'Case ID is required'})
    
    try:
        success = save_selected_items(case_id, questions, exams)
        if success:
            return jsonify({'success': True, 'message': 'Questionnaire saved successfully'})
        else:
            return jsonify({'success': False, 'message': 'Failed to save questionnaire'})
    except Exception as e:
        logging.error(f"Error saving questionnaire: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/medical/case/<int:id>/delete', methods=['POST'])
def delete_case(id):
    """Delete a medical case"""
    case = MedicalCase.query.get_or_404(id)
    
    try:
        db.session.delete(case)
        db.session.commit()
        flash('Case deleted successfully', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting case: {str(e)}', 'danger')
    
    return redirect(url_for('list_cases'))

@app.route('/medical/specialties', methods=['GET'])
def list_specialties():
    """List all medical specialties"""
    specialties = MedicalSpecialty.query.all()
    return render_template('medical/specialties.html', specialties=specialties)

@app.route('/medical/specialty/add', methods=['POST'])
def add_specialty():
    """Add a new medical specialty"""
    name = request.form.get('name')
    description = request.form.get('description')
    
    if not name:
        flash('Specialty name is required', 'danger')
        return redirect(url_for('list_specialties'))
    
    try:
        specialty = MedicalSpecialty(
            name=name,
            description=description
        )
        db.session.add(specialty)
        db.session.commit()
        flash('Specialty added successfully', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error adding specialty: {str(e)}', 'danger')
    
    return redirect(url_for('list_specialties'))

@app.route('/medical/templates', methods=['GET'])
def list_templates():
    """List all case templates"""
    templates = CaseTemplate.query.all()
    specialties = MedicalSpecialty.query.all()
    return render_template('medical/templates.html', templates=templates, specialties=specialties)

@app.route('/medical/template/add', methods=['POST'])
def add_template():
    """Add a new case template"""
    data = request.form
    
    name = data.get('name')
    description = data.get('description')
    system_message = data.get('system_message')
    prompt_template = data.get('prompt_template')
    specialty_id = data.get('specialty_id')
    
    if not name or not prompt_template:
        flash('Template name and prompt template are required', 'danger')
        return redirect(url_for('list_templates'))
    
    try:
        template = CaseTemplate(
            name=name,
            description=description,
            system_message=system_message,
            prompt_template=prompt_template,
            specialty_id=specialty_id if specialty_id else None
        )
        db.session.add(template)
        db.session.commit()
        flash('Template added successfully', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error adding template: {str(e)}', 'danger')
    
    return redirect(url_for('list_templates'))

@app.route('/medical/template/<int:id>', methods=['GET'])
def view_template(id):
    """View a specific template"""
    template = CaseTemplate.query.get_or_404(id)
    return render_template('medical/view_template.html', template=template)

@app.route('/medical/template/<int:id>/delete', methods=['POST'])
def delete_template(id):
    """Delete a template"""
    template = CaseTemplate.query.get_or_404(id)
    
    try:
        db.session.delete(template)
        db.session.commit()
        flash('Template deleted successfully', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting template: {str(e)}', 'danger')
    
    return redirect(url_for('list_templates'))