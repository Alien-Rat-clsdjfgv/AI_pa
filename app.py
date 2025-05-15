import os
import logging
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix

# Initialize application
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure database (SQLite for simplicity)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///openai_tester.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize database
db.init_app(app)

# Import models and create database tables
with app.app_context():
    # Import models
    from models import TestCase, TestRun
    from models.medical_case import MedicalCase, MedicalSpecialty, Diagnosis, CaseTemplate
    
    # Make sure templates directory exists
    if not os.path.exists(os.path.join(app.root_path, 'templates', 'medical')):
        os.makedirs(os.path.join(app.root_path, 'templates', 'medical'))
    
    # Create database tables
    db.create_all()
    logging.debug("Database tables created")

# Import routes directly
import routes
from routes import *

# Import medical routes
try:
    import routes.medical_routes
    from routes.medical_routes import *
    logging.debug("Medical routes imported successfully")
except ImportError as e:
    logging.error(f"Error importing medical routes: {e}")

# Add Jinja2 filter to convert new lines to <br> tags
@app.template_filter('nl2br')
def nl2br(value):
    if value:
        return value.replace('\n', '<br>')
    return value

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
