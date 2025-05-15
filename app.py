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

# Import routes after app is initialized to avoid circular imports
with app.app_context():
    from models import TestCase, TestRun
    import routes  # Import routes here to avoid circular imports
    db.create_all()
    logging.debug("Database tables created")

# Import route functions here to avoid circular imports
from routes import *

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
