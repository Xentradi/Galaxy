from flask import Flask, request, jsonify
import tensorflow as tf
import grpc

app = Flask(__name__)

model = tf.keras.models.load_model('model.h5')