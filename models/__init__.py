# Import all models here
from app import db
from datetime import datetime

class TestCase(db.Model):
    """Model for storing test cases"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    model = db.Column(db.String(50), nullable=False)
    prompt = db.Column(db.Text, nullable=False)
    system_message = db.Column(db.Text, nullable=True)
    temperature = db.Column(db.Float, default=0.7)
    max_tokens = db.Column(db.Integer, default=1000)
    top_p = db.Column(db.Float, default=1.0)
    frequency_penalty = db.Column(db.Float, default=0.0)
    presence_penalty = db.Column(db.Float, default=0.0)
    json_response = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    test_runs = db.relationship('TestRun', backref='test_case', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert test case to a dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'model': self.model,
            'prompt': self.prompt,
            'system_message': self.system_message,
            'temperature': self.temperature,
            'max_tokens': self.max_tokens,
            'top_p': self.top_p,
            'frequency_penalty': self.frequency_penalty,
            'presence_penalty': self.presence_penalty,
            'json_response': self.json_response,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

class TestRun(db.Model):
    """Model for storing test run results"""
    id = db.Column(db.Integer, primary_key=True)
    test_case_id = db.Column(db.Integer, db.ForeignKey('test_case.id'), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=True)
    duration_ms = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(20), default="running")  # running, completed, failed
    response = db.Column(db.Text, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    prompt_tokens = db.Column(db.Integer, nullable=True)
    completion_tokens = db.Column(db.Integer, nullable=True)
    total_tokens = db.Column(db.Integer, nullable=True)
    api_key_used = db.Column(db.Boolean, default=False)  # Track if using real API key
    
    def to_dict(self):
        """Convert test run to a dictionary"""
        return {
            'id': self.id,
            'test_case_id': self.test_case_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_ms': self.duration_ms,
            'status': self.status,
            'response': self.response,
            'error_message': self.error_message,
            'prompt_tokens': self.prompt_tokens,
            'completion_tokens': self.completion_tokens,
            'total_tokens': self.total_tokens,
            'api_key_used': self.api_key_used,
        }