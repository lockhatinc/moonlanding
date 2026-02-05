#!/bin/bash

# Start the dev server in the background
cd /home/user/lexco/moonlanding
npm run dev > /tmp/server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Check if server is running
if ! curl -s http://localhost:3004 > /dev/null 2>&1; then
  echo "Server failed to start"
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

echo "Server started successfully (PID: $SERVER_PID)"

# Run the workflow tests
node execute-all-workflows.js

# Capture exit code
EXIT_CODE=$?

# Clean up server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

exit $EXIT_CODE
