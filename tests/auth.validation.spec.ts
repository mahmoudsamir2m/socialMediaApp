import {
  loginSchema,
  signupSchema,
} from "../src/modules/auth/auth.validation";

describe("auth validation", () => {
  it("accepts a valid signup payload", () => {
    const result = signupSchema.body.safeParse({
      userName: "Test User",
      email: "test@example.com",
      phone: "01012345678",
      password: "secret123",
      confirmPassword: "secret123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects signup when passwords do not match", () => {
    const result = signupSchema.body.safeParse({
      userName: "Test User",
      email: "test@example.com",
      phone: "01012345678",
      password: "secret123",
      confirmPassword: "different123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects login when the email is invalid", () => {
    const result = loginSchema.body.safeParse({
      email: "not-an-email",
      password: "secret123",
    });

    expect(result.success).toBe(false);
  });
});
