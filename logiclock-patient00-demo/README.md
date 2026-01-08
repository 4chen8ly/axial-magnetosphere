# LogicLock Demo: Synthetic Patient Zero

**Status:** INTERNAL / DO NOT DISTRIBUTE
**Objective:** Proof of "False Compliance" failure mode in standard CI/Agent workflows.

## The Problem: False Compliance
Modern CI systems rely on exit codes and text logs. If an AI agent or automation script *says* it did a safety check (via logs) but skips the actual execution code, standard CI tools mark it as **PASSED**.

This demo creates a "False Compliance" scenario:
1.  **Agent**: Prints `[INFO] Validation successful.`
2.  **Reality**: The `validate_input` function is never called.
3.  **Baseline CI**: ✅ **PASSES** (Dangerous).

## The Solution: LogicLock Enforcement
LogicLock validates the **Execution Trace** (what actually happened) against a strict policy, ignoring the text logs.

1.  **Trace**: Records that only `run_preflight_checks` and `deploy_prod` occurred.
2.  **LogicLock CI**: ❌ **BLOCKS** (Safe).

## Repository Structure

- `app/agent.py`: The buggy agent script.
- `traces/example_trace.json`: The evidence. Missing `validate_input`.
- `.github/workflows/`:
    - `ci_baseline.yml`: The failing (unsafe) pipeline.
    - `ci_logiclock.yml`: The correct (safe) pipeline.

## Usage

**1. Run Baseline (Unsafe)**
```bash
python app/agent.py
# Output: [INFO] Validation successful.
# Exit Code: 0 (PASS)
```

**2. Run LogicLock (Safe)**
```bash
logiclock enforce --policy require_validation --trace traces/example_trace.json
# Output: BLOCKED. Reason: Required action 'validate_input' not present.
# Exit Code: 1 (FAIL)
```
