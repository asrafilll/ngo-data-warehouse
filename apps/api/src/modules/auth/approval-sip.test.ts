import { describe, expect, it } from "vitest";
import {
  ApprovalSipError,
  approvalSipBridgeEmail,
  mapApprovalSipRole,
  parseApprovalSipUsers,
  type ApprovalSipUser,
} from "./approval-sip";

const baseUser: ApprovalSipUser = {
  id: "user-1",
  fullName: "Aisyah Rahma",
  phoneNumber: "+62 812-3456-7890",
  userType: "EMPLOYEE",
  role: "STAFF",
};

describe("approval SIP user mapping", () => {
  it("maps upstream identities to SIP roles", () => {
    expect(mapApprovalSipRole(baseUser)).toBe("admin");
    expect(mapApprovalSipRole({ ...baseUser, userType: "MANAGER" })).toBe("pengurus");
    expect(mapApprovalSipRole({ ...baseUser, userType: "VALIDATOR" })).toBe("verifikator");
    expect(mapApprovalSipRole({ ...baseUser, role: "ADMIN" })).toBe("super_admin");
  });

  it("builds a deterministic bridge email from the phone number", () => {
    expect(approvalSipBridgeEmail(baseUser.phoneNumber)).toBe("6281234567890@rekapdana.local");
  });

  it("rejects empty and duplicate upstream directories", () => {
    expect(() => parseApprovalSipUsers({ users: [] })).toThrow(ApprovalSipError);
    expect(() =>
      parseApprovalSipUsers({
        users: [
          baseUser,
          {
            ...baseUser,
            id: "user-2",
            phoneNumber: "6281234567890",
          },
        ],
      }),
    ).toThrow(ApprovalSipError);
  });
});
