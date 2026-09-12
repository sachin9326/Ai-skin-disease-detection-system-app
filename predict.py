import os
import glob
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

# 1. Saved model load karo
checkpoint = torch.load("skin_disease_best_model.pth", map_location="cpu")
classes = checkpoint['classes']
idx_to_label = checkpoint['idx_to_label']

# 2. Disease full names
disease_names = {
    'akiec': "Actinic keratoses / Bowen's disease",
    'bcc': 'Basal cell carcinoma',
    'bkl': 'Benign keratosis-like lesions',
    'df': 'Dermatofibroma',
    'mel': 'Melanoma',
    'nv': 'Melanocytic nevi (Normal Mole)',
    'vasc': 'Vascular lesions'
}

# 3. Model setup
model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, len(classes))
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

# 4. Image transform
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def predict(image_path):
    if not os.path.exists(image_path):
        print(f"Error: File nahi mili: {image_path}")
        return

    img = Image.open(image_path).convert('RGB')
    tensor = transform(img).unsqueeze(0)

    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.nn.functional.softmax(outputs[0], dim=0)
        top_probs, top_indices = torch.topk(probs, 3)

    print("\n" + "="*45)
    print(f"Image: {os.path.basename(image_path)}")
    print("="*45)
    for i in range(3):
        code = idx_to_label[top_indices[i].item()]
        name = disease_names.get(code, code)
        conf = top_probs[i].item() * 100
        print(f"{i+1}. {name} ({code}): {conf:.2f}%")
    print("="*45)

import random

# Saari images dhoondo
test_images = glob.glob(r"dataset HAM/**/*.jpg", recursive=True)

if test_images:
    # Random 3 images select karo
    samples = random.sample(test_images, 3)
    for img_path in samples:
        predict(img_path)
else:
    print("Koi image nahi mili!")
