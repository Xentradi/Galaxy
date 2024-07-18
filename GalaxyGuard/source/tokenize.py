# GalaxyGuard/source/tokenize.py
import os
import subprocess
import sys

subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
import pickle
from transformers import RobertaTokenizer
from datasets import Dataset
import boto3
import botocore

def download_from_s3(bucket_name, key, local_path):
    s3 = boto3.resource('s3')
    try:
        s3.Bucket(bucket_name).download_file(key, local_path)
        print(f'Successfully downloaded {key} to {local_path}')
    except botocore.exceptions.ClientError as e:
        if e.response['Error']['Code'] == '404':
            print(f'The object {key} does not exist.')
        else:
            raise

def upload_to_s3(bucket_name, local_path, key):
    s3 = boto3.client('s3')
    try:
        s3.upload_file(local_path, bucket_name, key)
        print(f'Successfully uploaded {local_path} to s3://{bucket_name}/{key}')
    except botocore.exceptions.ClientError as e:
        print(f'Failed to upload {local_path} to s3://{bucket_name}/{key}: {e}')

def load_datasets(data_dir):
    # Download data from S3
    bucket_name = 'galaxyguard'
    dataset_files = ['train_texts.pkl', 'train_labels.pkl', 'test_texts.pkl', 'test_labels.pkl']
    for file in dataset_files:
        download_from_s3(bucket_name, f'data/{file}', os.path.join(data_dir, file))

    # Load datasets from pickles
    with open(os.path.join(data_dir, 'train_texts.pkl'), 'rb') as f:
        train_texts = pickle.load(f)
    with open(os.path.join(data_dir, 'train_labels.pkl'), 'rb') as f:
        train_labels = pickle.load(f)
    with open(os.path.join(data_dir, 'test_texts.pkl'), 'rb') as f:
        test_texts = pickle.load(f)
    with open(os.path.join(data_dir, 'test_labels.pkl'), 'rb') as f:
        test_labels = pickle.load(f)

    # Create datasets
    train_dataset = Dataset.from_dict({'text': train_texts, 'label': train_labels})
    test_dataset = Dataset.from_dict({'text': test_texts, 'label': test_labels})

    return train_dataset, test_dataset

def preprocess_function(examples, tokenizer, maxlength):
    return tokenizer(examples['text'], truncation=True, padding=True, max_length=maxlength)

def save_tokenized_datasets(train_dataset, test_dataset, data_dir):
    # Save tokenized datasets
    train_dataset.save_to_disk(os.path.join(data_dir, 'tokenized_train'))
    test_dataset.save_to_disk(os.path.join(data_dir, 'tokenized_test'))
    # Upload tokenized datasets to S3
    upload_to_s3('galaxyguard', os.path.join(data_dir, 'tokenized_train'), 'tokenized/tokenized_train')
    upload_to_s3('galaxyguard', os.path.join(data_dir, 'tokenized_test'), 'tokenized/tokenized_test')

def main():
    data_dir = 'data'
    model_name = 'roberta-base'
    maxlength = 128
    preprocess_batch_size = 1000

    # Ensure data directory exists
    os.makedirs(data_dir, exist_ok=True)

    # Load datasets
    train_dataset, test_dataset = load_datasets(data_dir)

    tokenizer = RobertaTokenizer.from_pretrained(model_name)

    train_dataset = train_dataset.map(lambda x: preprocess_function(x, tokenizer, maxlength), batched=True, batch_size=preprocess_batch_size)
    test_dataset = test_dataset.map(lambda x: preprocess_function(x, tokenizer, maxlength), batched=True, batch_size=preprocess_batch_size)

    # Save tokenized datasets
    save_tokenized_datasets(train_dataset, test_dataset, data_dir)

if __name__ == '__main__':
    main()