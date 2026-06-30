from pydantic import BaseModel, Field


class PatientProfile(BaseModel):
    age: int = Field(default=40, ge=0, le=120, description="Patient age in years")
    renal_impairment: bool = Field(default=False, description="Reduced kidney function")
    hepatic_impairment: bool = Field(default=False, description="Reduced liver function")
    pregnant: bool = Field(default=False)
    conditions: list[str] = Field(default_factory=list, description="Active diagnoses e.g. ['hypertension', 'diabetes']")


class AnalyzeRequest(BaseModel):
    drugs: list[str] = Field(..., min_length=2, max_length=10, description="Drug names (generic or brand), 2–10 drugs")
    patient_profile: PatientProfile = Field(default_factory=PatientProfile)
    api_key: str = Field(..., min_length=20, description="OpenAI API key — never stored server-side")