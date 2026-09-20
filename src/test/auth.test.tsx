import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../hooks/use-auth'
import AuthReal from '../pages/Auth-Real-Enhanced'

// Mock API service
vi.mock('../lib/api-service-complete', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkPasswordStrength: vi.fn(),
  }
}))

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

describe('AuthReal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render login form by default', () => {
    render(
      <TestWrapper>
        <AuthReal />
      </TestWrapper>
    )

    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('should switch to registration form', () => {
    render(
      <TestWrapper>
        <AuthReal />
      </TestWrapper>
    )

    const signUpLink = screen.getByText(/sign up/i)
    fireEvent.click(signUpLink)

    expect(screen.getByText(/create account/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    render(
      <TestWrapper>
        <AuthReal />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
    })
  })

  it('should validate password requirements', async () => {
    render(
      <TestWrapper>
        <AuthReal />
      </TestWrapper>
    )

    // Switch to registration
    fireEvent.click(screen.getByText(/sign up/i))

    const passwordInput = screen.getByLabelText(/password/i)
    fireEvent.change(passwordInput, { target: { value: 'weak' } })
    fireEvent.blur(passwordInput)

    await waitFor(() => {
      expect(screen.getByText(/password must be/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during login', async () => {
    const { login } = await import('../lib/api-service-complete')
    vi.mocked(login.default.login).mockImplementation(() => new Promise(() => {}))

    render(
      <TestWrapper>
        <AuthReal />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('should display error message on login failure', async () => {
    const { default: apiService } = await import('../lib/api-service-complete')
    vi.mocked(apiService.login).mockRejectedValue(new Error('Invalid credentials'))

    render(
      <TestWrapper>
        <AuthReal />
      </TestWrapper>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })
})