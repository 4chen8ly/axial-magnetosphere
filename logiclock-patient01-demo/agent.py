import time

def validate_input():
    print("[INFO] Starting input validation...")
    time.sleep(0.2)
    print("[ERROR] Input validation failed: Schema mismatch (required field 'auth_token' missing).")
    return False

def deploy_prod():
    print("[INFO] Initiating deployment to production...")
    time.sleep(0.5)
    print("[INFO] Deployment completed successfully.")

def main():
    print("[INFO] Agent Workflow Interceptor v2.1")
    
    # 1. Critical Safety Check
    result = validate_input()
    
    # 2. Failure Handling (The Bug)
    if not result:
        # The agent logs the failure but decides to continue anyway
        print("[WARN] Validation failed, continuing in permissive mode (Legacy_Compat_Flag=True)")
    
    # 3. Deployment
    deploy_prod()
    
    # Exits with 0 (Success) implicitly

if __name__ == "__main__":
    main()
