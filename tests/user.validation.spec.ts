import {
  changePasswordSchema,
  getUsersSchema,
  updateProfileSchema,
} from "../src/modules/user/user.validation";

describe("user validation", () => {
  it("applies pagination defaults", () => {
    expect(getUsersSchema.query.parse({})).toEqual({ page: 1, limit: 10 });
  });

  it("rejects a page size above the maximum", () => {
    expect(getUsersSchema.query.safeParse({ limit: 51 }).success).toBe(false);
  });

  it("accepts a valid profile update", () => {
    expect(
      updateProfileSchema.body.safeParse({
        userName: "Updated User",
        profilePic: "https://example.com/profile.jpg",
      }).success,
    ).toBe(true);
  });

  it("rejects mismatched password confirmation", () => {
    expect(
      changePasswordSchema.body.safeParse({
        currentPassword: "old-password",
        newPassword: "new-password",
        confirmPassword: "different-password",
      }).success,
    ).toBe(false);
  });
});
