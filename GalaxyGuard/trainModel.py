# GalaxyGuard/trainModel.py
import pandas as pd
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np

# Load dataset
df = pd.read_csv('./TrainingData/toxicComments.csv')

# Extract the comments and labels
texts = df['comment_text'].astype(str).tolist()
labels = df[['toxic','severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']].values

# Tokenize and pad sequences
tokenizer = Tokenizer(num_words=10000)
tokenizer.fit_on_texts(texts)
sequences = tokenizer.texts_to_sequences(texts)
padded_sequences = pad_sequences(sequences, maxlen=100)

# Define the model
model = tf.keras.models.Sequential([
  tf.keras.layers.Embedding(10000, 16),
  tf.keras.layers.GlobalAveragePooling1D(),
  tf.keras.layers.Dense(16, activation='relu'),
  tf.keras.layers.Dense(6, activation='sigmoid')
])

model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])

# Train the model
model.fit(padded_sequences, labels, epochs=10, validation_split=0.2)

# Save the model
model.save('GalaxyGuardv1.keras')

# Save the tokenizer
import pickle
with open('tokenizer.pickle', 'wb') as handle:
  pickle.dump(tokenizer, handle, protocol=pickle.HIGHEST_PROTOCOL)