import os
import tensorflow as tf
import numpy as np

# Force TensorFlow to use GPU
os.environ["TF_GPU_THREAD_MODE"] = "gpu_private"

# Set TensorFlow logging to DEBUG level
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '0'

# See TensorFlow version
print(f"TensorFlow version: {tf.__version__}")

# Check if TensorFlow can detect the GPU
print("Num GPUs Available: ", len(tf.config.list_physical_devices('GPU')))
print(f"TensorFlow version: {tf.__version__}")

# Verify if the GPU is being used
print(f"Physical devices: {tf.config.list_physical_devices()}")

# Define a simple model
model = tf.keras.models.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dense(10, activation='softmax')
])

# Compile the model
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# Create some dummy data
x_train = np.random.random((60000, 784))
y_train = np.random.randint(10, size=(60000,))

# Train the model and measure time
import time
start_time = time.time()
model.fit(x_train, y_train, epochs=5)
end_time = time.time()

print(f"Training time: {end_time - start_time} seconds")