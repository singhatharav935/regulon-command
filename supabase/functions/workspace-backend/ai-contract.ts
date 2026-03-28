export type AiOperation =
  | "draft"
  | "generate"
  | "notice-details"
  | "recheck"
  | "apply-fix"
  | "fix"
  | "notice-ocr";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asNonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const parseOperation = (value: unknown): AiOperation => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (
    normalized === "draft" ||
    normalized === "generate" ||
    normalized === "notice-details" ||
    normalized === "recheck" ||
    normalized === "apply-fix" ||
    normalized === "fix" ||
    normalized === "notice-ocr"
  ) {
    return normalized;
  }
  throw new Error("operation is invalid");
};

const assertValidUuid = (value: string, field: string) => {
  if (!UUID_REGEX.test(value)) {
    throw new Error(`${field} must be a valid UUID`);
  }
};

export const validateAiOperationContractPayload = (payload: Record<string, unknown>) => {
  const operation = parseOperation(payload.operation);

  const companyId = asNonEmptyString(payload.companyId);
  if (companyId) {
    assertValidUuid(companyId, "companyId");
  }

  const draftRunId = asNonEmptyString(payload.draftRunId);
  if (draftRunId) {
    assertValidUuid(draftRunId, "draftRunId");
  }

  const documentType = asNonEmptyString(payload.documentType);
  const noticeInput = asNonEmptyString(payload.noticeInput);
  const noticeDetails = asNonEmptyString(payload.noticeDetails);
  const context = asNonEmptyString(payload.context);
  const draft = asNonEmptyString(payload.draft);

  const operationsRequiringDocumentType = new Set<AiOperation>([
    "draft",
    "generate",
    "notice-details",
    "recheck",
    "apply-fix",
    "fix",
  ]);
  if (operationsRequiringDocumentType.has(operation) && !documentType) {
    throw new Error("documentType is required for this operation");
  }

  if (operation === "draft" || operation === "generate") {
    if (!noticeInput && !noticeDetails && !context) {
      throw new Error("noticeInput or noticeDetails or context is required for draft generation");
    }
  }

  if (operation === "notice-details" || operation === "notice-ocr") {
    if (!noticeInput && !noticeDetails) {
      throw new Error("noticeInput or noticeDetails is required for notice-details/notice-ocr");
    }
  }

  if (operation === "recheck" || operation === "apply-fix" || operation === "fix") {
    if (!draftRunId && !draft) {
      throw new Error("draftRunId or draft is required for recheck/apply-fix");
    }
  }

  if (typeof payload.expectedVersionNumber !== "undefined") {
    const version = Number(payload.expectedVersionNumber);
    if (!Number.isInteger(version) || version < 1) {
      throw new Error("expectedVersionNumber must be a positive integer");
    }
  }

  return {
    operation,
    companyId,
    draftRunId,
    documentType,
  };
};
