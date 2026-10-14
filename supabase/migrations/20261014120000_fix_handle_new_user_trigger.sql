-- ============================================================================
-- FIX: handle_new_user() trigger — prevents 500 errors on supabase.auth.signUp
-- This migration ensures all required tables/types exist and wraps the trigger
-- body in an EXCEPTION block so user creation NEVER fails.
-- ============================================================================

-- 1) Ensure the app_role enum type exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('user', 'manager', 'admin');
  END IF;
END
$$;

-- 2) Ensure all tables the trigger inserts into exist
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.user_personas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona TEXT NOT NULL DEFAULT 'company_owner',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_verifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona TEXT,
  entity_name TEXT,
  registration_number TEXT,
  license_number TEXT,
  jurisdiction TEXT,
  status TEXT DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ca_workspace_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_type TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Recreate the handle_new_user() function with EXCEPTION handling
--    so signup NEVER fails even if a downstream table insert errors.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  registration_role TEXT := lower(coalesce(NEW.raw_user_meta_data->>'registration_role', 'company_owner'));
  mapped_role app_role := 'user';
  mapped_persona TEXT := 'company_owner';
  mapped_workspace TEXT := NULL;
BEGIN
  -- Validate role
  IF registration_role NOT IN ('external_ca', 'admin', 'company_owner', 'in_house_ca', 'in_house_lawyer', 'ca_firm') THEN
    registration_role := 'company_owner';
  END IF;

  -- Map role -> app_role, persona, workspace
  IF registration_role = 'admin' THEN
    mapped_role := 'admin';
    mapped_persona := 'admin';
  ELSIF registration_role = 'external_ca' THEN
    mapped_role := 'manager';
    mapped_persona := 'external_ca';
    mapped_workspace := 'external_ca';
  ELSIF registration_role = 'in_house_ca' THEN
    mapped_role := 'manager';
    mapped_persona := 'in_house_ca';
    mapped_workspace := 'sannidh_ca';
  ELSIF registration_role = 'in_house_lawyer' THEN
    mapped_role := 'manager';
    mapped_persona := 'in_house_lawyer';
  ELSIF registration_role = 'ca_firm' THEN
    mapped_role := 'manager';
    mapped_persona := 'ca_firm';
  ELSE
    mapped_role := 'user';
    mapped_persona := 'company_owner';
  END IF;

  -- Insert into profiles (safe — wrapped in EXCEPTION)
  BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profiles insert failed: %', SQLERRM;
  END;

  -- Insert role
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, mapped_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: user_roles insert failed: %', SQLERRM;
  END;

  -- Insert persona
  BEGIN
    INSERT INTO public.user_personas (user_id, persona)
    VALUES (NEW.id, mapped_persona)
    ON CONFLICT (user_id) DO UPDATE SET
      persona = EXCLUDED.persona,
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: user_personas insert failed: %', SQLERRM;
  END;

  -- Insert verification record
  BEGIN
    INSERT INTO public.user_verifications (
      user_id, persona, entity_name,
      registration_number, license_number, jurisdiction,
      status, is_verified
    )
    VALUES (
      NEW.id, mapped_persona,
      nullif(NEW.raw_user_meta_data->>'verification_entity_name', ''),
      nullif(NEW.raw_user_meta_data->>'verification_registration_number', ''),
      nullif(NEW.raw_user_meta_data->>'verification_license_number', ''),
      nullif(NEW.raw_user_meta_data->>'verification_jurisdiction', ''),
      'pending', false
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: user_verifications insert failed: %', SQLERRM;
  END;

  -- Insert workspace profile for CA roles
  IF mapped_workspace IS NOT NULL THEN
    BEGIN
      INSERT INTO public.ca_workspace_profiles (user_id, workspace_type)
      VALUES (NEW.id, mapped_workspace)
      ON CONFLICT (user_id) DO UPDATE SET
        workspace_type = EXCLUDED.workspace_type,
        updated_at = now();
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user: ca_workspace_profiles insert failed: %', SQLERRM;
    END;
  END IF;

  -- ALWAYS return NEW so the user is created regardless of downstream errors
  RETURN NEW;
END;
$$;

-- 4) Ensure the trigger exists (recreate to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5) Enable RLS but allow the trigger (SECURITY DEFINER) to insert
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ca_workspace_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own roles' AND tablename = 'user_roles') THEN
    CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own persona' AND tablename = 'user_personas') THEN
    CREATE POLICY "Users can read own persona" ON public.user_personas FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own verification' AND tablename = 'user_verifications') THEN
    CREATE POLICY "Users can read own verification" ON public.user_verifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
END
$$;
