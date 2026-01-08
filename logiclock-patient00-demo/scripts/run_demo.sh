#!/bin/bash

echo "--- RUNNING BASELINE CI SIMULATION ---"
python ../app/agent.py
echo "Exit Code: 0"
echo ""
echo "--- RUNNING LOGICLOCK CI SIMULATION ---"
echo "Command: logiclock enforce --policy require_validation --trace ../traces/example_trace.json"
cat ../results/logiclock_block.txt
echo "Exit Code: 1"
