import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy load components for better performance
const LazyAdvancedPlatformPage = lazy(() => import('./pages/AdvancedPlatformPage'))
const LazyAdvancedSolutionsPage = lazy(() => import('./pages/AdvancedSolutionsPage'))
const LazyAdvancedSecurityPage = lazy(() => import('./pages/AdvancedSecurityPage'))
const LazyAdvancedCustomersPage = lazy(() => import('./pages/AdvancedCustomersPage'))
const LazyAdvancedResourcesPage = lazy(() => import('./pages/AdvancedResourcesPage'))
const LazyAboutPage = lazy(() => import('./pages/AboutPage'))

// Dashboard lazy loading
const LazyDashboard = lazy(() => import('./pages/Dashboard'))
const LazyCADashboard = lazy(() => import('./pages/CADashboard'))
const LazyAdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const LazyCAFirmDashboard = lazy(() => import('./pages/CAFirmDashboard'))

// Large components lazy loading
const LazyComplianceChatbot = lazy(() => import('./components/ca-dashboard/ComplianceChatbot'))
const LazyAIBusinessIntelligencePanel = lazy(() => import('./components/dashboard/AIBusinessIntelligencePanel'))

// Loading fallback component
export const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
      <p className="text-slate-400">Loading...</p>
    </div>
  </div>
)

// High-Order Component for lazy loading with error boundary
export const withLazyLoading = (Component: React.ComponentType) => {
  return (props: any) => (
    <Suspense fallback={<PageLoader />}>
      <Component {...props} />
    </Suspense>
  )
}

// Export lazy components
export {
  LazyAdvancedPlatformPage,
  LazyAdvancedSolutionsPage,
  LazyAdvancedSecurityPage,
  LazyAdvancedCustomersPage,
  LazyAdvancedResourcesPage,
  LazyAboutPage,
  LazyDashboard,
  LazyCADashboard,
  LazyAdminDashboard,
  LazyCAFirmDashboard,
  LazyComplianceChatbot,
  LazyAIBusinessIntelligencePanel
}