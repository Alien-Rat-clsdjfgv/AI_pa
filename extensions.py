from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase   # ← 這行必加！

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
