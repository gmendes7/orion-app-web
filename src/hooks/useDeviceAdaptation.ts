/**
 * 📱 useDeviceAdaptation - Adaptive device detection hook
 * 
 * Detects device type, orientation, and GPU capability
 * to adapt ORION's interface in real-time.
 */

import { useState, useEffect, useCallback } from "react";

export type DeviceType = "mobile" | "tablet" | "desktop";
export type Orientation = "portrait" | "landscape";

interface DeviceAdaptation {
  deviceType: DeviceType;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLowPerformance: boolean;
  particleCount: number;
  eyeSize: "sm" | "md" | "lg" | "xl";
  showParticles: boolean;
  reducedMotion: boolean;
}

export function useDeviceAdaptation(): DeviceAdaptation {
  const getDeviceType = useCallback((): DeviceType => {
    const w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w < 1024) return "tablet";
    return "desktop";
  }, []);

  const getOrientation = useCallback((): Orientation => {
    return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
  }, []);

  const [deviceType, setDeviceType] = useState<DeviceType>(getDeviceType);
  const [orientation, setOrientation] = useState<Orientation>(getOrientation);

  // Check for reduced motion preference
  const reducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // Simple GPU capability check
  const isLowPerformance = typeof navigator !== "undefined"
    ? (navigator.hardwareConcurrency ?? 4) <= 2
    : false;

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
      setOrientation(getOrientation());
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [getDeviceType, getOrientation]);

  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";
  const isDesktop = deviceType === "desktop";

  // Adaptive settings
  const particleCount = isLowPerformance || reducedMotion ? 0 
    : isMobile ? 25 
    : isTablet ? 40 
    : 80;

  const eyeSize: DeviceAdaptation["eyeSize"] = isMobile ? "md" : isTablet ? "lg" : "xl";

  const showParticles = !reducedMotion && !isLowPerformance;

  return {
    deviceType,
    orientation,
    isMobile,
    isTablet,
    isDesktop,
    isLowPerformance,
    particleCount,
    eyeSize,
    showParticles,
    reducedMotion,
  };
}
