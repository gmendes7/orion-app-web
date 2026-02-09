/**
 * 📱 useDeviceAdaptation - Adaptive device detection hook
 * 
 * Detects device type, orientation, and GPU capability
 * to adapt ORION's interface in real-time.
 */

import { useState, useEffect, useCallback, useRef } from "react";

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
  isOrientationChanging: boolean;
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
  const [isOrientationChanging, setIsOrientationChanging] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const reducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  const isLowPerformance = typeof navigator !== "undefined"
    ? (navigator.hardwareConcurrency ?? 4) <= 2
    : false;

  useEffect(() => {
    const handleChange = () => {
      const newOrientation = getOrientation();
      const prevOrientation = orientation;

      setDeviceType(getDeviceType());

      if (newOrientation !== prevOrientation) {
        setIsOrientationChanging(true);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsOrientationChanging(false), 500);
      }

      setOrientation(newOrientation);
    };

    window.addEventListener("resize", handleChange);
    window.addEventListener("orientationchange", handleChange);

    return () => {
      window.removeEventListener("resize", handleChange);
      window.removeEventListener("orientationchange", handleChange);
      clearTimeout(timeoutRef.current);
    };
  }, [getDeviceType, getOrientation, orientation]);

  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";
  const isDesktop = deviceType === "desktop";

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
    isOrientationChanging,
  };
}
