import { useRef, useState, lazy, Suspense } from 'react';

interface ModelViewer3DProps {
  modelUrl?: string;
  onModelLoaded?: () => void;
}

// Lazy load the Canvas component to avoid blocking render
const CanvasRenderer = lazy(() => import('./CanvasRenderer').then(m => ({ default: m.CanvasRenderer })));

export function ModelViewer3D({ modelUrl, onModelLoaded }: ModelViewer3DProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentModelUrl, setCurrentModelUrl] = useState<string | undefined>(modelUrl);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.glb')) {
      setError('Please select a .glb file');
      return;
    }

    setError('');
    setFileName(file.name);

    // Create object URL for the file
    const url = URL.createObjectURL(file);
    setCurrentModelUrl(url);
    onModelLoaded?.();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-800">3D Model Viewer</h3>
            <p className="text-sm text-gray-600">Upload your enclosure design (.glb format)</p>
          </div>
          <button
            onClick={handleUploadClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Upload GLB Model
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".glb"
          onChange={handleFileSelect}
          className="hidden"
        />

        {fileName && (
          <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200">
            ✓ Loaded: {fileName}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded border border-red-200">
            ✗ {error}
          </div>
        )}
      </div>

      <div className="w-full h-96 bg-gradient-to-b from-gray-100 to-gray-50">
        {currentModelUrl ? (
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 font-medium">Loading 3D viewer...</p>
              </div>
            </div>
          }>
            <CanvasRenderer modelUrl={currentModelUrl} />
          </Suspense>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-gray-500 font-medium">No model loaded</p>
              <p className="text-gray-400 text-sm mt-1">Click "Upload GLB Model" to get started</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <p>💡 <strong>Tips:</strong> Drag to rotate • Scroll to zoom • Right-click to pan</p>
      </div>
    </div>
  );
}
