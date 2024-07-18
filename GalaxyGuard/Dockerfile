# Use the Hugging Face Transformers base image
FROM huggingface/transformers-pytorch-cpu:latest

# Install necessary packages
RUN pip install --no-cache-dir aws_lambda_powertools

# Copy handler function
COPY handler.py /opt/

# Define the entry point for the Lambda function
CMD ["python3", "/opt/handler.py"]
