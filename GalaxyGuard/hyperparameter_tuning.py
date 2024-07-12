# GalaxyGuard/hyparameter_tuning.py
import os
import subprocess
import sys

subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

import boto3
import logging
import sagemaker
import tarfile
from sagemaker.pytorch import PyTorch
from sagemaker.tuner import HyperparameterTuner, IntegerParameter, ContinuousParameter
from sagemaker.utils import sagemaker_timestamp

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define S3 paths
s3_input_data = 's3://galaxyguard/data'
s3_output = 's3://galaxyguard/output'

# Create SageMaker session
try:
  logger.info("Creating SageMaker session in the us-west-2 region...")
  sagemaker_session = sagemaker.Session(boto3.Session(region_name='us-west-2'))
  logger.info("SageMaker session created successfully.")
except Exception as e:
  logger.error(f"Failed to create SageMaker session: {e}")
  exit(1)

# Define hyperparameter ranges for tuning
hyperparameter_ranges = {
    'num_train_epochs': IntegerParameter(2, 16),
    'per_device_train_batch_size': IntegerParameter(8, 64),
    'learning_rate': ContinuousParameter(1e-5, 5e-5),
}

# Function to manually upload the code to S3
def upload_code_to_s3():
  try:
    logger.info("Uploading code to S3...")
    s3 = boto3.client('s3')
    tar_file = 'source.tar.gz'
    bucket = 'galaxyguard'
    key = f'source/{sagemaker_timestamp()}/{tar_file}'

    # Create a tarball of the source directory
    logging.info(f"Creating tarball: {tar_file}")
    with tarfile.open(tar_file, "w:gz") as tar:
      tar.add('source', arcname=os.path.basename('source'))
      logger.info(f"Tarball created: {tar_file}")

      # Upload the tarball to S3
      logger.info(f"Uploading {tar_file} to S3...")
      s3.upload_file(tar_file, bucket, key)
      logger.info(f"Tarball uploaded to S3: s3://{bucket}/{key}")

      # Delete the tarball
      os.remove(tar_file)
      logger.info(f"Tarball removed: {tar_file}")

      # Return the S3 path to the uploaded tarball
      return f's3://{bucket}/{key}'
      
  except Exception as e:
    logger.error(f"Failed to upload code to S3: {e}")
    exit(1)

try:
  # Upload code to S3 manually and set the source_dir to S3 path
  source_s3_uri = upload_code_to_s3()
  logger.info(f"Source directory set to: {source_s3_uri}")
except Exception as e:
  logger.error(f"Failed to set source directory: {e}")
  exit(1)

# Define PyTorch estimator
try:
  logger.info("Creating PyTorch estimator...")
  estimator = PyTorch(
    entry_point='train.py',
    source_dir=source_s3_uri,
    role='arn:aws:iam::730335179217:role/SageMakerExecutionRole',
    framework_version='1.13.1',
    py_version='py39',
    image_uri='763104351884.dkr.ecr.us-west-2.amazonaws.com/pytorch-training:2.3.0-gpu-py311',
    instance_count=1,
    instance_type='ml.p3.2xlarge',
    hyperparameters={
      'num_train_epochs': 3,  # Default value, will be overridden by hyperparameter tuning
      'per_device_train_batch_size': 16,  # Default value, will be overridden
      'learning_rate': 5e-5,  # Default value, will be overridden
    },
    sagemaker_session=sagemaker_session,
    output_path=s3_output,
    metric_definitions=[
      {'Name': 'eval_loss', 'Regex': 'eval_loss=(.*?);'}
    ],
  )
  logger.info("PyTorch estimator created successfully.")
except Exception as e:
  logger.error(f"Failed to create PyTorch estimator: {str(e)}")
  exit(1)

# Setup hyperparameter tuner
try:
  logger.info("Creating hyperparameter tuner...")
  tuner = HyperparameterTuner(
    estimator=estimator,
    objective_metric_name='eval_loss',
    objective_type='Minimize',
    hyperparameter_ranges=hyperparameter_ranges,
    max_jobs=20,
    max_parallel_jobs=1,
  )
  logger.info("Hyperparameter tuner created successfully.")
except Exception as e:
  logger.error(f"Failed to create hyperparameter tuner: {str(e)}")
  exit(1)

# Start hyperparameter tuning job
try:
  logger.info("Starting hyperparameter tuning job...")
  tuner.fit({'train': s3_input_data, 'validation': s3_input_data})
  logger.info("Hyperparameter tuning job started successfully.")
except Exception as e:
  logger.error(f"Failed to start hyperparameter tuning job: {str(e)}")
  exit(1)
finally:
    logger.info("Hyperparameter tuning job has been submitted.")
