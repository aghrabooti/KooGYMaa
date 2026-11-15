import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { accountCreationError, accountSearchWhere } from "@/lib/accounts";

describe("account management", () => {
  it("explains the legacy email requirement without returning a server error", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Null constraint violation on the fields: (`email`)", {
      code: "P2011",
      clientVersion: "test",
      meta: { modelName: "User" },
    });
    const response = accountCreationError(error);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("ایمیل برای ساخت حساب لازم است");
  });

  it("matches account identifiers in their stored lowercase form", () => {
    expect(accountSearchWhere("Vahid.Kashani").OR).toEqual([
      { name: { contains: "Vahid.Kashani" } },
      { username: { contains: "vahid.kashani" } },
      { email: { contains: "vahid.kashani" } },
    ]);
  });
});
