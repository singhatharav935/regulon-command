export type LandingLeadInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  inquiryType?: string | null;
  message?: string | null;
  source?: string | null;
};

const clean = (value: unknown, max = 300) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
};

const normalizeEmail = (value: unknown) => {
  const text = clean(value, 320);
  return text ? text.toLowerCase() : null;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeLandingLead = (input: LandingLeadInput) => {
  const email = normalizeEmail(input.email);
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new Error("email is required and must be valid");
  }

  const inquiryTypeRaw = clean(input.inquiryType, 80)?.toLowerCase() ?? "general";
  const inquiryType = ["general", "onboarding", "expert", "newsletter", "demo", "sales"].includes(inquiryTypeRaw)
    ? inquiryTypeRaw
    : "general";

  return {
    name: clean(input.name, 160),
    email,
    phone: clean(input.phone, 40),
    company_name: clean(input.companyName, 160),
    inquiry_type: inquiryType,
    message: clean(input.message, 4000),
    source: clean(input.source, 120) ?? "landing",
  };
};
