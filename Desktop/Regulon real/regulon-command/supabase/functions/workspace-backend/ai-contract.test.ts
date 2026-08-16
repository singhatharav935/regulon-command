import { describe, expect, it } from "vitest";
import { validateAiOperationContractPayload } from "./ai-contract";

describe("AI contract validation", () => {
  it("accepts draft payload contract", () => {
    const result = validateAiOperationContractPayload({
      operation: "draft",
      documentType: "mca-notice",
      companyId: "11111111-1111-4111-8111-111111111111",
      noticeInput: "Notice facts",
    });
    expect(result.operation).toBe("draft");
  });

  it("accepts notice-details payload contract", () => {
    const result = validateAiOperationContractPayload({
      operation: "notice-details",
      documentType: "gst-show-cause",
      noticeInput: "SCN text",
    });
    expect(result.operation).toBe("notice-details");
  });

  it("accepts recheck payload contract", () => {
    const result = validateAiOperationContractPayload({
      operation: "recheck",
      documentType: "income-tax-response",
      draftRunId: "22222222-2222-4222-8222-222222222222",
    });
    expect(result.operation).toBe("recheck");
  });

  it("accepts apply-fix payload contract", () => {
    const result = validateAiOperationContractPayload({
      operation: "apply-fix",
      documentType: "contract-review",
      draft: "Current draft content",
      expectedVersionNumber: 2,
    });
    expect(result.operation).toBe("apply-fix");
  });

  it("rejects missing contract fields", () => {
    expect(() =>
      validateAiOperationContractPayload({
        operation: "draft",
        documentType: "mca-notice",
      }),
    ).toThrow("noticeInput or noticeDetails or context is required for draft generation");

    expect(() =>
      validateAiOperationContractPayload({
        operation: "recheck",
        documentType: "mca-notice",
      }),
    ).toThrow("draftRunId or draft is required for recheck/apply-fix");
  });
});
