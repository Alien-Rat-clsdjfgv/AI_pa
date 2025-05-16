import os
from flask import Flask, render_template, jsonify, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
import datetime
import json
import logging

# 初始化日誌
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)

# 設定應用配置
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# 初始化數據庫
db.init_app(app)

# 自定義模板過濾器
@app.template_filter("nl2br")
def nl2br(value):
    """將換行符轉換為HTML的<br>標籤"""
    if value:
        return value.replace("\n", "<br>")
    return ""

# 導入路由和模型
with app.app_context():
    # 導入路由模塊
    from routes.medical_routes import medical_bp
    from routes.original_routes import original_bp
    
    # 註冊藍圖
    app.register_blueprint(medical_bp)
    app.register_blueprint(original_bp)
    
    # 導入模型
    import models  # 原始模型
    from models.medical_case import MedicalCase, MedicalSpecialty, Diagnosis, CaseTemplate
    
    # 創建數據庫表
    db.create_all()

# 主路由重定向到醫療模塊
@app.route("/")
def index():
    return redirect(url_for("medical.medical_home"))

if __name__ == "__main__":
    # 使用端口8080而不是5000，以避免端口衝突
    app.run(host="0.0.0.0", port=8080, debug=True)

