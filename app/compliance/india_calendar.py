"""
Indian Compliance Calendar — Vaani's core moat feature.

Complete database of every GST, TDS, Income Tax, ROC, SEBI, PF/ESIC
deadline in the Indian financial calendar. No other product has this.

Financial Year: April 1 — March 31
"""

from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Optional
import calendar

import structlog

log = structlog.get_logger(__name__)


@dataclass
class ComplianceDeadline:
    code: str                       # e.g. "GSTR1_OCT"
    name: str                       # e.g. "GSTR-1 (October)"
    description: str
    due_date: date
    compliance_type: str            # GST | TDS | Income Tax | ROC | SEBI | PF
    period: str                     # "October 2024"
    penalty_per_day: float = 0      # INR
    penalty_note: str = ""
    applicable_to: list = field(default_factory=lambda: ["all"])  # all | monthly | quarterly | aif | pvt_ltd
    filing_url: str = ""
    is_critical: bool = False       # Highest priority


def get_compliance_calendar(
    year: int,
    month: int,
    business_type: str = "msme",
    is_quarterly_gst: bool = False,
) -> list[ComplianceDeadline]:
    """
    Generate all compliance deadlines for a given month.
    Returns sorted list by due_date.
    """
    deadlines = []
    fy = _get_fy(year, month)

    # ── GST ───────────────────────────────────────────────────────────────────

    if not is_quarterly_gst:
        # GSTR-1 Monthly (outward supplies) — 11th of following month
        prev_month, prev_year = _prev_month(year, month)
        prev_period = _month_name(prev_month, prev_year)
        deadlines.append(ComplianceDeadline(
            code=f"GSTR1_{prev_period.upper().replace(' ', '_')}",
            name=f"GSTR-1 ({prev_period})",
            description="File outward supplies statement for the previous month.",
            due_date=_safe_date(year, month, 11),
            compliance_type="GST",
            period=prev_period,
            penalty_per_day=50,     # ₹50/day late fee
            penalty_note="₹50/day (₹20/day for nil return). Max ₹10,000",
            is_critical=True,
            filing_url="https://gst.gov.in",
        ))

        # GSTR-3B Monthly (summary return + payment) — 20th of following month
        deadlines.append(ComplianceDeadline(
            code=f"GSTR3B_{prev_period.upper().replace(' ', '_')}",
            name=f"GSTR-3B ({prev_period})",
            description="File monthly summary return and pay GST liability.",
            due_date=_safe_date(year, month, 20),
            compliance_type="GST",
            period=prev_period,
            penalty_per_day=50,
            penalty_note="₹50/day + 18% interest on tax due",
            is_critical=True,
            filing_url="https://gst.gov.in",
        ))
    else:
        # GSTR-1 Quarterly (QRMP scheme) — due 13th of month after quarter end
        quarter_end_months = {1: "Q3", 4: "Q4", 7: "Q1", 10: "Q2"}
        if month in quarter_end_months:
            q_name = quarter_end_months[month]
            deadlines.append(ComplianceDeadline(
                code=f"GSTR1_QRMP_{q_name}_{year}",
                name=f"GSTR-1 QRMP ({q_name} {fy})",
                description="Quarterly GSTR-1 for QRMP scheme taxpayers.",
                due_date=_safe_date(year, month, 13),
                compliance_type="GST",
                period=f"{q_name} {fy}",
                penalty_per_day=50,
                applicable_to=["quarterly"],
                filing_url="https://gst.gov.in",
            ))

    # GST ITC-04 (job work) — quarterly, 25th of following month
    if month in (4, 7, 10, 1):
        deadlines.append(ComplianceDeadline(
            code=f"ITC04_{_get_quarter(year, month)}",
            name=f"GST ITC-04 ({_get_quarter(year, month)})",
            description="Statement of goods sent/received for job work.",
            due_date=_safe_date(year, month, 25),
            compliance_type="GST",
            period=_get_quarter(year, month),
            applicable_to=["manufacturer"],
        ))

    # ── TDS ───────────────────────────────────────────────────────────────────

    # TDS/TCS payment — 7th of every month (for previous month deductions)
    prev_month2, prev_year2 = _prev_month(year, month)
    deadlines.append(ComplianceDeadline(
        code=f"TDS_PAY_{_month_name(prev_month2, prev_year2).upper().replace(' ', '_')}",
        name=f"TDS Payment ({_month_name(prev_month2, prev_year2)})",
        description="Deposit TDS/TCS deducted in previous month to government.",
        due_date=_safe_date(year, month, 7),
        compliance_type="TDS",
        period=_month_name(prev_month2, prev_year2),
        penalty_per_day=0,
        penalty_note="1.5% per month interest + 1% if not deducted",
        is_critical=True,
        filing_url="https://www.tdscpc.gov.in",
    ))

    # TDS Returns quarterly
    tds_quarter_months = {7: "Q1", 10: "Q2", 1: "Q3", 5: "Q4"}  # filing month: quarter
    if month in tds_quarter_months:
        q = tds_quarter_months[month]
        deadlines.append(ComplianceDeadline(
            code=f"TDS_RETURN_{q}_{fy}",
            name=f"TDS Return {q} ({fy})",
            description=f"File quarterly TDS return (Form 24Q/26Q) for {q} {fy}.",
            due_date=_safe_date(year, month, 31 if month != 5 else 31),
            compliance_type="TDS",
            period=f"{q} {fy}",
            penalty_per_day=200,   # ₹200/day under Section 234E
            penalty_note="₹200/day under Sec 234E. Max = TDS amount",
            is_critical=True,
            filing_url="https://www.tdscpc.gov.in",
        ))

    # ── Advance Tax ───────────────────────────────────────────────────────────

    advance_tax = {
        (6, 15): ("Q1 Advance Tax", "15% of annual tax liability"),
        (9, 15): ("Q2 Advance Tax", "45% of annual tax liability (cumulative)"),
        (12, 15): ("Q3 Advance Tax", "75% of annual tax liability (cumulative)"),
        (3, 15): ("Q4 Advance Tax / Final", "100% of annual tax liability"),
    }
    if (month, 15) in advance_tax or any(m == month for m, _ in advance_tax):
        for (adv_month, adv_day), (name, desc) in advance_tax.items():
            if adv_month == month:
                deadlines.append(ComplianceDeadline(
                    code=f"ADVANCE_TAX_{adv_month}_{year}",
                    name=name,
                    description=f"Pay {desc}. Applies if tax liability > ₹10,000.",
                    due_date=_safe_date(year, month, adv_day),
                    compliance_type="Income Tax",
                    period=f"FY {fy}",
                    penalty_note="1% per month interest under Sec 234B/234C",
                    is_critical=True,
                    applicable_to=["all"],
                    filing_url="https://www.incometax.gov.in",
                ))

    # ── Income Tax ────────────────────────────────────────────────────────────

    # ITR filing (non-audit) — July 31
    if month == 7:
        deadlines.append(ComplianceDeadline(
            code=f"ITR_{fy}",
            name=f"ITR Filing (Non-Audit) FY {fy}",
            description="File Income Tax Return for non-audit cases.",
            due_date=date(year, 7, 31),
            compliance_type="Income Tax",
            period=f"FY {fy}",
            penalty_per_day=0,
            penalty_note="₹5,000 late fee (₹1,000 if income < ₹5L). Interest u/s 234A",
            is_critical=True,
            filing_url="https://www.incometax.gov.in",
        ))

    # ITR filing (audit cases) — October 31
    if month == 10:
        deadlines.append(ComplianceDeadline(
            code=f"ITR_AUDIT_{fy}",
            name=f"ITR Filing (Tax Audit) FY {fy}",
            description="File ITR for companies and tax audit cases.",
            due_date=date(year, 10, 31),
            compliance_type="Income Tax",
            period=f"FY {fy}",
            penalty_per_day=0,
            penalty_note="₹5,000 late fee + 1.5%/month interest u/s 234A",
            applicable_to=["pvt_ltd", "llp", "partnership"],
            filing_url="https://www.incometax.gov.in",
        ))

    # Tax Audit Report (Form 3CA/3CB) — September 30
    if month == 9:
        deadlines.append(ComplianceDeadline(
            code=f"TAX_AUDIT_{fy}",
            name=f"Tax Audit Report (Form 3CA/3CB) FY {fy}",
            description="CA-certified audit report for taxpayers with turnover above threshold.",
            due_date=date(year, 9, 30),
            compliance_type="Income Tax",
            period=f"FY {fy}",
            penalty_per_day=0,
            penalty_note="₹1.5 lakh or 0.5% of turnover (lower) under Sec 271B",
            applicable_to=["pvt_ltd", "llp"],
            filing_url="https://www.incometax.gov.in",
        ))

    # ── ROC / MCA ─────────────────────────────────────────────────────────────

    # MGT-7 (Annual Return) — 60 days from AGM (AGM by Sep 30, so MGT-7 by Nov 29)
    if month == 11:
        deadlines.append(ComplianceDeadline(
            code=f"MGT7_{fy}",
            name=f"MGT-7 Annual Return FY {fy}",
            description="Annual Return filing for Private Limited Companies.",
            due_date=date(year, 11, 29),
            compliance_type="ROC",
            period=f"FY {fy}",
            penalty_per_day=100,    # ₹100/day for small companies
            penalty_note="₹100/day for small companies. ₹200/day for others",
            applicable_to=["pvt_ltd"],
            filing_url="https://www.mca.gov.in",
        ))

    # AOC-4 (Financial Statements) — 30 days from AGM (by Oct 29)
    if month == 10:
        deadlines.append(ComplianceDeadline(
            code=f"AOC4_{fy}",
            name=f"AOC-4 Financial Statements FY {fy}",
            description="Filing audited financial statements with MCA.",
            due_date=date(year, 10, 29),
            compliance_type="ROC",
            period=f"FY {fy}",
            penalty_per_day=100,
            applicable_to=["pvt_ltd"],
            filing_url="https://www.mca.gov.in",
        ))

    # DIR-3 KYC — September 30 (annual KYC for directors)
    if month == 9:
        deadlines.append(ComplianceDeadline(
            code=f"DIR3KYC_{year}",
            name="DIR-3 KYC (Director KYC)",
            description="Annual KYC for all directors with DIN allotted.",
            due_date=date(year, 9, 30),
            compliance_type="ROC",
            period=str(year),
            penalty_per_day=0,
            penalty_note="₹5,000 penalty for non-filing. DIN deactivated",
            applicable_to=["pvt_ltd", "director"],
            filing_url="https://www.mca.gov.in",
        ))

    # ── PF / ESIC ─────────────────────────────────────────────────────────────

    # PF payment — 15th of every month
    deadlines.append(ComplianceDeadline(
        code=f"PF_{_month_name(prev_month2, prev_year2).upper().replace(' ', '_')}",
        name=f"PF Contribution ({_month_name(prev_month2, prev_year2)})",
        description="Deposit Employee + Employer PF contribution (12% + 12% of basic).",
        due_date=_safe_date(year, month, 15),
        compliance_type="PF",
        period=_month_name(prev_month2, prev_year2),
        penalty_note="12% penal interest on delayed payments",
        applicable_to=["employer_20plus"],
        filing_url="https://unifiedportal-mem.epfindia.gov.in",
    ))

    # ESIC — 15th of every month
    deadlines.append(ComplianceDeadline(
        code=f"ESIC_{_month_name(prev_month2, prev_year2).upper().replace(' ', '_')}",
        name=f"ESIC Contribution ({_month_name(prev_month2, prev_year2)})",
        description="Deposit ESI contribution (3.25% employer + 0.75% employee).",
        due_date=_safe_date(year, month, 15),
        compliance_type="PF",
        period=_month_name(prev_month2, prev_year2),
        applicable_to=["employer_10plus"],
        filing_url="https://www.esic.in",
    ))

    # ── SEBI (Tier 3 — AIF/PMS) ──────────────────────────────────────────────

    if business_type in ("aif", "pms", "investment_advisor"):
        sebi_quarters = {4: "Q4", 7: "Q1", 10: "Q2", 1: "Q3"}
        if month in sebi_quarters:
            q = sebi_quarters[month]
            deadlines.append(ComplianceDeadline(
                code=f"SEBI_AIF_{q}_{fy}",
                name=f"SEBI AIF Quarterly Report ({q})",
                description="File quarterly report with SEBI for AIF/Cat I, II, III.",
                due_date=_safe_date(year, month, 10),
                compliance_type="SEBI",
                period=f"{q} {fy}",
                penalty_note="SEBI may impose monetary penalty or cancel registration",
                applicable_to=["aif"],
                is_critical=True,
                filing_url="https://www.sebi.gov.in",
            ))

        if month == 7:  # Annual AIF disclosure
            deadlines.append(ComplianceDeadline(
                code=f"SEBI_AIF_ANNUAL_{fy}",
                name=f"SEBI AIF Annual Disclosure ({fy})",
                description="Annual portfolio disclosure, NAV certification, investor report.",
                due_date=date(year, 7, 31),
                compliance_type="SEBI",
                period=f"FY {fy}",
                applicable_to=["aif"],
                is_critical=True,
                filing_url="https://www.sebi.gov.in",
            ))

    return sorted(deadlines, key=lambda d: d.due_date)


def get_upcoming_deadlines(
    days_ahead: int = 30,
    business_type: str = "msme",
) -> list[ComplianceDeadline]:
    """Get all deadlines in the next N days."""
    today = date.today()
    result = []

    # Check current and next month
    for offset in range(2):
        check_date = today + timedelta(days=30 * offset)
        month_deadlines = get_compliance_calendar(
            year=check_date.year,
            month=check_date.month,
            business_type=business_type,
        )
        for d in month_deadlines:
            if 0 <= (d.due_date - today).days <= days_ahead:
                result.append(d)

    return sorted(result, key=lambda d: d.due_date)


def get_upcoming_deadlines_text(days_ahead: int = 30, business_type: str = "msme") -> str:
    """Format upcoming deadlines for WhatsApp message."""
    deadlines = get_upcoming_deadlines(days_ahead, business_type)
    today = date.today()

    if not deadlines:
        return f"✅ No compliance deadlines in the next {days_ahead} days. You're all clear!"

    lines = [f"📅 *Upcoming Compliance ({days_ahead} days)*\n"]
    for d in deadlines[:8]:  # max 8 in one message
        days_left = (d.due_date - today).days
        if days_left == 0:
            emoji = "🔴"
            urgency = "TODAY"
        elif days_left <= 3:
            emoji = "🔴"
            urgency = f"{days_left}d left"
        elif days_left <= 7:
            emoji = "🟡"
            urgency = f"{days_left}d left"
        else:
            emoji = "🟢"
            urgency = f"{days_left}d left"

        lines.append(f"{emoji} *{d.name}*")
        lines.append(f"   Due: {d.due_date.strftime('%d %b')} ({urgency})")
        if d.penalty_note and days_left <= 7:
            lines.append(f"   ⚠️ {d.penalty_note[:60]}")
        lines.append("")

    lines.append("_Reply DONE to mark any as complete_")
    lines.append("_Powered by Vaani — vaani.app_")
    return "\n".join(lines)


async def handle_compliance_query(text: str, user_context: dict, language: str = "en") -> dict:
    """Handle a compliance-related query from the router."""
    from app.ai.intent import answer_compliance_query
    answer = await answer_compliance_query(text, user_context, language)
    return {"summary": answer, "is_compliance": True}


async def seed_user_compliance_reminders(
    user_id: str,
    business_type: str,
    notion_access_token: str,
    workspace_meta: dict,
    db,
) -> int:
    """
    Seed 3 months of compliance reminders for a new user.
    Creates records in DB and Notion compliance tracker.
    """
    from app.models import ComplianceReminder
    from app.integrations.notion import create_compliance_entry

    today = date.today()
    added = 0

    for month_offset in range(3):
        check = today + timedelta(days=30 * month_offset)
        deadlines = get_compliance_calendar(
            year=check.year,
            month=check.month,
            business_type=business_type,
        )

        for dl in deadlines:
            if dl.due_date < today:
                continue

            reminder = ComplianceReminder(
                user_id=user_id,
                compliance_type=dl.code,
                due_date=datetime.combine(dl.due_date, datetime.min.time()),
                description=f"{dl.name}: {dl.description}",
                period=dl.period,
            )
            db.add(reminder)

            # Also add to Notion
            if notion_access_token and workspace_meta:
                await create_compliance_entry(
                    access_token=notion_access_token,
                    workspace_meta=workspace_meta,
                    filing_name=dl.name,
                    due_date=dl.due_date.isoformat(),
                    compliance_type=dl.compliance_type,
                    period=dl.period,
                    penalty_per_day=dl.penalty_per_day,
                )
            added += 1

    await db.flush()
    return added


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_fy(year: int, month: int) -> str:
    """Get financial year string. Apr 2024 - Mar 2025 → '2024-25'"""
    if month >= 4:
        return f"{year}-{str(year + 1)[2:]}"
    else:
        return f"{year - 1}-{str(year)[2:]}"


def _prev_month(year: int, month: int) -> tuple[int, int]:
    if month == 1:
        return 12, year - 1
    return month - 1, year


def _month_name(month: int, year: int) -> str:
    return datetime(year, month, 1).strftime("%B %Y")


def _get_quarter(year: int, month: int) -> str:
    fy = _get_fy(year, month)
    if month in (4, 5, 6):
        return f"Q1 {fy}"
    elif month in (7, 8, 9):
        return f"Q2 {fy}"
    elif month in (10, 11, 12):
        return f"Q3 {fy}"
    else:
        return f"Q4 {fy}"


def _safe_date(year: int, month: int, day: int) -> date:
    """Return date, adjusting if day exceeds month's days."""
    max_day = calendar.monthrange(year, month)[1]
    return date(year, month, min(day, max_day))
