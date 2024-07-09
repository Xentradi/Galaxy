# GalaxyGuard/trainModel.py
import numpy as np
import pickle
import logging
import tensorflow as tf
import keras_tuner as kt
import os
from tensorflow import keras
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from datasets import load_dataset
from sklearn.model_selection import train_test_split

# Custom logging handler for TensorFlow logs
class TensorFlowLoggingHandler(logging.Handler):
    def emit(self, record):
        tf.get_logger().log(record.levelno, record.getMessage())

class CustomLoggingCallback(tf.keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs=None):
        logging.info(f"Epoch {epoch+1}: loss = {logs['loss']:.4f}, accuracy = {logs['accuracy']:.4f}, val_loss = {logs['val_loss']:.4f}, val_accuracy = {logs['val_accuracy']:.4f}")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', handlers=[
    logging.FileHandler("training.log"),
    logging.StreamHandler()
])
logger = logging.getLogger()

# Configure TensorFlow logging
tf_logger = tf.get_logger()
tf_logger.propagate = False
tf_logger.addHandler(TensorFlowLoggingHandler())
tf_logger.setLevel(logging.ERROR)

def load_and_combine_datasets():
  logging.info("Loading datasets...")
  toxic_conversations = load_dataset("SetFit/toxic_conversations")
  toxic_chat = load_dataset("lmsys/toxic-chat", "toxicchat0124")
  jigsaw_toxicity = load_dataset("Arsive/toxicity_classification_jigsaw")

  # Extract texts and labels
  logging.info("Extracting training texts and lebels...")
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

  return train_texts, train_labels, test_texts, test_labels


def tokenize_texts(train_texts, test_texts, max_words=30000, maxlen=250):
  logging.info("Tokenizing texts...")
  tokenizer = Tokenizer(num_words=max_words)
  tokenizer.fit_on_texts(train_texts + test_texts)
  train_sequences = tokenizer.texts_to_sequences(train_texts)
  test_sequences = tokenizer.texts_to_sequences(test_texts)
  train_padded = pad_sequences(train_sequences, maxlen=maxlen)
  test_padded = pad_sequences(test_sequences, maxlen=maxlen)
  # Save the tokenizer
  with open('tokenizer.pickle', 'wb') as handle:
      pickle.dump(tokenizer, handle, protocol=pickle.HIGHEST_PROTOCOL)
  logging.info("Tokenizer saved.")
  return train_padded, test_padded, tokenizer

def load_tokenizer():
    logging.info("Loading the saved tokenizer...")
    with open('tokenizer.pickle', 'rb') as handle:
        tokenizer = pickle.load(handle)
    return tokenizer

def create_model(vocab_size, maxlen):
  logging.info("Creating model...")
  model = tf.keras.models.Sequential([
    tf.keras.layers.Embedding(vocab_size, 32),
    tf.keras.layers.LSTM(64, return_sequences=True),
    tf.keras.layers.LSTM(64),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')
  ])
  model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
  return model

def train_model(model, train_data, val_data, epochs=10, batch_size=32):
  logging.info("Training model...")
  callbacks = [
      tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=2, restore_best_weights=True),
      tf.keras.callbacks.ModelCheckpoint('GalaxyGuard.keras', monitor='val_loss', save_best_only=True),
      CustomLoggingCallback()
  ]
  history = model.fit(train_data, epochs=epochs, batch_size=batch_size, validation_data=val_data, callbacks=callbacks)
  return history

def save_model_and_tokenizer(model, tokenizer):
  logging.info("Saving the model...")
  model.save('GalaxyGuard.keras')
  logging.info("Saving the tokenizer...")
  with open('tokenizer.pickle', 'wb') as handle:
    pickle.dump(tokenizer, handle, protocol=pickle.HIGHEST_PROTOCOL)
  logging.info("Model and tokenizer saved successfully.")

def main():

    gpus = tf.config.experimental.list_physical_devices('GPU')
    if gpus:
      try:
        for gpu in gpus:
          tf.config.experimental.set_memory_growth(gpu, True)
          logging.info(f'Memory growth enabled for GPU {gpu}')
        logical_gpus = tf.config.experimental.list_logical_devices('GPU')
        print(f"{len(gpus)} physical GPUs, {len(logical_gpus)} logical GPUs")
      except RuntimeError as e:
        print(e)

    # Load and combine datasets
    train_texts, train_labels, test_texts, test_labels = load_and_combine_datasets()

    # Check if tokenizer is already available
    if os.path.exists('tokenizer.pickle'):
      logging.info("Tokenizer already available.")
      tokenizer = load_tokenizer()
      train_sequences = tokenizer.texts_to_sequences(train_texts)
      test_sequences = tokenizer.texts_to_sequences(test_texts)
      train_padded = pad_sequences(train_sequences, maxlen=250)
      test_padded = pad_sequences(test_sequences, maxlen=250)
    else:
      train_padded, test_padded, tokenizer = tokenize_texts(train_texts, test_texts)

    # Create datasets
    train_dataset = tf.data.Dataset.from_tensor_slices((train_padded, train_labels)).shuffle(len(train_padded)).batch(32)
    test_dataset = tf.data.Dataset.from_tensor_slices((test_padded, test_labels)).batch(32)

    # Define and create model
    model = create_model(20000, 250)

    # Train the model
    train_model(model, train_dataset, test_dataset)

    # Save model and tokenizer
    save_model_and_tokenizer(model, tokenizer)

if __name__ == "__main__":
    main()
