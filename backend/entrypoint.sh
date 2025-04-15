#!/bin/sh
set -e

# Optional: run database migrations if you are using Alembic
# flask db upgrade

# Seed the database
echo "Seeding database..."
python seed_data.py

# Start Gunicorn server
echo "Starting application..."
gunicorn -w 4 -b 0.0.0.0:5000 run:app
