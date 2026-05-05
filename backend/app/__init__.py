from __future__ import annotations

import os
from flask import Flask
from flask_cors import CORS

from .db import init_db
from .routes import api


def create_app() -> Flask:
    app = Flask(__name__)

    app.config["JSON_SORT_KEYS"] = False
    # Default DB: SQLite file in Flask instance folder.
    # Works for local dev and is compatible with Azure App Service (single instance).
    # For production persistence/scaling, set DATABASE_URL to a managed DB.
    from pathlib import Path

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    default_db_path = (Path(app.instance_path) / "rca.sqlite3").resolve()
    default_db_url = f"sqlite:///{default_db_path.as_posix()}"
    app.config["DATABASE_URL"] = os.environ.get("DATABASE_URL", default_db_url)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    init_db(app.config["DATABASE_URL"])
    app.register_blueprint(api, url_prefix="/api")

    return app
