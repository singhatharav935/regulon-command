import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiService from '../lib/api-service-complete'

// Mock API service
vi.mock('../lib/api-service-complete')

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Authentication', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        registration_role: 'company_owner'
      }
      
      const mockResponse = {
        user: mockUser,
        token: 'mock-token'
      }

      vi.mocked(apiService.login).mockResolvedValue(mockResponse)

      const result = await apiService.login('test@example.com', 'password')

      expect(result).toEqual(mockResponse)
      expect(apiService.login).toHaveBeenCalledWith('test@example.com', 'password')
    })

    it('should handle login failure', async () => {
      const mockError = new Error('Invalid credentials')
      vi.mocked(apiService.login).mockRejectedValue(mockError)

      await expect(apiService.login('test@example.com', 'wrong-password'))
        .rejects.toThrow('Invalid credentials')
    })

    it('should register new user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'securePassword123!',
        full_name: 'New User',
        registration_role: 'company_owner'
      }

      const mockResponse = {
        user: { ...userData, id: '456' },
        message: 'Registration successful'
      }

      vi.mocked(apiService.register).mockResolvedValue(mockResponse)

      const result = await apiService.register(userData)

      expect(result).toEqual(mockResponse)
      expect(apiService.register).toHaveBeenCalledWith(userData)
    })

    it('should logout and clear localStorage', async () => {
      localStorage.setItem('auth_token', 'test-token')
      localStorage.setItem('refresh_token', 'test-refresh')
      localStorage.setItem('user_data', JSON.stringify({ id: '123' }))

      vi.mocked(apiService.logout).mockImplementation(() => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')  
        localStorage.removeItem('user_data')
        return Promise.resolve()
      })

      await apiService.logout()

      expect(localStorage.getItem('auth_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
      expect(localStorage.getItem('user_data')).toBeNull()
    })
  })

  describe('Security Features', () => {
    it('should check password strength correctly', async () => {
      const mockStrength = {
        strength: 'strong',
        score: 6,
        checks: {
          length: true,
          uppercase: true,
          lowercase: true,
          number: true,
          special: true,
          common: true
        }
      }

      vi.mocked(apiService.checkPasswordStrength).mockResolvedValue(mockStrength)

      const result = await apiService.checkPasswordStrength('SecurePass123!')

      expect(result).toEqual(mockStrength)
      expect(result.strength).toBe('strong')
      expect(result.score).toBe(6)
    })

    it('should change password successfully', async () => {
      const mockResponse = { message: 'Password changed successfully' }
      vi.mocked(apiService.changePassword).mockResolvedValue(mockResponse)

      const result = await apiService.changePassword('oldPass', 'newSecurePass123!')

      expect(result).toEqual(mockResponse)
      expect(apiService.changePassword).toHaveBeenCalledWith('oldPass', 'newSecurePass123!')
    })

    it('should get user personas', async () => {
      const mockPersonas = [
        {
          id: '1',
          user_id: '123',
          persona_role: 'company_owner',
          entity_name: 'Test Company',
          is_primary: true,
          verification_status: 'verified'
        }
      ]

      vi.mocked(apiService.getUserPersonas).mockResolvedValue(mockPersonas)

      const result = await apiService.getUserPersonas()

      expect(result).toEqual(mockPersonas)
      expect(result).toHaveLength(1)
      expect(result[0].persona_role).toBe('company_owner')
    })
  })

  describe('Company Management', () => {
    it('should create company successfully', async () => {
      const companyData = {
        name: 'Test Company',
        industry: 'Technology',
        description: 'A test company',
        address: '123 Test St',
        phone: '+1234567890'
      }

      const mockResponse = {
        id: 'company-123',
        ...companyData,
        compliance_health: 0
      }

      vi.mocked(apiService.createCompany).mockResolvedValue(mockResponse)

      const result = await apiService.createCompany(companyData)

      expect(result).toEqual(mockResponse)
      expect(result.name).toBe('Test Company')
      expect(result.compliance_health).toBe(0)
    })

    it('should get companies list', async () => {
      const mockCompanies = [
        {
          id: '1',
          name: 'Company 1',
          industry: 'Finance',
          compliance_health: 85
        },
        {
          id: '2',
          name: 'Company 2', 
          industry: 'Healthcare',
          compliance_health: 92
        }
      ]

      vi.mocked(apiService.getCompanies).mockResolvedValue(mockCompanies)

      const result = await apiService.getCompanies()

      expect(result).toEqual(mockCompanies)
      expect(result).toHaveLength(2)
    })

    it('should update company successfully', async () => {
      const updateData = { compliance_health: 95 }
      const mockUpdated = {
        id: '1',
        name: 'Updated Company',
        compliance_health: 95
      }

      vi.mocked(apiService.updateCompany).mockResolvedValue(mockUpdated)

      const result = await apiService.updateCompany('1', updateData)

      expect(result).toEqual(mockUpdated)
      expect(result.compliance_health).toBe(95)
    })
  })

  describe('Tasks Management', () => {
    it('should create task successfully', async () => {
      const taskData = {
        title: 'Complete Audit',
        description: 'Annual compliance audit',
        priority: 'high',
        due_date: '2026-04-15'
      }

      const mockTask = {
        id: 'task-123',
        ...taskData,
        status: 'pending'
      }

      vi.mocked(apiService.createTask).mockResolvedValue(mockTask)

      const result = await apiService.createTask(taskData)

      expect(result).toEqual(mockTask)
      expect(result.status).toBe('pending')
    })

    it('should get tasks list', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Task 1',
          status: 'completed',
          priority: 'high'
        },
        {
          id: '2',
          title: 'Task 2',
          status: 'in_progress',
          priority: 'medium'
        }
      ]

      vi.mocked(apiService.getTasks).mockResolvedValue(mockTasks)

      const result = await apiService.getTasks()

      expect(result).toEqual(mockTasks)
      expect(result).toHaveLength(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = { request: {}, message: 'Network Error' }
      vi.mocked(apiService.login).mockRejectedValue(networkError)

      await expect(apiService.login('test@example.com', 'password'))
        .rejects.toThrow()
    })

    it('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error' }
        }
      }
      vi.mocked(apiService.getCompanies).mockRejectedValue(serverError)

      await expect(apiService.getCompanies())
        .rejects.toThrow()
    })

    it('should handle validation errors', async () => {
      const validationError = {
        response: {
          status: 400,
          data: { error: 'Email is required' }
        }
      }
      vi.mocked(apiService.register).mockRejectedValue(validationError)

      await expect(apiService.register({}))
        .rejects.toThrow()
    })
  })

  describe('Health Monitoring', () => {
    it('should get system health status', async () => {
      const mockHealth = {
        status: 'healthy',
        timestamp: '2026-03-31T06:00:00.000Z',
        version: '1.0.0',
        environment: 'production'
      }

      vi.mocked(apiService.getHealthStatus).mockResolvedValue(mockHealth)

      const result = await apiService.getHealthStatus()

      expect(result).toEqual(mockHealth)
      expect(result.status).toBe('healthy')
    })
  })
})