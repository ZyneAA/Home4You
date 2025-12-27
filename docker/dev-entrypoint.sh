#!/bin/sh
set -e

cleanup() {
    echo "Shutting down..."
    kill $BUILD_PID 2>/dev/null || true
    kill $SERVER_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Build once on startup
echo "Building application..."
npm run build

echo "Starting TypeScript watcher..."
nodemon --watch './src' --ext 'mts,ts,json' --exec 'npm run build' &
BUILD_PID=$!

sleep 3

# Start nodemon to watch build/ and restart server on changes
echo "Starting development server with hot reload..."
nodemon --watch './build' --ext 'mjs' --exec 'node ./build/index.mjs' &
SERVER_PID=$!

# Wait for both processes
wait $BUILD_PID $SERVER_PID
