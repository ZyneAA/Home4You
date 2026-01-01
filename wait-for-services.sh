#!/bin/sh
set -e

echo "Waiting for Redis..."
until nc -z redis 6379; do
    sleep 2
done

echo "Waiting for Mongo..."
until nc -z mongo 27017; do
    sleep 2
done

echo "All services ready. Starting app..."
exec "$@"
