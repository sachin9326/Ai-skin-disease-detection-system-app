import os
import glob
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image
from sklearn.model_selection import train_test_split

# 1. Device check
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Device being used: {device}")

# 2. Paths
base_dir = r"C:\Users\Sachin Kumar\Desktop\SKIN DISEASE DETECTOR\dataset HAM"
csv_path = os.path.join(base_dir, "HAM10000_metadata.csv")
save_path = "skin_disease_best_model.pth"

# 3. Load & Map Metadata
print("Loading metadata...")
df = pd.read_csv(csv_path)

print("Scanning images...")
image_path_map = {os.path.splitext(os.path.basename(p))[0]: p for p in glob.glob(base_dir + "/**/*.jpg", recursive=True)}
df['image_path'] = df['image_id'].map(image_path_map)
df = df.dropna(subset=['image_path']).reset_index(drop=True)
print(f"Total matched images: {len(df)}")

classes = sorted(df['dx'].unique())
label_to_idx = {cls_name: i for i, cls_name in enumerate(classes)}
idx_to_label = {i: cls_name for i, cls_name in enumerate(classes)}
df['label'] = df['dx'].map(label_to_idx)
print(f"Classes: {label_to_idx}")

# 4. Split
train_df, val_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['label'])

# 5. Transforms
train_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# 6. Dataset Class
class SkinDataset(Dataset):
    def __init__(self, data_df, transform=None):
        self.data = data_df.reset_index(drop=True)
        self.transform = transform

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        img = Image.open(row['image_path']).convert('RGB')
        label = row['label']
        if self.transform:
            img = self.transform(img)
        return img, label

train_loader = DataLoader(SkinDataset(train_df, train_transforms), batch_size=16, shuffle=True)
val_loader = DataLoader(SkinDataset(val_df, val_transforms), batch_size=16, shuffle=False)

# 7. Model setup (ResNet18)
print("Setting up model...")
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
model.fc = nn.Linear(model.fc.in_features, len(classes))
model = model.to(device)

criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.0001)
scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=2, gamma=0.5)

# 8. Training loop
epochs = 5
best_val_acc = 0.0
print("Starting training...\n" + "="*50)

for epoch in range(epochs):
    model.train()
    running_loss, correct, total = 0.0, 0, 0
    
    for i, (images, labels) in enumerate(train_loader):
        images = images.to(device)
        labels = labels.to(device, dtype=torch.long)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
        
        if (i + 1) % 50 == 0:
            print(f"Epoch [{epoch+1}/{epochs}] | Batch [{i+1}/{len(train_loader)}] | Current Loss: {loss.item():.4f}")

    epoch_loss = running_loss / total
    epoch_acc = (correct / total) * 100

    # Validation phase
    model.eval()
    val_correct, val_total = 0, 0
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            labels = labels.to(device, dtype=torch.long)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            val_correct += (preds == labels).sum().item()
            val_total += labels.size(0)

    val_acc = (val_correct / val_total) * 100
    scheduler.step()
    current_lr = scheduler.get_last_lr()[0]

    print(f"\n--> Epoch [{epoch+1}/{epochs}] Summary:")
    print(f"Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc:.2f}% | Val Acc: {val_acc:.2f}% | LR: {current_lr:.6f}")

    # Save best model
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save({
            'epoch': epoch + 1,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'val_acc': best_val_acc,
            'classes': classes,
            'label_to_idx': label_to_idx,
            'idx_to_label': idx_to_label,
        }, save_path)
        print(f"    [SAVED] New best model saved with Val Acc: {best_val_acc:.2f}%\n")

print("\n" + "="*50)
print(f"Training Complete! Best Validation Accuracy: {best_val_acc:.2f}%")
print(f"Saved checkpoint: {save_path}")