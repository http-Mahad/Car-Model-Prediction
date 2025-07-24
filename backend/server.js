const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { CohereClient } = require('cohere-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
});

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const isValid = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype);
    cb(null, isValid);
  }
});

function buildPrompt(carModel) {
  return `
You are an expert automotive assistant. Your task is to provide detailed specifications for car models in a consistent JSON format.

For the car model "${carModel}", return a JSON object with the following structure:

{
  "model": "${carModel}",
  "engine": {
    "type": "e.g., 2.0L Inline-4 Turbo",
    "horsepower": "e.g., 250 HP",
    "torque": "e.g., 273 lb-ft"
  },
  "performance": {
    "acceleration": "e.g., 0-60 mph in 5.8 seconds",
    "topSpeed": "e.g., 155 mph",
    "drivetrain": "e.g., All-Wheel Drive"
  },
  "dimensions": {
    "length": "e.g., 182.7 inches",
    "width": "e.g., 70.9 inches",
    "height": "e.g., 56.3 inches",
    "weight": "e.g., 3,450 lbs"
  },
  "safety": [
    "ABS",
    "Airbags",
    "Lane Assist",
    "Collision Detection"
  ],
  "technology": [
    "Touchscreen Infotainment",
    "Apple CarPlay",
    "Android Auto",
    "Heads-Up Display"
  ],
  "interior": [
    "Leather Seats",
    "Dual-Zone Climate Control",
    "Heated Front Seats"
  ],
  "exterior": [
    "LED Headlights",
    "18-inch Alloy Wheels",
    "Panoramic Sunroof"
  ],
  "fuelEconomy": {
    "city": "e.g., 22 MPG",
    "highway": "e.g., 30 MPG",
    "combined": "e.g., 25 MPG"
  },
  "priceRange": {
    "base": "e.g., $32,000",
    "highEnd": "e.g., $42,000"
  },
  "colors": [
    "Black",
    "White",
    "Silver",
    "Blue",
    "Red"
  ],
  "yearIntroduced": "e.g., 2020",
  "vehicleType": "e.g., SUV/Sedan/Coupe etc."
}

Important rules:
1. Only return valid JSON format - no extra text or markdown
2. If a field is unknown, use "Not specified"
3. Keep arrays to 3-5 items max for readability
4. Use realistic values based on the actual car model
5. Maintain this exact structure for consistency
`.trim();
}

async function getCarFeatures(carModel) {
  const prompt = buildPrompt(carModel);

  try {
    const response = await cohere.chat({
      model: 'command-r-plus',
      message: prompt,
      temperature: 0.5,
      maxTokens: 1000,
    });

    const jsonString = response.text.replace(/```json|```/g, '').trim();
    const features = JSON.parse(jsonString);
    console.log(features)
    
    return features;
  } catch (err) {
    console.error('Error parsing car features:', err);
    return {
      model: carModel,
      error: "Could not retrieve specifications",
      details: err.message
    };
  }
}

app.post('/api/predict', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image uploaded' });
  }

  try {
    const form = new FormData();
    form.append('file', req.file.buffer, req.file.originalname);

    const pythonResponse = await axios.post('http://localhost:8000/predict', form, {
      headers: form.getHeaders(),
      timeout: 20000
    });

    const { car_model: carModel, confidence } = pythonResponse.data;
    const features = await getCarFeatures(carModel);

    res.json({
      success: true,
      carModel,
      confidence: Math.round(confidence).toFixed(1), 
      features
    });

  } catch (err) {
    console.error('🔥 Error:', err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      details: err.message
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Unexpected server error',
    message: err.message
  });
});

app.listen(port, () => {
  console.log(`🚗 Server running on http://localhost:${port}`);
});