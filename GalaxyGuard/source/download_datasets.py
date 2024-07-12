# GalaxyGuard/source/download_datasets.py
import numpy as np
import pickle
import logging
import os
from datasets import load_dataset

def download_and_save_datasets():
    logging.info("Loading datasets...")
    toxic_conversations = load_dataset("SetFit/toxic_conversations")
    toxic_chat = load_dataset("lmsys/toxic-chat", "toxicchat0124")
    jigsaw_toxicity = load_dataset("Arsive/toxicity_classification_jigsaw")

    # Extract texts and labels
    logging.info("Extracting training texts and labels...")
    train_texts = (
        list(toxic_conversations['train']['text']) + 
        list(toxic_chat['train']['user_input']) + 
        list(jigsaw_toxicity['train']['comment_text'])
    )
    train_labels = np.concatenate((
        np.array(toxic_conversations['train']['label']),
        np.array(toxic_chat['train']['toxicity']),
        (np.array(jigsaw_toxicity['train']['toxic']) | 
         np.array(jigsaw_toxicity['train']['severe_toxic']) | 
         np.array(jigsaw_toxicity['train']['obscene']) | 
         np.array(jigsaw_toxicity['train']['threat']) | 
         np.array(jigsaw_toxicity['train']['insult']) | 
         np.array(jigsaw_toxicity['train']['identity_hate'])).astype(int)
    ))

    # Extract test texts and labels
    logging.info("Extracting test texts and labels...")
    test_texts = (
        list(toxic_conversations['test']['text']) + 
        list(toxic_chat['test']['user_input']) + 
        list(jigsaw_toxicity['test']['comment_text'])
    )
    test_labels = np.concatenate((
        np.array(toxic_conversations['test']['label']),
        np.array(toxic_chat['test']['toxicity']),
        (np.array(jigsaw_toxicity['test']['toxic']) | 
         np.array(jigsaw_toxicity['test']['severe_toxic']) | 
         np.array(jigsaw_toxicity['test']['obscene']) | 
         np.array(jigsaw_toxicity['test']['threat']) | 
         np.array(jigsaw_toxicity['test']['insult']) | 
         np.array(jigsaw_toxicity['test']['identity_hate'])).astype(int)
    ))

    # Save datasets to disk
    with open('data/train_texts.pkl', 'wb') as f:
        pickle.dump(train_texts, f)
    with open('data/train_labels.pkl', 'wb') as f:
        pickle.dump(train_labels, f)
    with open('data/test_texts.pkl', 'wb') as f:
        pickle.dump(test_texts, f)
    with open('data/test_labels.pkl', 'wb') as f:
        pickle.dump(test_labels, f)

    logging.info("Datasets downloaded and saved to disk.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    download_and_save_datasets()
