import { test } from "node:test";
import assert from "node:assert/strict";
import { User } from "./models.js";
import { teacherOnly } from "./auth.js";

// teacherOnly must trust the DB role, never the role claimed in the token.
async function check(dbRole, tokenRole) {
  User.findById = () => ({ lean: async () => (dbRole ? { role: dbRole } : null) });
  let status = 200;
  const res = { status: (s) => ((status = s), { json: () => {} }) };
  await teacherOnly({ user: { sub: "x", role: tokenRole } }, res, () => {});
  return status;
}

test("student with a forged teacher token is rejected", async () => assert.equal(await check("student", "teacher"), 403));
test("approved teacher with an old student token is allowed", async () => assert.equal(await check("teacher", "student"), 200));
test("deleted account is rejected", async () => assert.equal(await check(null, "teacher"), 403));
