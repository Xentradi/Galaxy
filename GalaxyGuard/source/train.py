# GalaxyGuard/source/train.py
import os
import subprocess
import sys

subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

import boto3
import botocore
import pickle
import numpy as np
from transformers import RobertaForSequenceClassification, Trainer, TrainingArguments, RobertaTokenizer, TrainerCallback
from datasets import Dataset

class CustomCallback(TrainerCallback):
  def on_evaluate(self, args, state, control, **kwargs):
    eval_metrics = kwargs['eval_metrics']
    eval_loss = eval_metrics.get('eval_loss')
    if eval_loss is not None:
      print(f'eval_loss={eval_loss};')

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

def main():
  data_dir = 'data'
  model_name = 'roberta-base'
  output_dir = 'opt/ml/model'
  logging_dir = 'opt/ml/output/logs'
  maxlength = 256
  preprocess_batch_size = 10000

  # Ensure data directory exists
  os.makedirs(data_dir, exist_ok=True)
  # Ensure output directory exists
  os.makedirs(output_dir, exist_ok=True)

  # Load datasets
  train_dataset, test_dataset = load_datasets(data_dir)

  tokenizer = RobertaTokenizer.from_pretrained(model_name)

  train_dataset = train_dataset.map(lambda x: preprocess_function(x, tokenizer, maxlength), batched=True, batch_size=preprocess_batch_size)
  test_dataset = test_dataset.map(lambda x: preprocess_function(x, tokenizer, maxlength), batched=True, batch_size=preprocess_batch_size)

  model = RobertaForSequenceClassification.from_pretrained(model_name, num_labels=2)

  # Define training arguments
  training_args = TrainingArguments(
    output_dir=output_dir,
    num_train_epochs=int(os.environ.get('num_train_epochs', 3)),
    per_device_train_batch_size=int(os.environ.get('per_device_train_batch_size', 32)),
    learning_rate=float(os.environ.get('learning_rate', 5e-5)),
    per_device_eval_batch_size=32,
    evaluation_strategy="epoch",
    save_strategy="epoch",
    logging_dir=logging_dir,
    logging_steps=10,
    dataloader_num_workers=4,
    fp16=True,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    greater_is_better=False,
    save_total_limit=3,
    save_steps=500,
    checkpoint_s3_uri='s3://galaxyguard/checkpoints' 
  )

  # Define trainer
  trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    tokenizer=tokenizer,
    callbacks=[CustomCallback()],
  )

  checkpoint = None
  if os.path.exists(output_dir):
    checkpoints = sorted([os.path.join(output_dir, ckpt) for ckpt in os.listdir(output_dir) if ckpt.startswith('checkpoint-')])
    if checkpoints:
      checkpoint = checkpoints[-1]

  # Train the model
  trainer.train(resume_from_checkpoint=checkpoint)

  # Save the trained model
  trainer.save_model(output_dir)

if __name__ == '__main__':
    main()