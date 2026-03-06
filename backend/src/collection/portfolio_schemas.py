"""Portfolio response schemas."""
from pydantic import BaseModel


class ChangeInfo(BaseModel):
    amount: float
    percent: float


class TCGSummary(BaseModel):
    tcg_slug: str
    value: float
    count: int


class PortfolioResponse(BaseModel):
    total_value: float
    currency: str
    daily_change: ChangeInfo
    weekly_change: ChangeInfo
    by_tcg: list[TCGSummary]
    top_gainers: list
    top_losers: list
