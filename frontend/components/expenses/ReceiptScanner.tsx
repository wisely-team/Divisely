import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Maximize2 } from 'lucide-react';
import { ImagePreviewModal } from '../ui/ImagePreviewModal';

interface ReceiptData {
  description: string;
  amount: number;
  date: string;
}

interface ReceiptScannerProps {
  onScanComplete: (data: ReceiptData) => void;
  onError: (error: string) => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError('Image size should be less than 5MB');
      return;
    }

    await processImage(file);
  };

  const processImage = async (file: File) => {
    setIsScanning(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Convert to base64 for API
      const base64 = await fileToBase64(file);

      // Call the API to analyze receipt
      const response = await analyzeReceipt(base64);

      if (response) {
        onScanComplete(response);
      } else {
        onError('Could not extract data from receipt. Please try again or enter details manually.');
      }
    } catch (error) {
      console.error('Receipt scanning error:', error);
      onError('Failed to scan receipt. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const analyzeReceipt = async (base64Image: string): Promise<ReceiptData | null> => {
    // This will be implemented in geminiService
    const { analyzeReceiptImage } = await import('../../services/geminiService');
    return analyzeReceiptImage(base64Image);
  };

  const clearPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="bg-gradient-to-br from-teal-50 to-blue-50 p-6 rounded-xl border border-teal-200 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal-600" />
            Scan Receipt & Autofill
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload or take a photo of your receipt to automatically extract details
          </p>
        </div>
        {previewImage && !isScanning && (
          <button
            type="button"
            onClick={clearPreview}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isScanning ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm font-medium text-gray-700">Analyzing receipt...</p>
          <p className="text-xs text-gray-500">This may take a few seconds</p>
        </div>
      ) : previewImage ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-gray-200 group">
            <img
              src={previewImage}
              alt="Receipt preview"
              className="w-full h-32 object-cover"
            />
            {/* Overlay with Expand Button */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-gray-900 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 flex items-center gap-2 font-medium text-sm"
              >
                <Maximize2 className="w-4 h-4" />
                View Full Size
              </button>
            </div>
          </div>
          <p className="text-xs text-center text-gray-500">
            Receipt uploaded successfully. Fields below will be auto-filled.
          </p>
        </div>
      ) : (
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-teal-300 text-teal-700 rounded-lg hover:bg-teal-50 hover:border-teal-400 transition-all font-medium text-sm shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-medium text-sm shadow-sm"
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </button>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          imageUrl={previewImage}
          title="Receipt Preview"
        />
      )}
    </div>
  );
};
