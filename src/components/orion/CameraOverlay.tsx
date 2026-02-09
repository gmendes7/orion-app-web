/**
 * 📷 CameraOverlay - Camera capture overlay
 * Extracted from OrionInterface for modularity.
 */

import { motion, AnimatePresence } from "framer-motion";

interface CameraOverlayProps {
  camera: {
    isActive: boolean;
    isAnalyzing: boolean;
    setVideoRef: (ref: HTMLVideoElement | null) => void;
    setCanvasRef: (ref: HTMLCanvasElement | null) => void;
    captureAndAnalyze: () => void;
    stopCamera: () => void;
  };
}

export const CameraOverlay = ({ camera }: CameraOverlayProps) => {
  return (
    <AnimatePresence>
      {camera.isActive && (
        <motion.div
          className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative w-full max-w-2xl aspect-video rounded-xl md:rounded-2xl overflow-hidden border border-orion-stellar-gold/30">
            <video
              ref={(ref) => camera.setVideoRef(ref)}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={(ref) => camera.setCanvasRef(ref)} className="hidden" />
            
            <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <motion.button
                className="px-4 md:px-6 py-2 rounded-full bg-orion-stellar-gold text-orion-void font-medium text-sm touch-target"
                onClick={() => camera.captureAndAnalyze()}
                disabled={camera.isAnalyzing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {camera.isAnalyzing ? "Analisando..." : "📷 Capturar"}
              </motion.button>
              <motion.button
                className="px-4 md:px-6 py-2 rounded-full border border-orion-stellar-gold/50 text-orion-stellar-gold text-sm touch-target"
                onClick={() => camera.stopCamera()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✕ Fechar
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CameraOverlay;
