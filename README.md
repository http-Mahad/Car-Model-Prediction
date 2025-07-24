# 🚗 Car Model Prediction using Deep Learning & MERN Stack

![Car AI](https://img.freepik.com/free-vector/ai-artificial-intelligence-car-diagnostics-futuristic-technology_33099-2266.jpg?w=1380&t=st=1698652157~exp=1698652757~hmac=7433abf1fa62e7f83516bbd2e7e0c88d9ae23ee8eb4712e9d0fd8b48c845a0de)

## 📌 Project Overview

This project is a **Car Recognition and Prediction System** that uses **deep learning** to identify car make and model from images. It seamlessly integrates a trained **ResNet18** model with a modern **MERN stack web application**. The model was trained on the **Stanford Cars Dataset** with over **16,000 images**, and supports real-time predictions through an end-to-end API pipeline.

---

## 🧠 Model & Dataset

- 🔍 **Dataset**: [Stanford Cars Dataset](http://ai.stanford.edu/~jkrause/cars/car_dataset.html)  
  → 196 car classes, 16,000+ images (train/test split)

- 🏗️ **Model Architecture**:  
  → Transfer Learning using **ResNet-18**  
  → Trained with `.mat` annotations for bounding boxes and class labels

- 🧪 **Model Output**: Car **Make**, **Model**, and **Year** from image

---

## 🔧 System Architecture

```mermaid
graph TD;
    User[👤 User uploads car image] -->|via React UI| Frontend[🌐 React Frontend];
    Frontend -->|POST image| Express[🚀 Express.js Server];
    Express -->|POST| FlaskAPI[🐍 Flask API with ResNet18];
    FlaskAPI -->|Predict| Model[🧠 Trained DL Model];
    Model -->|Response| FlaskAPI;
    FlaskAPI -->|Send prediction| Express;
    Express -->|Return JSON| Frontend;
    Frontend -->|Display result| User;
