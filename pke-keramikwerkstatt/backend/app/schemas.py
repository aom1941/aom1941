from pydantic import BaseModel


class Metric(BaseModel):
    label: str
    value: str
    note: str


class RoleCard(BaseModel):
    name: str
    focus: str
    permissions: list[str]


class PageCard(BaseModel):
    name: str
    purpose: str
    primary_actions: list[str]


class ModuleCard(BaseModel):
    slug: str
    title: str
    summary: str
    highlights: list[str]
    entities: list[str]


class AutomationCard(BaseModel):
    name: str
    trigger: str
    outcome: str


class PhaseCard(BaseModel):
    title: str
    goal: str
    deliverables: list[str]


class StackLayer(BaseModel):
    layer: str
    choice: str
    reason: str


class Blueprint(BaseModel):
    name: str
    promise: str
    scope: list[str]
    metrics: list[Metric]
    roles: list[RoleCard]
    pages: list[PageCard]
    modules: list[ModuleCard]
    automations: list[AutomationCard]
    phases: list[PhaseCard]
    stack: list[StackLayer]
