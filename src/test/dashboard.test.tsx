import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'

// Mock API service
vi.mock('../lib/api-service-complete', () => ({
  default: {
    getCompanies: vi.fn(),
    getTasks: vi.fn(),
    getNotifications: vi.fn(),
  }
}))

// Mock auth hook
vi.mock('../hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: '123',
      email: 'test@example.com',
      full_name: 'Test User',
      registration_role: 'company_owner'
    },
    isAuthenticated: true,
    logout: vi.fn()
  })
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dashboard with user data', async () => {
    const { default: apiService } = await import('../lib/api-service-complete')
    
    vi.mocked(apiService.getCompanies).mockResolvedValue([
      {
        id: '1',
        name: 'Test Company',
        industry: 'Technology',
        compliance_health: 85
      }
    ])

    vi.mocked(apiService.getTasks).mockResolvedValue([
      {
        id: '1',
        title: 'Complete Audit',
        status: 'pending',
        priority: 'high'
      }
    ])

    vi.mocked(apiService.getNotifications).mockResolvedValue([])

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    expect(screen.getByText(/welcome/i)).toBeInTheDocument()
    expect(screen.getByText(/test user/i)).toBeInTheDocument()
  })

  it('should display compliance health score', async () => {
    const { default: apiService } = await import('../lib/api-service-complete')
    
    vi.mocked(apiService.getCompanies).mockResolvedValue([
      {
        id: '1',
        name: 'Test Company',
        compliance_health: 92
      }
    ])

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    // Wait for component to load
    await screen.findByText(/92%/i)
    expect(screen.getByText(/92%/i)).toBeInTheDocument()
  })

  it('should show pending tasks count', async () => {
    const { default: apiService } = await import('../lib/api-service-complete')
    
    vi.mocked(apiService.getTasks).mockResolvedValue([
      { id: '1', status: 'pending', title: 'Task 1' },
      { id: '2', status: 'pending', title: 'Task 2' },
      { id: '3', status: 'completed', title: 'Task 3' }
    ])

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    // Should show 2 pending tasks
    await screen.findByText(/2/i)
    expect(screen.getByText(/pending/i)).toBeInTheDocument()
  })

  it('should handle API errors gracefully', async () => {
    const { default: apiService } = await import('../lib/api-service-complete')
    
    vi.mocked(apiService.getCompanies).mockRejectedValue(new Error('API Error'))
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    // Should show error state or fallback
    expect(screen.getByText(/something went wrong/i) || screen.getByText(/unable to load/i)).toBeInTheDocument()
  })
})

describe('Dashboard Performance', () => {
  it('should render within performance budget', async () => {
    const startTime = performance.now()
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Should render within 100ms
    expect(renderTime).toBeLessThan(100)
  })

  it('should not cause memory leaks', async () => {
    const { unmount } = render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    )

    // Unmount component
    unmount()

    // Check that no timers or subscriptions are left
    expect(vi.getTimerCount()).toBe(0)
  })
})