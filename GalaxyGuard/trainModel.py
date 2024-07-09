# GalaxyGuard/trainModel.py
import numpy as np
import pickle
import logging
import nltk
import nlpaug.augmenter.word as naw
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from scikeras.wrappers import KerasClassifier
from sklearn.model_selection import GridSearchCV
from datasets import load_dataset
from multiprocessing import Pool
from tqdm import tqdm

# Download necessary NLTK data
nltk.download('averaged_perceptron_tagger')
nltk.download('wordnet')

class CustomLoggingCallback(tf.keras.callbacks.Callback):
    def on_epoch_end(self, epoch, logs=None):
        logging.info(f"Epoch {epoch+1}: loss = {logs['loss']:.4f}, accuracy = {logs['accuracy']:.4f}, val_loss = {logs['val_loss']:.4f}, val_accuracy = {logs['val_accuracy']:.4f}")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', handlers=[
    logging.FileHandler("training.log"),
    logging.StreamHandler()
])

# Define global augmentation function
aug = naw.SynonymAug(aug_src='wordnet', aug_max=3)

def augment_text(text, n=3):
    return aug.augment(text, n=n)

def augment_batch(batch):
    texts, labels = batch
    augmented_texts = []
    augmented_labels = []
    for text, label in zip(texts, labels):
        augmented_variations = augment_text(text, n=3)
        augmented_texts.extend(augmented_variations)
        augmented_labels.extend([label] * len(augmented_variations))
    return augmented_texts, augmented_labels

def create_model(learning_rate=0.001, dropout_rate=0.5):
    model = tf.keras.models.Sequential([
        tf.keras.layers.Embedding(20000, 128, input_length=250),
        tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(64, return_sequences=True)),
        tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(64)),
        tf.keras.layers.GlobalAveragePooling1D(),
        tf.keras.layers.Dense(64, activation='relu'),
        tf.keras.layers.Dropout(dropout_rate),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(loss='binary_crossentropy', optimizer=optimizer, metrics=['accuracy'])
    return model

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

    # Data augmentation
    logging.info("Performing data augmentation...")

    # Prepare batches for multiprocessing
    batch_size = 1000
    batches = [(all_texts[i:i+batch_size], all_labels[i:i+batch_size]) for i in range(0, len(all_texts), batch_size)]

    # Parallelize data augmentation
    augmented_texts = []
    augmented_labels = []

    logging.info("Starting data augmentation...")
    with Pool() as pool:
        for texts, labels in tqdm(pool.imap(augment_batch, batches), total=len(batches)):
            augmented_texts.extend(texts)
            augmented_labels.extend(labels)

    # Collect augmented texts and labels
    all_texts.extend(augmented_texts)
    all_labels = np.concatenate((all_labels, augmented_labels))

    # Tokenize the texts
    logging.info("Tokenizing the texts...")
    tokenizer = Tokenizer(num_words=30000)
    tokenizer.fit_on_texts(all_texts)
    sequences = tokenizer.texts_to_sequences(all_texts)
    padded_sequences = pad_sequences(sequences, maxlen=250)

    # Define the model
    logging.info("Defining the model...")

    model = KerasClassifier(build_fn=create_model, epochs=10, batch_size=32, verbose=0)

    # Define the hyperparameter grid
    param_grid = {
        'build_fn__learning_rate': [0.001, 0.01, 0.1],
        'build_fn__dropout_rate': [0.2, 0.5, 0.7],
        'batch_size': [32, 64]
    }

    # Perform grid search
    logging.info("Performing grid search...")
    grid = GridSearchCV(estimator=model, param_grid=param_grid, n_jobs=-1, cv=3, verbose=1)
    grid_result = grid.fit(padded_sequences, all_labels)
    best_params = grid_result.best_params_

    # Print the best hyperparameters and score
    logging.info("Best Hyperparameters: %s" % best_params)
    logging.info("Best Score: %.2f" % grid_result.best_score_)

    # Define the final model with the best hyperparameters
    logging.info("Defining the final model with best hyperparameters...")
    final_model = create_model(learning_rate=best_params['build_fn__learning_rate'], dropout_rate=best_params['build_fn__dropout_rate'])

    # Compile the final model
    logging.info("Compiling the final model...")
    optimizer = tf.keras.optimizers.Adam(learning_rate=best_params['build_fn__learning_rate'])
    final_model.compile(loss='binary_crossentropy', optimizer=optimizer, metrics=['accuracy'])

    # Add callbacks for better training monitoring and early stopping
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=2, restore_best_weights=True),
        tf.keras.callbacks.ModelCheckpoint('GalaxyGuard.keras', monitor='val_loss', save_best_only=True),   # Save the best model during training
        CustomLoggingCallback()
    ]

    # Train the model
    logging.info("Training the model... (This may take a while)")
    final_model.fit(padded_sequences, all_labels, epochs=10, batch_size=best_params['batch_size'], shuffle=True, validation_split=0.2, callbacks=callbacks)

    # Save the model
    logging.info("Saving the model...")
    final_model.save('GalaxyGuard.keras')

    # Save the tokenizer
    logging.info("Saving the tokenizer...")
    with open('tokenizer.pickle', 'wb') as handle:
        pickle.dump(tokenizer, handle, protocol=pickle.HIGHEST_PROTOCOL)
    logging.info("Tokenizer saved.")

if __name__ == "__main__":
    main()
