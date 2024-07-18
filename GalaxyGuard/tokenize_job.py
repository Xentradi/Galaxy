# GalaxyGuard/tokenize_job.py
import boto3
import logging
import os
import sagemaker
import tarfile
from sagemaker.pytorch import PyTorch
from sagemaker.utils import sagemaker_timestamp

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create SageMaker session
try:
    logger.info("Creating SageMaker session in the us-west-2 region...")
    sagemaker_session = sagemaker.Session(boto3.Session(region_name='us-west-2'))
    logger.info("SageMaker session created successfully.")
except Exception as e:
    logger.error(f"Failed to create SageMaker session: {e}")
    exit(1)

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
            tar.add('source', arcname='')  # Ensure the tarball has the correct structure
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

# Define PyTorch estimator for tokenization
try:
    logger.info("Creating PyTorch estimator for tokenization...")
    estimator = PyTorch(
        entry_point='tokenize.py',
        source_dir=source_s3_uri,
        role='arn:aws:iam::730335179217:role/SageMakerExecutionRole',
        framework_version='1.13.1',
        py_version='py39',
        image_uri='763104351884.dkr.ecr.us-west-2.amazonaws.com/pytorch-training:2.3.0-gpu-py311',
        instance_count=1,
        instance_type='ml.p3.2xlarge',
        use_spot_instances=True,
        max_wait=86400,
        sagemaker_session=sagemaker_session,
    )
    logger.info("PyTorch estimator for tokenization created successfully.")
except Exception as e:
    logger.error(f"Failed to create PyTorch estimator for tokenization: {str(e)}")
    exit(1)

# Start tokenization job
try:
    logger.info("Starting tokenization job...")
    estimator.fit()
    logger.info("Tokenization job started successfully.")
except Exception as e:
    logger.error(f"Failed to start tokenization job: {str(e)}")
    exit(1)
finally:
    logger.info("Tokenization job has been submitted.")
