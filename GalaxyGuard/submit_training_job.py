import sagemaker
from sagemaker.pytorch import PyTorch

# Define S3 paths
s3_input_data = 's3://galaxyguard/data'
s3_output = 's3://galaxyguard/output'

# Create SageMaker session
sagemaker_session = sagemaker.Session()

# Define PyTorch estimator
estimator = PyTorch(
    entry_point='train.py',
    source_dir='.',
    role='arn:aws:iam::730335179217:role/SageMakerExecutionRole',
    framework_version='1.13',
    py_version='py311',
    instance_count=1,
    instance_type='ml.p3.2xlarge',
    hyperparameters={
        'num_train_epochs': 5,
        'learning_rate': 5e-5,
        'per_device_train_batch_size': 16,
    },
    sagemaker_session=sagemaker_session,
    output_path=s3_output,
)

# Start training job
estimator.fit({'train': s3_input_data, 'validation': s3_input_data})