// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export interface LoadedModel {
  id: string;
  name: string;
  object: THREE.Object3D;
  position: { x: number; y: number; z: number };
  visible: boolean;
}

interface CanvasRendererProps {
  modelUrl: string;
  onModelsChange?: (models: LoadedModel[]) => void;
  onAddModelReady?: (addModel: (url: string, name?: string, proceduralGenerator?: () => THREE.Object3D) => void) => void;
  enclosureDimensions?: { width: number; depth: number; height: number };
}

export function CanvasRenderer({ modelUrl, onModelsChange, onAddModelReady, enclosureDimensions }: CanvasRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const modelsRef = useRef<Map<string, LoadedModel>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());
  const dragPointRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const [models, setModels] = useState<LoadedModel[]>([]);
  const initializedRef = useRef(false);

  const selectedModelRef = useRef<LoadedModel | null>(null);
  const isDraggingRef = useRef(false);
  const isOrbitingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const sphericalRef = useRef({ radius: 10, theta: Math.PI / 4, phi: Math.PI / 3 });
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    
    initializedRef.current = true;
    console.log('Initializing Three.js scene...');

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf3f4f6);
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(
        50,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      
      // Initialize camera with spherical coordinates
      const updateCameraPosition = () => {
        const { radius, theta, phi } = sphericalRef.current;
        camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(cameraTargetRef.current);
      };
      updateCameraPosition();
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
      directionalLight.position.set(5, 10, 7);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
      fillLight.position.set(-5, 3, -5);
      scene.add(fillLight);

      // Grid for reference
      const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xeeeeee);
      gridHelper.position.y = -3;
      scene.add(gridHelper);

      // Create enclosure box if dimensions provided
      if (enclosureDimensions) {
        const { width, depth, height } = enclosureDimensions;
        // Convert inches to Three.js units (scaled for visibility)
        const scale = 0.15; // Adjust this to control box size in scene
        const boxWidth = width * scale;
        const boxDepth = depth * scale;
        const boxHeight = height * scale;

        // Create wireframe box geometry
        const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
        const boxMaterial = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
        const boxWireframe = new THREE.LineSegments(
          new THREE.EdgesGeometry(boxGeometry),
          boxMaterial
        );
        boxWireframe.position.set(0, boxHeight / 2, 0);
        scene.add(boxWireframe);

        // Update drag plane to match box bounds
        dragPlaneRef.current.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, 0)
        );
      } else {
        // Fallback: create a default plane
        dragPlaneRef.current.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, 0)
        );
      }

      // Load initial model
      const loader = new GLTFLoader();
      let loadedCount = 0;
      
      const addModel = (url: string, modelName?: string, proceduralGenerator?: () => THREE.Object3D) => {
        // If procedural generator is provided, use it instead of loading from URL
        if (proceduralGenerator) {
          const model = proceduralGenerator();
          const modelId = `model-${loadedCount++}`;
          
          // Apply transformations
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          
          const scale = 2 / Math.max(maxDim, 0.1);
          model.scale.setScalar(scale);
          
          model.position.set(
            -center.x * scale + (loadedCount - 1) * 2,
            -center.y * scale,
            -center.z * scale
          );
          
          scene.add(model);
          
          const loadedModel: LoadedModel = {
            id: modelId,
            name: modelName || 'Procedural Model',
            object: model,
            position: { x: model.position.x, y: model.position.y, z: model.position.z },
            visible: true,
          };
          
          modelsRef.current.set(modelId, loadedModel);
          const newModels = Array.from(modelsRef.current.values());
          setModels(newModels);
          onModelsChange?.(newModels);
          return;
        }
        
        // Otherwise load GLB file
        console.log('Loading model from:', url);
        loader.load(
          url,
          (gltf) => {
            const model = gltf.scene;
            const modelId = `model-${loadedCount++}`;
            
            console.log('Model loaded successfully:', model);
            
            // Ensure all meshes have materials and are visible
            model.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                
                // Ensure material is visible - if no material, add a basic one
                if (!mesh.material) {
                  mesh.material = new THREE.MeshStandardMaterial({ 
                    color: 0x8B4513,
                    roughness: 0.7,
                    metalness: 0.1 
                  });
                } else {
                  if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(mat => {
                      mat.side = THREE.DoubleSide;
                      mat.needsUpdate = true;
                    });
                  } else {
                    mesh.material.side = THREE.DoubleSide;
                    mesh.material.needsUpdate = true;
                  }
                }
              }
            });
            
            // Center and scale model
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            
            console.log('Model size:', size, 'Max dimension:', maxDim);
            
            // Scale to visible size (larger)
            const scale = 5 / maxDim; // Increased from 3 to 5
            model.scale.setScalar(scale);
            
            // Center the model
            model.position.set(
              -center.x * scale,
              -center.y * scale,
              -center.z * scale
            );
            
            console.log('Model position after centering:', model.position);
            console.log('Model scale:', model.scale);

            scene.add(model);

            const loadedModel: LoadedModel = {
              id: modelId,
              name: modelName || url.split('/').pop() || 'Model',
              object: model,
              position: { x: model.position.x, y: model.position.y, z: model.position.z },
              visible: true,
            };

            modelsRef.current.set(modelId, loadedModel);
            const newModels = Array.from(modelsRef.current.values());
            setModels(newModels);
            onModelsChange?.(newModels);
          },
          (progress) => {
            console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
          },
          (error) => {
            console.error('Error loading model:', error);
          }
        );
      };

      // Expose addModel function to parent
      onAddModelReady?.(addModel);

      // Load initial model
      if (modelsRef.current.size === 0 && modelUrl) {
        addModel(modelUrl);
      }

      // Mouse controls for selection, dragging, and orbit
      const onMouseDown = (event: MouseEvent) => {
        lastMousePosRef.current = { x: event.clientX, y: event.clientY };
        
        // Right-click for orbit
        if (event.button === 2) {
          isOrbitingRef.current = true;
          renderer.domElement.style.cursor = 'move';
          return;
        }
        
        // Left-click for model selection
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        raycasterRef.current.setFromCamera(mouse, camera);

        // Check intersection with all models
        modelsRef.current.forEach((model) => {
          if (model.visible) {
            const intersects = raycasterRef.current.intersectObject(model.object, true);
            if (intersects.length > 0) {
              console.log('Model clicked:', model.name);
              selectedModelRef.current = model;
              isDraggingRef.current = true;
              
              // Setup drag plane parallel to camera
              dragPlaneRef.current.setFromNormalAndCoplanarPoint(
                camera.getWorldDirection(new THREE.Vector3()).negate(),
                model.object.position
              );
              
              // Change cursor
              renderer.domElement.style.cursor = 'grabbing';
              return;
            }
          }
        });
      };

      const onMouseMove = (event: MouseEvent) => {
        const deltaX = event.clientX - lastMousePosRef.current.x;
        const deltaY = event.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: event.clientX, y: event.clientY };
        
        // Handle camera orbit
        if (isOrbitingRef.current) {
          sphericalRef.current.theta -= deltaX * 0.01;
          sphericalRef.current.phi -= deltaY * 0.01;
          
          // Clamp phi to prevent flipping
          sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalRef.current.phi));
          
          const { radius, theta, phi } = sphericalRef.current;
          camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
          camera.position.y = radius * Math.cos(phi);
          camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
          camera.lookAt(cameraTargetRef.current);
          return;
        }
        
        // Handle model dragging
        if (!isDraggingRef.current || !selectedModelRef.current) return;

        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        raycasterRef.current.setFromCamera(mouse, camera);
        
        if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, dragPointRef.current)) {
          selectedModelRef.current.object.position.copy(dragPointRef.current);
          selectedModelRef.current.position = {
            x: Math.round(dragPointRef.current.x * 100) / 100,
            y: Math.round(dragPointRef.current.y * 100) / 100,
            z: Math.round(dragPointRef.current.z * 100) / 100,
          };
          
          // Throttle UI updates to ~60fps
          const now = Date.now();
          if (now - lastUpdateRef.current > 16) {
            lastUpdateRef.current = now;
            const updatedModels = Array.from(modelsRef.current.values());
            setModels(updatedModels);
          }
        }
      };

      const onMouseUp = () => {
        isDraggingRef.current = false;
        isOrbitingRef.current = false;
        renderer.domElement.style.cursor = 'default';
        
        if (selectedModelRef.current) {
          console.log('Final position:', selectedModelRef.current.position);
          const updatedModels = Array.from(modelsRef.current.values());
          onModelsChange?.(updatedModels);
        }
      };

      renderer.domElement.addEventListener('mousedown', onMouseDown);
      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('mouseup', onMouseUp);
      
      // Prevent context menu on right-click
      renderer.domElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });

      // Zoom with scroll - adjust spherical radius
      renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        sphericalRef.current.radius += e.deltaY * 0.02;
        sphericalRef.current.radius = Math.max(3, Math.min(30, sphericalRef.current.radius));
        
        const { radius, theta, phi } = sphericalRef.current;
        camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(cameraTargetRef.current);
      });

      // Animation loop
      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        initializedRef.current = false;
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('mousedown', onMouseDown);
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        renderer.domElement.removeEventListener('mouseup', onMouseUp);
        
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
        
        // Dispose of geometries and materials
        scene.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => mat.dispose());
            } else {
              mesh.material?.dispose();
            }
          }
        });
        
        modelsRef.current.clear();
        
        if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (error) {
      console.error('Canvas setup error:', error);
      initializedRef.current = false;
      return;
    }
  }, []); // Empty dependency array - only run once

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        cursor: 'grab',
      }}
    />
  );
}
