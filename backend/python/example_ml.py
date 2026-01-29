"""Exemplo simples de pipeline ML combinando scikit-learn e TensorFlow.
Arquivo de exemplo apenas para referência local.
"""
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
import joblib


def sample_dataframe(n=1000):
    rng = np.random.RandomState(42)
    df = pd.DataFrame({
        "feature1": rng.normal(size=n),
        "feature2": rng.normal(size=n),
    })
    # simula votos
    df["vote_yes"] = (df["feature1"] * 0.3 + df["feature2"] * -0.2 + rng.normal(scale=0.5, size=n)) > 0
    return df


def train_and_save():
    df = sample_dataframe(2000)
    clf = Pipeline([
        ("scaler", StandardScaler()),
        ("rf", RandomForestClassifier(n_estimators=100, random_state=42)),
    ])
    X = df[["feature1", "feature2"]]
    y = df["vote_yes"].astype(int)
    clf.fit(X, y)
    joblib.dump(clf, "models/rf_vote.pkl")

    # Modelo TF simples
    X_tf = X.values.astype("float32")
    y_tf = y.values.astype("float32")
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(2,)),
        tf.keras.layers.Dense(32, activation="relu"),
        tf.keras.layers.Dense(16, activation="relu"),
        tf.keras.layers.Dense(1, activation="sigmoid"),
    ])
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"]) 
    model.fit(X_tf, y_tf, epochs=5, batch_size=32, validation_split=0.1)
    model.save("models/tf_vote")


if __name__ == '__main__':
    train_and_save()
