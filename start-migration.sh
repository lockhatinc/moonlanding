#!/bin/bash

# Complete Migration Pipeline Execution
# Phases 3.5 - 3.10

cd /home/user/lexco/moonlanding

echo "=========================================="
echo "COMPLETE MIGRATION PIPELINE EXECUTION"
echo "=========================================="
echo "Started: $(date)"
echo ""

npm run dev &
DEV_PID=$!

sleep 5

echo "Dev server started (PID: $DEV_PID)"
echo ""

# Execute migration
echo "Executing migration orchestrator..."
node execute-all-phases-real.js

MIGRATION_RESULT=$?

echo ""
echo "Migration completed with status: $MIGRATION_RESULT"

# Kill dev server
kill $DEV_PID 2>/dev/null || true

exit $MIGRATION_RESULT
