# GalaxyGuard/testModel.py
import tensorflow as tf
import numpy as np
import pickle

# Load the pre-trained model
model = tf.keras.models.load_model('GalaxyGuardv1.keras')

# Load the tokenizer
with open('tokenizer.pickle', 'rb') as handle:
    tokenizer = pickle.load(handle)

def predict_toxicity(text):
    # Tokenize and pad the input text
    sequences = tokenizer.texts_to_sequences([text])
    padded_sequences = tf.keras.preprocessing.sequence.pad_sequences(sequences, maxlen=100)
    
    # Make prediction
    prediction = model.predict(padded_sequences)[0]
    labels = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']
    result = {label: int(pred > 0.5) for label, pred in zip(labels, prediction)}
    
    return result

# Test the function with some sample texts
sample_texts = [
    "This is a nice comment.",
    "You are an idiot and should be banned.",
    "I will kill you!",
    "This is just some random text.",
    "You are such a loser."
]

for text in sample_texts:
    print(f"Text: {text}\nPrediction: {predict_toxicity(text)}\n")
