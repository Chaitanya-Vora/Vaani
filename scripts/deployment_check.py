import os
import sys

REQUIRED_VARS = [
    "GOOGLE_API_KEY",
    "DATABASE_URL",
    "NEXT_PUBLIC_API_URL",  # Critical for frontend
    "ENV",
]

def check():
    print("\n\033[94m━━━ Vaani Production Readiness Check ━━━\033[0m\n")
    missing = []
    for var in REQUIRED_VARS:
        val = os.getenv(var)
        if not val:
            missing.append(var)
            print(f"❌ {var:20} : MISSING")
        else:
            # Mask the value for security
            masked = val[:4] + "*" * (len(val) - 8) + val[-4:] if len(val) > 10 else "****"
            print(f"✅ {var:20} : SET ({masked})")
    
    if "NEXT_PUBLIC_API_URL" in missing:
        print("\n\033[91mCRITICAL ERROR: NEXT_PUBLIC_API_URL is missing.\033[0m")
        print("This MUST be set in your Vercel Dashboard Environment Variables.")
        print("Example: https://vaani-production.up.railway.app")
    
    if missing:
        print(f"\n\033[93mSummary: {len(missing)} variables missing.\033[0m")
        return False
    
    print("\n\033[92mAll critical variables are set locally. Ensure they match your cloud dashboard!\033[0m\n")
    return True

if __name__ == "__main__":
    check()
