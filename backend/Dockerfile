# Use an official Python image as a base
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy backend files
COPY . /app

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the port your Flask app will run on
EXPOSE 5000

# Set the entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
