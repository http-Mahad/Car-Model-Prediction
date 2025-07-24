import scipy.io
import numpy as np
import pandas as pd
from PIL import Image
import os
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
import torch.nn as nn
import torch.optim as optim
from tqdm import tqdm
import sys
from torchvision.models import ResNet18_Weights
import time

# Read the MATLAB data files
def read_mat_file(mat_file_path):
    try:
        data = scipy.io.loadmat(mat_file_path)
        print(f"Successfully loaded {mat_file_path}")
        return data
    except Exception as e:
        print(f"Error loading {mat_file_path}: {str(e)}")
        sys.exit(1)

class CarDataset(Dataset):
    def __init__(self, mat_file, img_dir, transform=None):
        try:
            data = scipy.io.loadmat(mat_file)
            self.annotations = data['annotations'][0]
            self.img_dir = img_dir
            self.transform = transform if transform else transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.RandomHorizontalFlip(),
                transforms.ColorJitter(brightness=0.2, contrast=0.2),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            print(f"Dataset initialized with {len(self.annotations)} images")
        except Exception as e:
            print(f"Error initializing dataset: {str(e)}")
            sys.exit(1)
    
    def __len__(self):
        return len(self.annotations)
    
    def __getitem__(self, idx):
        try:
            img_name = f"{self.annotations[idx][-1][0]}"
            img_path = os.path.join(self.img_dir, img_name)
            
            image = Image.open(img_path).convert('RGB')
            image = self.transform(image)
            
            class_id = self.annotations[idx][-2][0][0] - 1
            return image, class_id
        except Exception as e:
            print(f"Error loading image {img_path}: {str(e)}")
            # Return a zero tensor and the first class as fallback
            return torch.zeros((3, 224, 224)), 0

def train_model(model, train_loader, criterion, optimizer, num_epochs=10, device='cpu', checkpoint_dir='checkpoints'):
    if not os.path.exists(checkpoint_dir):
        os.makedirs(checkpoint_dir)
    
    model = model.to(device)
    best_acc = 0.0
    start_epoch = 0
    
    # Load checkpoint if exists
    checkpoint_path = os.path.join(checkpoint_dir, 'latest_checkpoint.pth')
    if os.path.exists(checkpoint_path):
        checkpoint = torch.load(checkpoint_path)
        model.load_state_dict(checkpoint['model_state_dict'])
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        start_epoch = checkpoint['epoch'] + 1
        best_acc = checkpoint['best_acc']
        print(f"Resuming from epoch {start_epoch} with best accuracy: {best_acc:.2f}%")
    
    try:
        for epoch in range(start_epoch, num_epochs):
            model.train()
            running_loss = 0.0
            correct = 0
            total = 0
            epoch_start = time.time()
            
            progress_bar = tqdm(train_loader, desc=f'Epoch {epoch+1}/{num_epochs}')
            for batch_idx, (images, labels) in enumerate(progress_bar):
                try:
                    images, labels = images.to(device), labels.to(device)
                    
                    optimizer.zero_grad()
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                    loss.backward()
                    optimizer.step()
                    
                    running_loss += loss.item()
                    _, predicted = outputs.max(1)
                    total += labels.size(0)
                    correct += predicted.eq(labels).sum().item()
                    
                    # Update progress bar
                    progress_bar.set_postfix({
                        'loss': f'{running_loss/(batch_idx+1):.4f}',
                        'acc': f'{100.*correct/total:.2f}%'
                    })
                    
                    # Save checkpoint every 100 batches
                    if (batch_idx + 1) % 100 == 0:
                        torch.save({
                            'epoch': epoch,
                            'batch_idx': batch_idx,
                            'model_state_dict': model.state_dict(),
                            'optimizer_state_dict': optimizer.state_dict(),
                            'loss': running_loss / (batch_idx + 1),
                            'accuracy': 100. * correct / total,
                            'best_acc': best_acc
                        }, checkpoint_path)
                
                except Exception as e:
                    print(f"Error in batch {batch_idx}: {str(e)}")
                    continue
            
            epoch_loss = running_loss / len(train_loader)
            epoch_acc = 100. * correct / total
            epoch_time = time.time() - epoch_start
            
            print(f'\nEpoch {epoch+1}: Loss = {epoch_loss:.4f}, Accuracy = {epoch_acc:.2f}%, Time = {epoch_time:.2f}s')
            
            # Save best model
            if epoch_acc > best_acc:
                best_acc = epoch_acc
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': model.state_dict(),
                    'optimizer_state_dict': optimizer.state_dict(),
                    'loss': epoch_loss,
                    'accuracy': epoch_acc,
                    'best_acc': best_acc
                }, os.path.join(checkpoint_dir, 'best_model.pth'))
                print(f"Saved new best model with accuracy: {epoch_acc:.2f}%")
    
    except KeyboardInterrupt:
        print("\nTraining interrupted. Saving current state...")
        torch.save({
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'loss': running_loss / (batch_idx + 1),
            'accuracy': 100. * correct / total,
            'best_acc': best_acc
        }, os.path.join(checkpoint_dir, 'interrupted_model.pth'))
        print("Model saved. You can resume training later.")
        
    return model

def main():
    try:
        # Set device
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {device}")
        
        # Dataset paths
        train_mat = 'cars_train_annos.mat'
        train_dir = 'cars_train/cars_train'
        
        # Verify paths exist
        if not os.path.exists(train_mat):
            raise FileNotFoundError(f"Training annotations file not found: {train_mat}")
        if not os.path.exists(train_dir):
            raise FileNotFoundError(f"Training images directory not found: {train_dir}")
        
        # Create dataset and dataloader
        print("Initializing dataset...")
        dataset = CarDataset(train_mat, train_dir)
        
        # Use smaller batch size and fewer workers for CPU
        batch_size = 8  # Reduced from 16
        num_workers = 0 if device == 'cpu' else 2
        
        train_loader = DataLoader(
            dataset, 
            batch_size=batch_size,
            shuffle=True,
            num_workers=num_workers,
            pin_memory=True if device == 'cuda' else False
        )
        
        # Load pre-trained ResNet18 model (lighter than ResNet50)
        print("Loading pre-trained ResNet18 model...")
        model = models.resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)
        num_classes = 196  # Number of car classes
        model.fc = nn.Linear(model.fc.in_features, num_classes)
        
        # Loss function and optimizer with lower learning rate
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.0001)  # Reduced from 0.001
        
        # Train the model
        print("Starting training...")
        print(f"Training with batch size: {batch_size}, workers: {num_workers}")
        model = train_model(model, train_loader, criterion, optimizer, num_epochs=10, device=device)
        print("Training completed!")
        
    except Exception as e:
        print(f"Error in main: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 