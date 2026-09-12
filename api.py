import io
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Skin Disease Detection API")

# React frontend se calls allow karne ke liye CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Model & checkpoint load
checkpoint = torch.load("skin_disease_best_model.pth", map_location="cpu")
classes = checkpoint['classes']
idx_to_label = checkpoint['idx_to_label']

disease_info = {
    'nv': {
        "name": "Melanocytic Nevi (Normal Mole)",
        "severity": "Benign",
        "description": "Common non-cancerous mole formed by clusters of melanocytes.",
        "observation": "Lesion exhibits uniform pigmentation, symmetric borders, and stable architecture typical of benign melanocytic growth.",
        "recommendation": "Routine monitoring recommended. Consult a dermatologist if asymmetry, border irregularity, or rapid color changes occur."
    },
    'mel': {
        "name": "Melanoma",
        "severity": "Highly Malignant",
        "description": "Serious form of skin cancer arising from melanin-producing cells.",
        "observation": "Structural atypical patterns, asymmetrical border pigmentation, and irregular pigment networks detected.",
        "recommendation": "Immediate dermatological evaluation and urgent biopsy recommended."
    },
    'bkl': {
        "name": "Benign Keratosis-like Lesions",
        "severity": "Benign",
        "description": "Harmless skin growth including seborrheic keratoses and solar lentigines.",
        "observation": "Well-demarcated verrucous surface with comedo-like openings and regular border structure.",
        "recommendation": "No urgent intervention required. Evaluation suggested if itching or persistent irritation occurs."
    },
    'bcc': {
        "name": "Basal Cell Carcinoma",
        "severity": "Malignant (Cancerous)",
        "description": "Slow-growing non-melanoma skin cancer originating in the basal layer.",
        "observation": "Arborizing telangiectasia and translucent nodular characteristics noted.",
        "recommendation": "Consult a dermatologist or oncological specialist for formal staging and excision options."
    },
    'akiec': {
        "name": "Actinic Keratoses / Bowen's Disease",
        "severity": "Precancerous",
        "description": "Precancerous scaly patches caused by cumulative ultraviolet (UV) radiation exposure.",
        "observation": "Erythematous scaly plaque with focal hyperkeratosis detected.",
        "recommendation": "Dermatologist visit advised for preventative therapies such as cryotherapy or topical regimens."
    },
    'vasc': {
        "name": "Vascular Lesion",
        "severity": "Benign",
        "description": "Benign proliferation of blood vessels including cherry angiomas and pyogenic granulomas.",
        "observation": "Circumscribed red-to-purple lacunae consistent with vascular ectasia.",
        "recommendation": "Typically harmless. Seek medical opinion if frequent bleeding or trauma occurs."
    },
    'df': {
        "name": "Dermatofibroma",
        "severity": "Benign",
        "description": "Benign fibrous nodule commonly developing on limbs.",
        "observation": "Central scar-like white patch with faint delicate peripheral pigment network.",
        "recommendation": "Benign lesion. No clinical intervention necessary unless symptomatic or cosmetically concerning."
    }
}

model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, len(classes))
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.get("/")
def home():
    return {"status": "Skin Disease Model API is Running!"}

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')
    tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.nn.functional.softmax(outputs[0], dim=0)
        top_probs, top_indices = torch.topk(probs, 3)

    results = []
    for i in range(3):
        code = idx_to_label[top_indices[i].item()]
        info = disease_info.get(code, {"name": code, "severity": "Unknown", "description": "", "observation": "", "recommendation": ""})
        results.append({
            "disease_code": code,
            "disease_name": info["name"],
            "severity": info["severity"],
            "description": info.get("description", ""),
            "observation": info.get("observation", ""),
            "recommendation": info.get("recommendation", ""),
            "confidence": round(top_probs[i].item() * 100, 2)
        })

    top_code = results[0]["disease_code"]
    top_info = disease_info.get(top_code, {})

    return {
        "prediction": results[0]["disease_name"],
        "severity": results[0]["severity"],
        "confidence": results[0]["confidence"],
        "observation": top_info.get("observation", "No observation available."),
        "description": top_info.get("description", ""),
        "recommendation": top_info.get("recommendation", "Consult a certified healthcare provider."),
        "top_3": results
    }
