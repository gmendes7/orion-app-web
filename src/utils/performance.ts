// Performance optimizations
export const performanceOptimizations = {
  // Configurações de debounce para eventos
  debounceSettings: {
    mouseMove: 16, // ~60fps
    scroll: 16,
    resize: 100,
  },

  // Configurações de intersection observer para lazy loading
  intersectionObserver: {
    rootMargin: "50px",
    threshold: 0.1,
  },

  // Preload de recursos críticos
  preloadCriticalResources: () => {
    // Preload fonts
    const orbitronFont = new FontFace(
      "Orbitron",
      "url(https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap)"
    );

    const interFont = new FontFace(
      "Inter",
      "url(https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap)"
    );

    Promise.all([orbitronFont.load(), interFont.load()]).then((fonts) => {
      fonts.forEach((font) => document.fonts.add(font));
    });
  },

  // Otimizações de imagem
  imageOptimizations: {
    // Lazy loading automático para imagens
    setupLazyImages: () => {
      if ("loading" in HTMLImageElement.prototype) {
        const images = document.querySelectorAll("img[data-src]");
        images.forEach((img) => {
          (img as HTMLImageElement).src = (
            img as HTMLImageElement
          ).dataset.src!;
        });
      }
    },

    // Compressão de imagens via canvas
    compressImage: (file: File, quality: number = 0.7): Promise<Blob> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(resolve as BlobCallback, "image/jpeg", quality);
        };

        img.src = URL.createObjectURL(file);
      });
    },
  },

  // Otimizações de CSS e animações
  cssOptimizations: {
    // Configurar will-change apenas quando necessário
    setupWillChange: () => {
      const animatedElements = document.querySelectorAll("[data-animated]");
      animatedElements.forEach((el) => {
        el.addEventListener("animationstart", () => {
          (el as HTMLElement).style.willChange = "transform, opacity";
        });
        el.addEventListener("animationend", () => {
          (el as HTMLElement).style.willChange = "auto";
        });
      });
    },

    // Reduzir motion para usuários que preferem menos animações
    respectReducedMotion: () => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

      if (prefersReducedMotion.matches) {
        document.documentElement.style.setProperty(
          "--animation-duration",
          "0.01s"
        );
        document.documentElement.style.setProperty(
          "--transition-duration",
          "0.01s"
        );
      }
    },
  },

  // Web Workers para tarefas pesadas
  webWorkers: {
    // Worker para processamento de dados
    createDataWorker: () => {
      const workerBlob = new Blob(
        [
          `
        self.onmessage = function(e) {
          const { type, data } = e.data;
          
          switch(type) {
            case 'PROCESS_CHAT_DATA':
              // Processar dados do chat em background
              const processed = data.map(msg => ({
                ...msg,
                processed: true,
                timestamp: new Date(msg.timestamp)
              }));
              self.postMessage({ type: 'CHAT_DATA_PROCESSED', data: processed });
              break;
              
            case 'COMPRESS_DATA':
              // Comprimir dados para storage
              try {
                const compressed = JSON.stringify(data);
                self.postMessage({ type: 'DATA_COMPRESSED', data: compressed });
              } catch (error) {
                self.postMessage({ type: 'ERROR', error: error.message });
              }
              break;
          }
        };
      `,
        ],
        { type: "application/javascript" }
      );

      return new Worker(URL.createObjectURL(workerBlob));
    },
  },

  // Service Worker para cache
  serviceWorker: {
    register: async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker registrado:", registration);
          return registration;
        } catch (error) {
          // Service Worker não disponível no ambiente de desenvolvimento
          return null;
        }
      }
    },
  },

  // Métricas de performance
  metrics: {
    // Medir Core Web Vitals
    measureWebVitals: () => {
      // LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log("LCP:", lastEntry.startTime);
      }).observe({ type: "largest-contentful-paint", buffered: true });

      // FID (First Input Delay)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          // some PerformanceEntry subtypes may have processingStart
          const processingStart = (
            entry as unknown as { processingStart?: number }
          ).processingStart;
          if (typeof processingStart === "number") {
            console.log("FID:", processingStart - entry.startTime);
          }
        });
      }).observe({ type: "first-input", buffered: true });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          const hadRecentInput = (
            entry as unknown as { hadRecentInput?: boolean }
          ).hadRecentInput;
          const value = (entry as unknown as { value?: number }).value;
          if (!hadRecentInput) {
            clsValue += value || 0;
          }
        });
        console.log("CLS:", clsValue);
      }).observe({ type: "layout-shift", buffered: true });
    },

    // Monitorar uso de memória
    monitorMemory: () => {
      if ("memory" in performance) {
        setInterval(() => {
          const memory = (
            performance as unknown as {
              memory?: {
                usedJSHeapSize?: number;
                totalJSHeapSize?: number;
                jsHeapSizeLimit?: number;
              };
            }
          ).memory;
          console.log("Memory usage:", {
            used: Math.round((memory?.usedJSHeapSize || 0) / 1048576) + " MB",
            total: Math.round((memory?.totalJSHeapSize || 0) / 1048576) + " MB",
            limit: Math.round((memory?.jsHeapSizeLimit || 0) / 1048576) + " MB",
          });
        }, 30000); // A cada 30 segundos
      }
    },
  },

  // Inicializar todas as otimizações
  initialize: () => {
    // Aplicar otimizações imediatamente
    performanceOptimizations.preloadCriticalResources();
    performanceOptimizations.cssOptimizations.respectReducedMotion();
    performanceOptimizations.cssOptimizations.setupWillChange();
    performanceOptimizations.imageOptimizations.setupLazyImages();

    // Registrar service worker
    performanceOptimizations.serviceWorker.register();

    // Iniciar métricas (apenas em produção)
    if (process.env.NODE_ENV === "production") {
      performanceOptimizations.metrics.measureWebVitals();
      performanceOptimizations.metrics.monitorMemory();
    }
  },
};

export default performanceOptimizations;
