from datetime import datetime
from app import db

class MedicalSpecialty(db.Model):
    """Medical specialties for categorizing cases"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    
    # Relationship with cases
    cases = db.relationship('MedicalCase', backref='specialty', lazy=True)
    
    def __repr__(self):
        return f"<MedicalSpecialty {self.name}>"

class MedicalCase(db.Model):
    """Model for storing generated medical cases"""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    
    # Patient details
    patient_age = db.Column(db.Integer, nullable=True)
    patient_gender = db.Column(db.String(20), nullable=True)
    
    # Case content
    chief_complaint = db.Column(db.Text, nullable=False)
    history_present_illness = db.Column(db.Text, nullable=True)
    past_medical_history = db.Column(db.Text, nullable=True)
    medications = db.Column(db.Text, nullable=True)
    allergies = db.Column(db.Text, nullable=True)
    family_history = db.Column(db.Text, nullable=True)
    social_history = db.Column(db.Text, nullable=True)
    physical_examination = db.Column(db.Text, nullable=True)
    vital_signs = db.Column(db.Text, nullable=True)
    laboratory_results = db.Column(db.Text, nullable=True)
    imaging_results = db.Column(db.Text, nullable=True)
    assessment = db.Column(db.Text, nullable=True)
    plan = db.Column(db.Text, nullable=True)
    
    # Relations and metadata
    specialty_id = db.Column(db.Integer, db.ForeignKey('medical_specialty.id'), nullable=True)
    diagnoses = db.relationship('Diagnosis', backref='case', lazy=True, cascade="all, delete-orphan")
    
    # Generation parameters
    prompt_used = db.Column(db.Text, nullable=True)
    system_message = db.Column(db.Text, nullable=True)
    ai_model = db.Column(db.String(50), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<MedicalCase {self.title}>"
    
    def to_dict(self):
        """Convert the medical case to a dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'patient_age': self.patient_age,
            'patient_gender': self.patient_gender,
            'chief_complaint': self.chief_complaint,
            'history_present_illness': self.history_present_illness,
            'past_medical_history': self.past_medical_history,
            'medications': self.medications,
            'allergies': self.allergies,
            'family_history': self.family_history,
            'social_history': self.social_history,
            'physical_examination': self.physical_examination,
            'vital_signs': self.vital_signs,
            'laboratory_results': self.laboratory_results,
            'imaging_results': self.imaging_results,
            'assessment': self.assessment,
            'plan': self.plan,
            'specialty': self.specialty.name if self.specialty else None,
            'diagnoses': [diagnosis.name for diagnosis in self.diagnoses],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

class Diagnosis(db.Model):
    """Model for storing diagnoses associated with cases"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    icd_code = db.Column(db.String(20), nullable=True) # International Classification of Diseases code
    
    # Relationship with medical case
    case_id = db.Column(db.Integer, db.ForeignKey('medical_case.id'), nullable=False)
    
    def __repr__(self):
        return f"<Diagnosis {self.name}>"
        
    def to_dict(self):
        """Convert the diagnosis to a dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icd_code': self.icd_code
        }

class CaseTemplate(db.Model):
    """Model for storing reusable case templates"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Template content (as a system message or prompt)
    system_message = db.Column(db.Text, nullable=True)
    prompt_template = db.Column(db.Text, nullable=False)
    
    # For which specialty this template is relevant
    specialty_id = db.Column(db.Integer, db.ForeignKey('medical_specialty.id'), nullable=True)
    specialty = db.relationship('MedicalSpecialty')
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<CaseTemplate {self.name}>"
        
    def to_dict(self):
        """Convert the template to a dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'system_message': self.system_message,
            'prompt_template': self.prompt_template,
            'specialty': self.specialty.name if self.specialty else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }