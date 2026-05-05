from __future__ import annotations

import os
from flask import Flask
from flask_cors import CORS

from .db import init_db
from .routes import api


def create_app() -> Flask:
    app = Flask(__name__)

    app.config["JSON_SORT_KEYS"] = False
    # Default DB: SQLite in a writable folder.
    # IMPORTANT (Azure App Service + zip deploy): wwwroot may be read-only (run-from-package),
    # so we store data under $HOME which is writable/persistent.
    from pathlib import Path

    database_url_env = os.environ.get("DATABASE_URL")
    if database_url_env:
        app.config["DATABASE_URL"] = database_url_env
    else:
        is_app_service = bool(os.environ.get("WEBSITE_SITE_NAME") or os.environ.get("WEBSITE_INSTANCE_ID"))
        base_dir = Path(os.environ.get("HOME") or app.instance_path) if is_app_service else Path(app.instance_path)
        data_dir = base_dir / "rca-data"
        data_dir.mkdir(parents=True, exist_ok=True)
        default_db_path = (data_dir / "rca.sqlite3").resolve()
        default_db_url = f"sqlite:///{default_db_path.as_posix()}"
        app.config["DATABASE_URL"] = default_db_url

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    init_db(app.config["DATABASE_URL"])
    app.register_blueprint(api, url_prefix="/api")

    return app
