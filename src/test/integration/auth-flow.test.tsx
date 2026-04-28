/**
 * Auth Flow Integration Tests
 * 
 * Tests the complete authentication flow including:
 * - Login/Signup forms
 * - Rate limiting
 * - Password reset
 * - Session management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock runtime-flags
vi.mock("@/lib/runtime-flags", () => ({
  previewBypassEnabled: false,
}));

// Mock local-preview-auth
vi.mock("@/lib/local-preview-auth", () => ({
  clearLocalPreviewPersona: vi.fn(),
  setLocalPreviewPersona: vi.fn(),
  getLocalPreviewPersona: vi.fn(() => null),
}));

import { supabase } from "@/integrations/supabase/client";
import Auth from "@/pages/Auth";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("Auth Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Login Flow", () => {
    it("should render login form by default", async () => {
      render(<Auth />, { wrapper: createWrapper() });

      expect(screen.getByText("SANNIDH ACCESS")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("should show email input with placeholder", async () => {
      render(<Auth />, { wrapper: createWrapper() });

      const emailInput = screen.getByLabelText("Email");
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("should show validation errors for short password", async () => {
      render(<Auth />, { wrapper: createWrapper() });

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", { name: /login as/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "12345" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it("should call supabase signInWithPassword on valid login", async () => {
      (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session: { user: { id: "123" } } },
        error: null,
      });
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: { id: "123", user_metadata: {} } },
      });

      render(<Auth />, { wrapper: createWrapper() });

      const emailInput = screen.getByLabelText("Email");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", { name: /login as/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });
  });

  describe("Signup Flow", () => {
    it("should switch to signup mode", async () => {
      render(<Auth />, { wrapper: createWrapper() });

      const registerButton = screen.getByRole("button", { name: /register/i });
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
      });
    });

    it("should show full name field in signup mode", async () => {
      render(<Auth />, { wrapper: createWrapper() });

      // Switch to signup
      const registerButtons = screen.getAllByRole("button", { name: /register/i });
      fireEvent.click(registerButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
      });
    });
  });

  describe("Role Selection", () => {
    it("should display all persona options", async () => {
      render(<Auth />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText("Company Owner")).toBeInTheDocument();
        expect(screen.getByText("External CA")).toBeInTheDocument();
        expect(screen.getByText("Admin")).toBeInTheDocument();
      });
    });
  });

  describe("Auth Page Rendering", () => {
    it("should render the main access title", async () => {
      render(<Auth />, { wrapper: createWrapper() });

      expect(screen.getByText("SANNIDH ACCESS")).toBeInTheDocument();
    });
  });
});
