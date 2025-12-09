import React from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Modal } from '../UIComponents';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Receipt Preview'
}) => {
  const [zoom, setZoom] = React.useState(100);
  const [rotation, setRotation] = React.useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  React.useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setRotation(0);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" className="max-w-4xl">
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-center gap-4 flex-shrink-0">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 text-gray-700" />
          </button>

          <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {zoom}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 text-gray-700" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <button
            onClick={handleRotate}
            className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200"
            title="Rotate"
          >
            <RotateCw className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-2 hover:bg-white rounded-lg transition-colors border border-gray-200 text-sm font-medium text-gray-700"
          >
            Reset
          </button>
        </div>

        {/* Image Container */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          <div className="flex items-center justify-center min-h-full">
            <img
              src={imageUrl}
              alt="Receipt"
              className="max-w-full h-auto shadow-lg transition-all duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
