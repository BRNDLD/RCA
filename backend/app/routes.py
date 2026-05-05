from __future__ import annotations

from flask import Blueprint, jsonify, request
from sqlalchemy import select

from .db import get_session
from .models import RCA

api = Blueprint("api", __name__)


DEFAULT_OPTIONS = {
    "origins": [
        "Auditoría Externa",
        "Auditoría interna",
        "Inspecciones",
        "Reclamos",
        "Devoluciones",
        "Sugerencia",
        "Procesos",
        "Productos",
        "Indicadores",
        "Otros",
    ],
    "systems": [
        "SG",
        "Calidad",
        "Ambiental",
        "Inocuidad",
        "Seguridad y Salud en el trabajo",
        "PBIP",
        "BASC",
        "Plan Estratégico Seguridad Vial",
        "Otros",
    ],
    "actionTypes": ["Correctiva", "Mejora"],
    "yesNo": ["SÍ", "NO"],
    "categories": {
        "Proceso": ["Mano de Obra", "Método", "Máquina", "Materia Prima", "Medio Ambiente", "Medición"],
        "Producto": ["Especificaciones", "Presentación", "Capacidad", "Ensayos de Control", "Almacenamiento"],
        "Negocio": [
            "Estructura Operativa",
            "Estructura Funcional",
            "Estructura Estratégica",
            "Estructura Administrativa",
            "Estructura Financiera",
            "Aseguramiento de Calidad",
        ],
        "Mano de Obra": [
            "Capacitación",
            "Competencia",
            "Compromiso",
            "Entrenamiento",
            "Dominio sobre el proceso",
            "Seguimiento a la eficacia",
            "Incumplimiento al Procedimiento",
            "Otros",
        ],
    },
}


@api.get("/health")
def health():
    return jsonify({"ok": True})


@api.get("/options")
def options():
    return jsonify(DEFAULT_OPTIONS)


@api.get("/rcas")
def list_rcas():
    status = request.args.get("status")

    with get_session() as session:
        stmt = select(RCA).order_by(RCA.updated_at.desc())
        if status:
            stmt = stmt.where(RCA.status == status)
        rows = session.execute(stmt).scalars().all()
        return jsonify([r.to_dict() for r in rows])


@api.post("/rcas")
def create_rca():
    data = request.get_json(silent=True) or {}

    rca = RCA()
    _apply_payload(rca, data)

    with get_session() as session:
        session.add(rca)
        session.flush()
        return jsonify(rca.to_dict()), 201


@api.get("/rcas/<int:rca_id>")
def get_rca(rca_id: int):
    with get_session() as session:
        rca = session.get(RCA, rca_id)
        if rca is None:
            return jsonify({"error": "not_found"}), 404
        return jsonify(rca.to_dict())


@api.put("/rcas/<int:rca_id>")
def update_rca(rca_id: int):
    data = request.get_json(silent=True) or {}

    with get_session() as session:
        rca = session.get(RCA, rca_id)
        if rca is None:
            return jsonify({"error": "not_found"}), 404

        _apply_payload(rca, data)
        session.add(rca)
        session.flush()
        return jsonify(rca.to_dict())


@api.post("/rcas/<int:rca_id>/publish")
def publish_rca(rca_id: int):
    with get_session() as session:
        rca = session.get(RCA, rca_id)
        if rca is None:
            return jsonify({"error": "not_found"}), 404
        rca.status = "published"
        session.add(rca)
        session.flush()
        return jsonify(rca.to_dict())


def _apply_payload(rca: RCA, data: dict) -> None:
    sam = data.get("sam") or {}
    rca.sam_date = str(sam.get("date", rca.sam_date) or "")
    rca.process = str(sam.get("process", rca.process) or "")
    rca.origin = str(sam.get("origin", rca.origin) or "")
    rca.department = str(sam.get("department", rca.department) or "")
    rca.investigation_lead = str(sam.get("investigationLead", rca.investigation_lead) or "")
    rca.role = str(sam.get("role", rca.role) or "")

    rca.title = str(data.get("title", rca.title) or "")
    rca.finding = str(data.get("finding", rca.finding) or "")
    rca.facts_description = str(data.get("factsDescription", rca.facts_description) or "")
    rca.reference = str(data.get("reference", rca.reference) or "")
    rca.where_happened = str(data.get("whereHappened", rca.where_happened) or "")
    rca.quantity = str(data.get("quantity", rca.quantity) or "")

    rca.severity = str(data.get("severity", rca.severity) or "")
    rca.impact_type = str(data.get("impactType", rca.impact_type) or "")
    rca.lost_time = str(data.get("lostTime", rca.lost_time) or "")
    rca.estimated_cost = str(data.get("estimatedCost", rca.estimated_cost) or "")
    rca.recurrence = str(data.get("recurrence", rca.recurrence) or "")

    rca.methodology = str(data.get("methodology", rca.methodology) or "")
    rca.problem_statement = str(data.get("problemStatement", rca.problem_statement) or "")

    rca.why_generated = str(data.get("whyGenerated", rca.why_generated) or "")
    rca.why_not_detected = str(data.get("whyNotDetected", rca.why_not_detected) or "")
    rca.root_cause = str(data.get("rootCause", rca.root_cause) or "")
    rca.root_category = str(data.get("rootCategory", rca.root_category) or "")
