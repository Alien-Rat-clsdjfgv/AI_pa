import os
import logging
from flask import Flask, redirect, url_for
from extensions import db, Base  # 由 extensions.py 統一管理 db、Base

# 初始化日誌
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

# 設定應用配置
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///test.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# 初始化數據庫
db.init_app(app)

# 主路由重定向到醫療模組
@app.route("/")
def index():
    return redirect(url_for("medical.medical_home"))

# 導入模型與 medical_routes 並註冊 Blueprint
with app.app_context():
    # 匯入並創建表
    import models  # 載入 models/__init__.py，裡面有你的其他 model
    from models.medical_case import MedicalCase, MedicalSpecialty, Diagnosis, CaseTemplate
    db.create_all()

    # 註冊 medical blueprint
    from routes.medical_routes import medical_bp
    app.register_blueprint(medical_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
