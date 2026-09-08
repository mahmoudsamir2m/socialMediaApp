import { RoleEnum } from "../src/common/enums";
import { UnauthorizedException } from "../src/common/exceptions/applications.exceptions";
import { TokenService } from "../src/common/services/token.service";

describe("TokenService", () => {
  const service = new TokenService();
  const userPayload = { id: "user-1", role: RoleEnum.User };
  const adminPayload = { id: "admin-1", role: RoleEnum.Admin };

  it("generates and verifies a user access token", () => {
    const token = service.generateAccessToken(userPayload);

    expect(service.verifyAccessToken(token)).toEqual({
      ...userPayload,
      tokenVersion: 0,
    });
  });

  it("uses separate secrets for admin tokens", () => {
    const token = service.generateAccessToken(adminPayload);

    expect(service.verifyAccessToken(token)).toEqual({
      ...adminPayload,
      tokenVersion: 0,
    });
  });

  it("generates and verifies a refresh token pair", () => {
    const pair = service.generateTokenPair({
      ...userPayload,
      tokenVersion: 3,
    });

    expect(service.verifyRefreshToken(pair.refreshToken)).toEqual({
      ...userPayload,
      tokenVersion: 3,
    });
  });

  it("rejects a malformed token", () => {
    expect(() => service.verifyAccessToken("invalid-token")).toThrow(
      UnauthorizedException,
    );
  });
});
