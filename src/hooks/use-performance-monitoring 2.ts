import { useEffect } from 'react';
import { logPerformanceMetric } from '@/lib/api-service-complete';

/**
 * Performance monitoring hook for Core Web Vitals
 */
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor page load performance
    const measurePageLoad = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          // First Contentful Paint
          const fcp = performance.getEntriesByName('first-contentful-paint')[0];
          if (fcp) {
            logPerformanceMetric('first_contentful_paint', fcp.startTime, 'ms', {
              page: window.location.pathname
            });
          }

          // Largest Contentful Paint
          if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              logPerformanceMetric('largest_contentful_paint', lastEntry.startTime, 'ms', {
                page: window.location.pathname
              });
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

            // Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((list) => {
              let clsValue = 0;
              for (const entry of list.getEntries()) {
                if (!(entry as any).hadRecentInput) {
                  clsValue += (entry as any).value;
                }
              }
              logPerformanceMetric('cumulative_layout_shift', clsValue, 'score', {
                page: window.location.pathname
              });
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });

            // First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                logPerformanceMetric('first_input_delay', (entry as any).processingStart - entry.startTime, 'ms', {
                  page: window.location.pathname
                });
              }
            });
            fidObserver.observe({ type: 'first-input', buffered: true });
          }

          // Page load metrics
          logPerformanceMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'ms', {
            page: window.location.pathname
          });
          
          logPerformanceMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms', {
            page: window.location.pathname
          });
        }
      }
    };

    // Wait for page to fully load before measuring
    if (document.readyState === 'complete') {
      measurePageLoad();
    } else {
      window.addEventListener('load', measurePageLoad);
    }

    // Monitor memory usage periodically
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        logPerformanceMetric('memory_used_heap', memory.usedJSHeapSize, 'bytes');
        logPerformanceMetric('memory_total_heap', memory.totalJSHeapSize, 'bytes');
      }
    };

    const memoryInterval = setInterval(monitorMemory, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('load', measurePageLoad);
      clearInterval(memoryInterval);
    };
  }, []);
};

/**
 * Custom hook for monitoring API response times
 */
export const useAPIMonitoring = () => {
  const monitorAPICall = async (endpoint: string, apiCall: () => Promise<any>) => {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const responseTime = Date.now() - startTime;
      
      logPerformanceMetric('api_response_time', responseTime, 'ms', {
        endpoint,
        status: 'success'
      });
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logPerformanceMetric('api_response_time', responseTime, 'ms', {
        endpoint,
        status: 'error'
      });
      
      throw error;
    }
  };

  return { monitorAPICall };
};

/**
 * Hook for monitoring component render performance
 */
export const useRenderMonitoring = (componentName: string) => {
  useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const renderTime = Date.now() - startTime;
      logPerformanceMetric('component_render_time', renderTime, 'ms', {
        component: componentName
      });
    };
  }, [componentName]);
};

/**
 * Network quality monitoring
 */
export const useNetworkMonitoring = () => {
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const logNetworkInfo = () => {
        logPerformanceMetric('network_effective_type', 0, 'string', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      };

      logNetworkInfo();
      connection.addEventListener('change', logNetworkInfo);

      return () => {
        connection.removeEventListener('change', logNetworkInfo);
      };
    }
  }, []);
};