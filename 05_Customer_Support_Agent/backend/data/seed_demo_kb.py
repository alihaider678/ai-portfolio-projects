"""
Seed the ChromaDB knowledge base with demo content on startup.
Only runs if the collection is empty — safe to call on every server start.
"""
import logging
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

DEMO_DOCUMENTS = [
    Document(
        page_content="""
NovaTech Pro — Company Overview

NovaTech Pro is a cloud-based SaaS platform providing AI-powered business automation tools
for enterprises. Founded in 2019, we serve over 5,000 companies across 40 countries.

CEO: Sarah Mitchell
CTO: James Okafor
Head of Customer Success: Priya Sharma
Headquarters: San Francisco, CA (with offices in Dubai and London)

Our core products:
- AutoFlow: workflow automation with AI decision-making
- DataBridge: real-time data integration across 200+ platforms
- InsightIQ: business intelligence and predictive analytics dashboard
- SupportBot: AI-powered customer support system (you are using it right now!)

Contact us:
- Support email: support@novatechpro.com
- Sales: sales@novatechpro.com
- Phone: +1 (800) 555-0192 (Mon–Fri, 9AM–6PM PT)
        """.strip(),
        metadata={"source": "company_overview", "category": "general"},
    ),
    Document(
        page_content="""
Refund and Cancellation Policy

At NovaTech Pro, we offer a 30-day money-back guarantee on all plans.

Eligibility:
- Requests must be submitted within 30 days of the original purchase date
- Applies to first-time subscriptions only (not renewals)
- Add-on purchases are non-refundable after 7 days

How to request a refund:
1. Log into your NovaTech Pro dashboard
2. Navigate to Account > Billing > Request Refund
3. Select the reason for your refund
4. Our team processes refunds within 5–7 business days

Cancellation:
- You may cancel your subscription at any time from Account > Settings > Cancel Plan
- Access continues until the end of the current billing period
- Cancellation does not automatically trigger a refund — submit a separate refund request if eligible
- Annual plans cancelled after 30 days receive a prorated credit toward future purchases (not cash refund)

If you are experiencing issues that led to your cancellation request, please contact our support
team first — we may be able to resolve the problem and retain your subscription.
        """.strip(),
        metadata={"source": "refund_policy", "category": "billing"},
    ),
    Document(
        page_content="""
Pricing Plans and Features

Starter Plan — $29/month (or $290/year, save 17%)
- Up to 3 users
- 10,000 API calls/month
- AutoFlow (up to 5 active workflows)
- Email support (48h response)
- 5 GB data storage

Professional Plan — $99/month (or $990/year, save 17%)
- Up to 20 users
- 100,000 API calls/month
- AutoFlow (unlimited workflows)
- DataBridge (up to 10 integrations)
- Priority email + chat support (4h response)
- 50 GB data storage
- Custom branding

Enterprise Plan — custom pricing
- Unlimited users
- Unlimited API calls
- All products included (AutoFlow, DataBridge, InsightIQ, SupportBot)
- Dedicated account manager
- 24/7 phone + email support (1h SLA)
- 500 GB+ data storage
- SSO/SAML, HIPAA compliance, custom contracts
- On-premises deployment option

All plans include a 14-day free trial — no credit card required.
Upgrade or downgrade at any time; changes take effect on the next billing cycle.
        """.strip(),
        metadata={"source": "pricing", "category": "billing"},
    ),
    Document(
        page_content="""
Technical Support and Troubleshooting

Common issues and solutions:

1. Login problems
   - Forgot password: use the "Reset Password" link on the login page
   - SSO issues: contact your IT admin to verify SAML configuration
   - Account locked after 5 failed attempts: wait 15 minutes or contact support

2. API integration errors
   - 401 Unauthorized: regenerate your API key in Account > Developer > API Keys
   - Rate limit exceeded: upgrade your plan or implement request throttling
   - Webhook failures: check your endpoint URL and ensure it returns HTTP 200

3. Workflow automation (AutoFlow)
   - Workflows not triggering: verify the trigger conditions in the workflow editor
   - Stuck tasks: check the execution logs under AutoFlow > History
   - Integration disconnected: reconnect in Settings > Integrations

4. Data not syncing (DataBridge)
   - Sync lag is normal (up to 5 minutes for standard plans)
   - Failed sync: check the source API credentials and permissions
   - Duplicate records: enable deduplication in DataBridge > Settings

System status and incident reports: status.novatechpro.com
Submit a support ticket: support.novatechpro.com/tickets
Live chat support (Professional and Enterprise only): available in the dashboard
        """.strip(),
        metadata={"source": "technical_support", "category": "support"},
    ),
    Document(
        page_content="""
Account Management and Security

Updating your account:
- Change email: Account > Profile > Email (requires email verification)
- Change password: Account > Security > Change Password
- Two-factor authentication (2FA): strongly recommended — enable in Account > Security > 2FA
- Billing information: Account > Billing > Payment Methods

Team management:
- Invite members: Account > Team > Invite Member (enter their email)
- Roles available: Owner, Admin, Editor, Viewer
- Remove a member: Account > Team > [member name] > Remove
- Owners can transfer ownership in Account > Team > Transfer Ownership

Data and privacy:
- Export all your data: Account > Privacy > Export Data (delivered within 24 hours)
- Delete your account: Account > Privacy > Delete Account (permanent, cannot be undone)
- NovaTech Pro is GDPR and CCPA compliant
- Data is encrypted at rest (AES-256) and in transit (TLS 1.3)
- We do not sell or share personal data with third parties

API keys and developer access:
- Generate API keys: Account > Developer > API Keys > New Key
- Keys can be scoped (read-only, read-write, admin)
- Rotate keys without downtime by creating a new key before deleting the old one
        """.strip(),
        metadata={"source": "account_management", "category": "account"},
    ),
    Document(
        page_content="""
Shipping and Physical Product Delivery

NovaTech Pro is primarily a software platform. However, we do ship physical items in specific cases:

Hardware tokens (for Enterprise MFA):
- Shipped via FedEx Express (2–3 business days within the US)
- International shipping: 5–10 business days (DHL)
- Tracking number provided within 24 hours of dispatch
- Free shipping on orders over $500; otherwise $12.99 standard / $24.99 express

Branded merchandise (swag kits for Enterprise customers):
- Delivered with account onboarding packages
- Customization takes 7–10 business days before shipping

Damaged or lost shipments:
- Report within 7 days of expected delivery date
- Email logistics@novatechpro.com with your order number and a photo of the damage
- Replacement shipped within 3 business days after verification

Returns for physical items:
- Must be returned within 14 days in original packaging
- Prepaid return label provided for defective items
- Customer pays return shipping for non-defective returns
        """.strip(),
        metadata={"source": "shipping_policy", "category": "shipping"},
    ),
]


def seed_if_empty() -> None:
    """Ingest demo documents into ChromaDB only if the collection is empty."""
    try:
        from vectorstore.chroma_store import get_vectorstore, ingest_documents
        vs = get_vectorstore()
        collection = vs._collection
        if collection.count() == 0:
            logger.info("[Seed] ChromaDB is empty — seeding demo knowledge base...")
            ingest_documents(DEMO_DOCUMENTS)
            logger.info(f"[Seed] Seeded {len(DEMO_DOCUMENTS)} demo documents successfully.")
        else:
            logger.info(f"[Seed] ChromaDB already has {collection.count()} chunks — skipping seed.")
    except Exception as e:
        logger.warning(f"[Seed] Seeding failed (non-fatal): {e}")