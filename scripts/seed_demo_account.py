import asyncio
import os
import sys
import bcrypt
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete

# Add the app directory to the path so we can import models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import AsyncSessionLocal
from app.models import (
    User, Client, Idea, UserTask, AITask, IntentType, TaskPriority, 
    UserTaskStatus, TaskStatus, Subscription, PlanTier, PlanStatus,
    Expense, Invoice, ComplianceReminder, Message, MessageChannel, MessageType
)

async def seed_demo():
    print("🚀 Starting 'Premium Reality' 10-Feature Demo Seed...")
    async with AsyncSessionLocal() as db:
        # 1. Create Demo User
        demo_email = "demo@vaani.ai"
        result = await db.execute(select(User).where(User.email == demo_email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            # Delete related data first
            uid = existing_user.id
            await db.execute(delete(UserTask).where(UserTask.user_id == uid))
            await db.execute(delete(Client).where(Client.user_id == uid))
            await db.execute(delete(Idea).where(Idea.user_id == uid))
            await db.execute(delete(AITask).where(AITask.user_id == uid))
            await db.execute(delete(Subscription).where(Subscription.user_id == uid))
            await db.execute(delete(Expense).where(Expense.user_id == uid))
            await db.execute(delete(Invoice).where(Invoice.user_id == uid))
            await db.execute(delete(ComplianceReminder).where(ComplianceReminder.user_id == uid))
            await db.execute(delete(Message).where(Message.user_id == uid))
            await db.delete(existing_user)
            await db.commit()
            print(f"🧹 Cleaned existing {demo_email}")

        # Hash password
        raw_password = "VaaniDemo2024!"
        pw_hash = bcrypt.hashpw(raw_password.encode(), bcrypt.gensalt()).decode()

        demo_user = User(
            email=demo_email,
            name="Arjun Vora",
            hashed_password=pw_hash,
            business_name="Vora & Co. Ventures",
            business_type="startup",
            whatsapp_number="+919999888777",
            language_pref="en"
        )
        db.add(demo_user)
        await db.commit()
        await db.refresh(demo_user)
        uid = demo_user.id
        print(f"✅ User Created: {demo_email} ID: {uid}")

        # Add Subscription (Plan Pro)
        sub = Subscription(
            user_id=uid,
            plan=PlanTier.PRO,
            status=PlanStatus.ACTIVE,
            tasks_used_this_month=42,
            trial_ends_at=datetime.now(timezone.utc) + timedelta(days=365)
        )
        db.add(sub)

        # 2. FEATURE: Lead Sniper (Rich CRM Data)
        leads = [
            Client(user_id=uid, name="Siddharth Malhotra", company="Fintech Alpha", email="sid@fintechalpha.in", phone="+919820011223", tags=["High Intent", "CEO"], outstanding_amount=5000000, notes="Met at Bangalore Tech Summit. Interested in enterprise tier."),
            Client(user_id=uid, name="Anjali Sharma", company="Reliance Digital", email="anjali@ril.com", phone="+919850022334", tags=["Enterprise", "Director"], outstanding_amount=0, notes="Evaluating GST automation module."),
            Client(user_id=uid, name="Karan Johar", company="Dharma Productions", email="karan@dharma.com", phone="+919900033445", tags=["Media", "Promoter"], outstanding_amount=1200000, notes="Needs custom influencer payout workflow."),
        ]
        db.add_all(leads)
        print("✅ Feature 2: Lead Sniper Seeded.")

        # 3. FEATURE: Priority Tasks (Strategic Management)
        tasks = [
            UserTask(user_id=uid, description="Review Series A Term Sheet from Sequoia", status=UserTaskStatus.PENDING, priority=TaskPriority.HIGH, due_date=datetime.now(timezone.utc) + timedelta(days=1)),
            UserTask(user_id=uid, description="Finalize Marketing Videos for Vaani Launch", status=UserTaskStatus.PENDING, priority=TaskPriority.MEDIUM, due_date=datetime.now(timezone.utc) + timedelta(days=3)),
        ]
        db.add_all(tasks)
        print("✅ Feature 3: Priority Tasks Seeded.")

        # 4. FEATURE: Commitment Board (AITasks with Intent)
        commitments = [
            AITask(user_id=uid, intent=IntentType.COMMITMENT_CAPTURE, input_text="Share the hiring headcount plan with HR Head by EOD", result_data={"entities": {"client_name": "HR Head"}}, output_summary="Captured commitment to share headcount plan.", status=TaskStatus.COMPLETED, created_at=datetime.now(timezone.utc) - timedelta(hours=2)),
            AITask(user_id=uid, intent=IntentType.COMMITMENT_CAPTURE, input_text="Call Mr. Gupta about office lease renewal", result_data={"entities": {"client_name": "Mr. Gupta"}}, output_summary="Captured commitment to call landlord.", status=TaskStatus.PENDING, created_at=datetime.now(timezone.utc)),
        ]
        db.add_all(commitments)
        print("✅ Feature 4: Commitments Seeded.")

        # 5. FEATURE: Expense Logging (Real Money)
        expenses = [
            Expense(user_id=uid, amount_paise=450000, category="Meals", description="Client Dinner at Taj Land's End", vendor="Taj Hotels", expense_date=datetime.now(timezone.utc) - timedelta(days=1)),
            Expense(user_id=uid, amount_paise=120000, category="Travel", description="Uber to Mumbai Airport", vendor="Uber India", expense_date=datetime.now(timezone.utc) - timedelta(days=2)),
        ]
        db.add_all(expenses)
        print("✅ Feature 5: Expense Logging Seeded.")

        # 6. FEATURE: India Compliance (Automated Calendar)
        compliance = [
            ComplianceReminder(user_id=uid, compliance_type="GSTR-1", due_date=datetime.now(timezone.utc) + timedelta(days=11), description="Monthly GST Return for Vora & Co.", period="March 2024"),
            ComplianceReminder(user_id=uid, compliance_type="TDS Payment", due_date=datetime.now(timezone.utc) + timedelta(days=7), description="Monthly TDS Deposit", period="March 2024"),
            ComplianceReminder(user_id=uid, compliance_type="Income Tax Advance", due_date=datetime.now(timezone.utc) + timedelta(days=80), description="Q1 Advance Tax Payment", period="FY25 Q1"),
        ]
        db.add_all(compliance)
        print("✅ Feature 6: India Compliance Seeded.")

        # 7. FEATURE: Idea Vault (Seed Stage Innovation)
        ideas = [
            Idea(user_id=uid, content="AI-Native Legal Review Tool: Using LLMs to scan Indian legal documents for hidden clauses.", category="LegalTech"),
            Idea(user_id=uid, content="Voice-Based ERP for MSMEs: Managing inventory using just voice notes in local languages.", category="Innovation"),
        ]
        db.add_all(ideas)
        print("✅ Feature 7: Idea Vault Seeded.")

        # 8. FEATURE: Meeting Minutes & Voice Notes (AI History)
        notes_and_meetings = [
            AITask(user_id=uid, intent=IntentType.LOG_MEETING, input_text="Summary of meeting with Tech Team about AI Roadmap", output_summary="Drafted meeting minutes for AI Roadmap discussion.", status=TaskStatus.COMPLETED, created_at=datetime.now(timezone.utc) - timedelta(days=1)),
            AITask(user_id=uid, intent=IntentType.SAVE_NOTE, input_text="Reminder: Check GST portal for new notifications", output_summary="Saved note to Notion operational dashboard.", status=TaskStatus.COMPLETED, created_at=datetime.now(timezone.utc) - timedelta(hours=5)),
        ]
        db.add_all(notes_and_meetings)
        print("✅ Feature 8: Meeting Minutes Seeded.")

        # 9. FEATURE: Multi-Language (Hinglish Input Examples)
        hinglish_tasks = [
            AITask(user_id=uid, intent=IntentType.CREATE_TASK, input_text="Kal meeting hai Sharma ji ke saath, remind me.", output_summary="Created meeting reminder for Sharma ji.", status=TaskStatus.COMPLETED, created_at=datetime.now(timezone.utc) - timedelta(hours=1)),
        ]
        db.add_all(hinglish_tasks)
        print("✅ Feature 9: Hinglish Intelligence Seeded.")

        # 10. FEATURE: Invoice Generation (Professional Output)
        invoices = [
            Invoice(user_id=uid, invoice_number="VAA-2024-001", subtotal_paise=5000000, gst_paise=900000, total_paise=5900000, status="sent", due_date=datetime.now(timezone.utc) + timedelta(days=15), created_at=datetime.now(timezone.utc) - timedelta(days=5)),
            Invoice(user_id=uid, invoice_number="VAA-2024-002", subtotal_paise=1200000, gst_paise=216000, total_paise=1416000, status="draft", due_date=datetime.now(timezone.utc) + timedelta(days=30), created_at=datetime.now(timezone.utc)),
        ]
        db.add_all(invoices)
        print("✅ Feature 10: Invoice Generation Seeded.")

        await db.commit()
        print("\n✨ 10-FEATURE SEED COMPLETE! Vaani OS is ready for Videography.")

if __name__ == "__main__":
    asyncio.run(seed_demo())
