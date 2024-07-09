# GalaxyGuard/trainModel.py
import numpy as np
import pickle
import logging
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from datasets import load_dataset
from sklearn.model_selection import train_test_split

class CustomLoggingCallback(tf.keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs=None):
        logging.info(f"Epoch {epoch+1}: loss = {logs['loss']:.4f}, accuracy = {logs['accuracy']:.4f}, val_loss = {logs['val_loss']:.4f}, val_accuracy = {logs['val_accuracy']:.4f}")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', handlers=[
    logging.FileHandler("training.log"),
    logging.StreamHandler()
])

def main():
    # Load datasets
    logging.info("Loading datasets...")
    toxic_conversations = load_dataset("SetFit/toxic_conversations")
    toxic_chat = load_dataset("lmsys/toxic-chat", "toxicchat0124")
    jigsaw_toxicity = load_dataset("Arsive/toxicity_classification_jigsaw")

    # Extract texts and labels from SetFit/toxic_conversations
    logging.info("Extracting texts and labels from SetFit/toxic_conversations...")
    setfit_texts = toxic_conversations['train']['text']
    setfit_labels = np.array(toxic_conversations['train']['label'])

    # Extract texts and labels from lmsys/toxic-chat
    logging.info("Extracting texts and labels from lmsys/toxic-chat...")
    toxicchat_texts = toxic_chat['train']['user_input']
    toxicchat_labels = np.array(toxic_chat['train']['toxicity'])

    # Extract texts and labels from Arsive/toxicity_classification_jigsaw
    logging.info("Extracting texts and labels from Arsive/toxicity_classification_jigsaw...")
    jigsaw_texts = jigsaw_toxicity['train']['comment_text']
    jigsaw_labels = np.array(
        (np.array(jigsaw_toxicity['train']['toxic']) | 
         np.array(jigsaw_toxicity['train']['severe_toxic']) | 
         np.array(jigsaw_toxicity['train']['obscene']) | 
         np.array(jigsaw_toxicity['train']['threat']) | 
         np.array(jigsaw_toxicity['train']['insult']) | 
         np.array(jigsaw_toxicity['train']['identity_hate'])).astype(int)
    )

    # Combine all texts and labels
    logging.info("Combining all texts and labels...")
    all_texts = list(setfit_texts) + list(toxicchat_texts) + list(jigsaw_texts)
    all_labels = np.concatenate((setfit_labels, toxicchat_labels, jigsaw_labels))

    # Tokenize the texts
    logging.info("Tokenizing the texts...")
    tokenizer = Tokenizer(num_words=30000)
    tokenizer.fit_on_texts(all_texts)
    sequences = tokenizer.texts_to_sequences(all_texts)
    padded_sequences = pad_sequences(sequences, maxlen=250)

    # Define the model
    logging.info("Defining the model...")

    def create_model():
      model = tf.keras.models.Sequential([
          tf.keras.layers.Embedding(10000, 16),
          tf.keras.layers.GlobalAveragePooling1D(),
          tf.keras.layers.Dense(16, activation='relu'),
          tf.keras.layers.Dense(6, activation='sigmoid')
      ])
      model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])
      return model

    model = create_model()

    # Add callbacks for better training monitoring and early stopping
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=2, restore_best_weights=True),
        tf.keras.callbacks.ModelCheckpoint('GalaxyGuard.keras', monitor='val_loss', save_best_only=True),   # Save the best model during training
        CustomLoggingCallback()
    ]

    # Train the model
    logging.info("Training the model... (This may take a while)")
    model.fit(padded_sequences, all_labels, epochs=10, callbacks=callbacks, validation_split=0.2)

    # Save the model
    logging.info("Saving the model...")
    model.save('GalaxyGuard.keras')

    # Save the tokenizer
    logging.info("Saving the tokenizer...")
    with open('tokenizer.pickle', 'wb') as handle:
        pickle.dump(tokenizer, handle, protocol=pickle.HIGHEST_PROTOCOL)
    logging.info("Tokenizer saved.")

if __name__ == "__main__":
    main()