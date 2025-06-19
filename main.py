from dotenv import load_dotenv
load_dotenv()

import logging
from app import app, db
from routes.original_routes import original_bp

# 註冊原始測試模組
app.register_blueprint(original_bp)

logging.basicConfig(level=logging.DEBUG)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
