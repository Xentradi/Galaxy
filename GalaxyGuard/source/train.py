# GalaxyGuard/source/train.py
import os
import subprocess
import sys

subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

from transformers import RobertaForSequenceClassification, Trainer, TrainingArguments, RobertaTokenizer, TrainerCallback
from datasets import Dataset
import boto3
import botocore

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

def load_tokenized_datasets(data_dir):
    # Download tokenized datasets from S3
    bucket_name = 'galaxyguard'
    download_from_s3(bucket_name, 'tokenized/tokenized_train', os.path.join(data_dir, 'tokenized_train'))
    download_from_s3(bucket_name, 'tokenized/tokenized_test', os.path.join(data_dir, 'tokenized_test'))

    # Load tokenized datasets
    train_dataset = Dataset.load_from_disk(os.path.join(data_dir, 'tokenized_train'))
    test_dataset = Dataset.load_from_disk(os.path.join(data_dir, 'tokenized_test'))
    return train_dataset, test_dataset

def main():
    data_dir = 'data'
    model_name = 'roberta-base'
    output_dir = 'opt/ml/model'
    logging_dir = 'opt/ml/output/logs'

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Load tokenized datasets
    train_dataset, test_dataset = load_tokenized_datasets(data_dir)

    tokenizer = RobertaTokenizer.from_pretrained(model_name)

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
        save_steps=500
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

    # Train the model
    trainer.train()

    # Save the trained model
    trainer.save_model(output_dir)

if __name__ == '__main__':
    main()
