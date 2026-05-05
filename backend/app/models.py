from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class RCA(Base):
    __tablename__ = "rcas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    status: Mapped[str] = mapped_column(String(16), default="draft")  # draft | published

    # IDENTIFICACIÓN (SAM)
    sam_date: Mapped[str] = mapped_column(String(32), default="")
    process: Mapped[str] = mapped_column(String(120), default="")
    origin: Mapped[str] = mapped_column(String(160), default="")
    department: Mapped[str] = mapped_column(String(160), default="")
    investigation_lead: Mapped[str] = mapped_column(String(160), default="")
    role: Mapped[str] = mapped_column(String(160), default="")

    # ALERTA / HALLAZGO
    title: Mapped[str] = mapped_column(String(200), default="")
    finding: Mapped[str] = mapped_column(Text, default="")
    facts_description: Mapped[str] = mapped_column(Text, default="")
    reference: Mapped[str] = mapped_column(String(200), default="")
    where_happened: Mapped[str] = mapped_column(String(200), default="")
    quantity: Mapped[str] = mapped_column(String(120), default="")

    severity: Mapped[str] = mapped_column(String(16), default="high")
    impact_type: Mapped[str] = mapped_column(String(32), default="Production")
    lost_time: Mapped[str] = mapped_column(String(64), default="")
    estimated_cost: Mapped[str] = mapped_column(String(64), default="")
    recurrence: Mapped[str] = mapped_column(String(32), default="First time")

    methodology: Mapped[str] = mapped_column(String(32), default="5whys")
    problem_statement: Mapped[str] = mapped_column(String(400), default="")
    why_generated: Mapped[str] = mapped_column(Text, default="")
    why_not_detected: Mapped[str] = mapped_column(Text, default="")
    root_cause: Mapped[str] = mapped_column(Text, default="")
    root_category: Mapped[str] = mapped_column(String(120), default="")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "status": self.status,
            "sam": {
                "date": self.sam_date,
                "process": self.process,
                "origin": self.origin,
                "department": self.department,
                "investigationLead": self.investigation_lead,
                "role": self.role,
            },
            "title": self.title,
            "finding": self.finding,
            "factsDescription": self.facts_description,
            "reference": self.reference,
            "whereHappened": self.where_happened,
            "quantity": self.quantity,
            "severity": self.severity,
            "impactType": self.impact_type,
            "lostTime": self.lost_time,
            "estimatedCost": self.estimated_cost,
            "recurrence": self.recurrence,
            "methodology": self.methodology,
            "problemStatement": self.problem_statement,
            "whyGenerated": self.why_generated,
            "whyNotDetected": self.why_not_detected,
            "rootCause": self.root_cause,
            "rootCategory": self.root_category,
            "createdAt": self.created_at.isoformat() + "Z",
            "updatedAt": self.updated_at.isoformat() + "Z",
        }
