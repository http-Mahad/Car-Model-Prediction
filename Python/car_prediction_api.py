from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
from torchvision import transforms, models
import torch.nn as nn
from PIL import Image
import scipy.io
import io
import numpy as np
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="Car Model Prediction API",
    description="API for predicting car models from images using a trained ResNet18 model",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

model = None
class_names = None
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class PredictionResponse(BaseModel):
    car_model: str
    confidence: float
    success: bool
    error: Optional[str] = None

def load_model(checkpoint_path='checkpoints/best_model.pth', num_classes=196):
    """Load the trained model"""
    try:
        model = models.resnet18(weights=None)
        model.fc = nn.Linear(model.fc.in_features, num_classes)
        
        checkpoint = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        model = model.to(device)
        model.eval()
        print(f"Model loaded successfully with accuracy: {checkpoint['accuracy']:.2f}%")
        return model
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return None

def load_class_names(mat_file='cars_meta.mat'):
    """Load class names from the MATLAB file"""
    try:
        meta = scipy.io.loadmat(mat_file)
        class_names = [name[0] for name in meta['class_names'][0]]
        print(f"Loaded {len(class_names)} class names")
        return class_names
    except Exception as e:
        print(f"Error loading class names: {str(e)}")
        return None

def predict_image(image_bytes: bytes):
    """Make prediction on the input image"""
    try:
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        image_tensor = transform(image).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            confidence, predicted = probabilities.max(1)
            
            predicted_class = class_names[predicted.item()]
            confidence_score = confidence.item() * 100
            
            return predicted_class, confidence_score
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    """Initialize model and class names when the API starts"""
    global model, class_names
    
    print("Loading model and class names...")
    model = load_model()
    class_names = load_class_names()
    
    if model is None or class_names is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to initialize model or class names"
        )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Car Model Prediction API",
        "status": "active",
        "model_accuracy": "88.85%",
        "endpoints": {
            "/predict": "POST - Predict car model from image",
            "/health": "GET - Check API health"
        }
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "class_names_loaded": class_names is not None,
        "device": str(device)
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """
    Predict car model from uploaded image
    
    Parameters:
    - file: Image file (jpg, jpeg, png)
    
    Returns:
    - car_model: Predicted car model name
    - confidence: Confidence score (0-100)
    - success: Whether the prediction was successful
    - error: Error message if any
    """
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        image_bytes = await file.read()
        
        predicted_class, confidence = predict_image(image_bytes)
        
        return PredictionResponse(
            car_model=predicted_class,
            confidence=confidence,
            success=True
        )
        
    except Exception as e:
        return PredictionResponse(
            car_model="",
            confidence=0.0,
            success=False,
            error=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 