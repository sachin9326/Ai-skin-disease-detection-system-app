import io
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import open_clip

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 1. Zero-Shot Gatekeeper Filter (CLIP)
print("Loading Zero-Shot Gatekeeper model...")
clip_model, _, clip_preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='laion2b_s34b_b79k')
clip_model = clip_model.to(device)
clip_model.eval()
clip_tokenizer = open_clip.get_tokenizer('ViT-B-32')

# Gatekeeper comparison prompts
PROMPTS = [
    "a clinical close-up dermoscopy photo of human skin lesion or mole",
    "a non-medical photo, landscape, celestial object, moon, animal, room, face or object"
]
text_tokens = clip_tokenizer(PROMPTS).to(device)
with torch.no_grad():
    text_features = clip_model.encode_text(text_tokens)
    text_features /= text_features.norm(dim=-1, keepdim=True)

# 2. HAM10000 ResNet-18 Disease Classifier
print("Loading HAM10000 ResNet-18 model...")
checkpoint = torch.load("skin_disease_best_model.pth", map_location=device)
classes = checkpoint['classes']
idx_to_label = checkpoint['idx_to_label']

classifier_model = models.resnet18(weights=None)
classifier_model.fc = nn.Linear(classifier_model.fc.in_features, len(classes))
classifier_model.load_state_dict(checkpoint['model_state_dict'])
classifier_model = classifier_model.to(device)
classifier_model.eval()

disease_info = {
    'nv': {"name": "Melanocytic Nevi (Normal Mole)", "severity": "Benign", "observation": "Uniform pigmentation and symmetric architecture typical of benign melanocytic growth.", "description": "Common non-cancerous mole formed by clusters of melanocytes.", "recommendation": "Routine monitoring recommended. Consult a dermatologist if rapid changes occur."},
    'mel': {"name": "Melanoma", "severity": "Highly Malignant", "observation": "Structural atypical patterns, asymmetrical border pigmentation, and irregular pigment networks detected.", "description": "Serious form of skin cancer arising from melanin-producing cells.", "recommendation": "Immediate dermatological evaluation and urgent biopsy recommended."},
    'bkl': {"name": "Benign Keratosis-like Lesions", "severity": "Benign", "observation": "Well-demarcated verrucous surface with regular border structure.", "description": "Harmless skin growth including seborrheic keratoses and solar lentigines.", "recommendation": "No urgent intervention required. Follow up if irritation occurs."},
    'bcc': {"name": "Basal Cell Carcinoma", "severity": "Malignant (Cancerous)", "observation": "Arborizing telangiectasia and translucent nodular characteristics noted.", "description": "Slow-growing non-melanoma skin cancer originating in the basal layer.", "recommendation": "Consult a dermatologist or oncological specialist for formal staging."},
    'akiec': {"name": "Actinic Keratoses / Bowen's Disease", "severity": "Precancerous", "observation": "Erythematous scaly plaque with focal hyperkeratosis detected.", "description": "Precancerous scaly patches caused by cumulative UV radiation exposure.", "recommendation": "Dermatologist visit advised for preventative therapies."},
    'vasc': {"name": "Vascular Lesion", "severity": "Benign", "observation": "Circumscribed red-to-purple lacunae consistent with vascular ectasia.", "description": "Benign proliferation of blood vessels including cherry angiomas.", "recommendation": "Typically harmless. Seek medical opinion if frequent bleeding occurs."},
    'df': {"name": "Dermatofibroma", "severity": "Benign", "observation": "Central scar-like white patch with faint delicate peripheral pigment network.", "description": "Benign fibrous nodule commonly developing on limbs.", "recommendation": "Benign lesion. No clinical intervention necessary."}
}

ham_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')

    # --- GATEKEEPER CHECK ---
    clip_img = clip_preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        image_features = clip_model.encode_image(clip_img)
        image_features /= image_features.norm(dim=-1, keepdim=True)
        similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
        skin_score = similarity[0][0].item()
        non_skin_score = similarity[0][1].item()

    # Agar non-skin score zyada hai ya skin confidence 60% se kam hai:
    if non_skin_score > skin_score or skin_score < 0.60:
        return {
            "valid": False,
            "error_type": "INVALID_IMAGE",
            "message": "Invalid scan: No valid skin lesion detected. Please upload a clear dermoscopic photo of the skin lesion."
        }

    # --- HAM10000 PREDICTION ---
    tensor = ham_transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = classifier_model(tensor)
        probs = torch.nn.functional.softmax(outputs[0], dim=0)
        top_probs, top_indices = torch.topk(probs, 3)

    results = []
    for i in range(3):
        code = idx_to_label[top_indices[i].item()]
        info = disease_info.get(code, {})
        results.append({
            "disease_code": code,
            "disease_name": info.get("name", code),
            "severity": info.get("severity", "Unknown"),
            "confidence": round(top_probs[i].item() * 100, 2)
        })

    # Top prediction confidence check
    top_confidence = results[0]["confidence"]

    # If confidence is under 60%, the scan is inconclusive or out-of-scope
    if top_confidence < 60.0:
        return {
            "valid": False,
            "error_type": "LOW_CONFIDENCE",
            "message": "Inconclusive scan (Confidence below 60%). The condition does not match known pigmented lesion types (e.g., this may be dermatitis, eczema, or an inflammatory rash). Please consult a certified dermatologist."
        }

    top_code = results[0]["disease_code"]
    top_info = disease_info.get(top_code, {})

    return {
        "valid": True,
        "prediction": results[0]["disease_name"],
        "severity": results[0]["severity"],
        "confidence": results[0]["confidence"],
        "observation": top_info.get("observation", ""),
        "description": top_info.get("description", ""),
        "recommendation": top_info.get("recommendation", ""),
        "top_3": results
    }
