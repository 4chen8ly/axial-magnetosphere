# LogicLock Patient 01: Non-Binding Validation Result

**Scenario**

A critical safety validation (`validate_input`) runs and fails. However, the agent logs a warning and proceeds to deploy anyway (`deploy_prod`), explicitly operating in a “permissive mode.” This failure pattern is common in legacy migrations and systems optimized for availability over correctness.

**Baseline Outcome**

✅ **CI Passed (Incorrectly)**
The agent script logged that validation failed but exited with code 0. Standard CI tooling treats the run as successful because it cannot distinguish between a compliant deployment and a permissive failure.

See: `baseline_pass.txt`

**LogicLock Outcome**

❌ **CI Blocked (Correctly)**
LogicLock analyzed the execution trace and detected that `deploy_prod` occurred despite `validate_input` having `status: "fail"`. This violated the enforced Binding Validation invariant, causing the pipeline to halt.

See: `logiclock_block.txt`

**Key Insight**

Checks that do not bind outcomes are theater.
If a system can fail a test and still ship, the test is not a gate—it is a suggestion.
LogicLock turns suggestions into laws.
