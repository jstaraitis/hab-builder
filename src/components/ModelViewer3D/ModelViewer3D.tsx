// @ts-nocheck
import { useRef, useState, useEffect, Suspense, Component, ReactNode } from 'react';
import { CanvasRenderer, type LoadedModel } from './CanvasRenderer';

interface ModelViewer3DProps {
  modelUrl?: string;
  onModelLoaded?: () => void;
  onAddModelReady?: (addModel: (url: string, name?: string, proceduralGenerator?: () => THREE.Object3D) => void) => void;
  enclosureDimensions?: { width: number; depth: number; height: number };
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ModelViewer3D Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-700 font-medium">3D Viewer Error</p>
            <p className="text-red-600 text-sm mt-2">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ModelViewer3D({ modelUrl, onModelLoaded, onAddModelReady, enclosureDimensions }: ModelViewer3DProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addModelFnRef = useRef<((url: string, name?: string) => void) | null>(null);
  const [currentModelUrl, setCurrentModelUrl] = useState<string | undefined>(modelUrl);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [loadedModels, setLoadedModels] = useState<LoadedModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

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
    setIsLoading(true);

    // Revoke old object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    // Create object URL for the file
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setCurrentModelUrl(url);
    onModelLoaded?.();
    
    // Clear loading after a short delay (actual load happens in CanvasRenderer)
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const loadDefaultModel = () => {
    const demoUrl = '/Meshy_AI_Y_Branch_Twig_0119170311_generate.glb';
    
    if (!currentModelUrl) {
      setCurrentModelUrl(demoUrl);
      setFileName('Y_Branch_Twig.glb');
    } else {
      // Add to existing scene
      if (addModelFnRef.current) {
        addModelFnRef.current(demoUrl, 'Y_Branch_Twig.glb');
      }
    }
    
    setError('');
  };

  const handleModelsChange = (models: LoadedModel[]) => {
    setLoadedModels(models);
  };

  const handleAddModelReady = (addModelFn: (url: string, name?: string, proceduralGenerator?: () => THREE.Object3D) => void) => {
    addModelFnRef.current = addModelFn;
    setIsReady(true);
    onAddModelReady?.(addModelFn);
  };

  return (
    <ErrorBoundary>
      <div className="w-full bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">🎨</span>
                3D Enclosure Composer
              </h3>
              <p className="text-sm text-gray-600 mt-1">Design your perfect habitat in 3D space</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadDefaultModel}
                className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center gap-2"
              >
                <span>🌿</span>
                {loadedModels.length > 0 ? 'Add Demo' : 'Load Demo'}
              </button>
              <button
                onClick={handleUploadClick}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm font-medium flex items-center gap-2"
              >
                <span>📁</span>
                {loadedModels.length > 0 ? 'Add Model' : 'Upload Model'}
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".glb"
            onChange={handleFileSelect}
            className="hidden"
          />

          {fileName && (
            <div className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg border border-green-200 flex items-center gap-2 shadow-sm">
              <span className="text-lg">✓</span>
              <span>Loaded: <strong>{fileName}</strong></span>
            </div>
          )}

          {isLoading && (
            <div className="text-sm text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 flex items-center gap-2 shadow-sm">
              <span className="text-lg animate-spin">⚙️</span>
              <span>Loading model...</span>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg border border-red-200 flex items-center gap-2 shadow-sm">
              <span className="text-lg">✗</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50">
          {/* 3D Viewport */}
          <div className="col-span-3">
            <div className="w-full h-[500px] bg-gradient-to-br from-slate-100 via-gray-50 to-blue-50 rounded-xl overflow-hidden shadow-lg border border-gray-300 relative">
              {currentModelUrl ? (
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                    <div className="text-center">
                      <div className="text-6xl mb-4 animate-bounce">🎨</div>
                      <p className="text-gray-600 font-semibold text-lg animate-pulse">Loading 3D composer...</p>
                    </div>
                  </div>
                }>
                  <CanvasRenderer 
                    modelUrl={currentModelUrl} 
                    onModelsChange={handleModelsChange}
                    onAddModelReady={handleAddModelReady}
                    enclosureDimensions={enclosureDimensions}
                  />
                </Suspense>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
                  <div className="text-center p-8">
                    <div className="text-7xl mb-4">📦</div>
                    <p className="text-gray-600 font-semibold text-lg mb-2">No model loaded</p>
                    <p className="text-gray-500 text-sm">Upload your own 3D model or try the demo</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Models Panel */}
          <div className="bg-white border border-gray-300 rounded-xl shadow-lg p-4">
            <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
              <span className="text-lg">📋</span>
              Models in Scene
            </h4>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {loadedModels.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No models in scene</p>
                </div>
              ) : (
                loadedModels.map((model) => (
                  <div key={model.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200 text-xs shadow-sm hover:shadow-md transition-shadow">
                    <p className="font-semibold text-gray-800 truncate mb-2 flex items-center gap-1">
                      <span className="text-sm">🎯</span>
                      {model.name}
                    </p>
                    <div className="space-y-1 text-gray-600 font-mono">
                      <p>X: <span className="font-bold text-blue-600">{model.position.x.toFixed(2)}</span></p>
                      <p>Y: <span className="font-bold text-green-600">{model.position.y.toFixed(2)}</span></p>
                      <p>Z: <span className="font-bold text-purple-600">{model.position.z.toFixed(2)}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <span className="font-semibold">🖱️ Left Click:</span> Drag models
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold">🖱️ Right Click:</span> Rotate view
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold">⚡ Scroll:</span> Zoom in/out
              </span>
            </div>
            <div className="text-gray-500">
              {loadedModels.length} model{loadedModels.length !== 1 ? 's' : ''} loaded
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
