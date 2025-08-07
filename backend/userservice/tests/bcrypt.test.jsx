const bcrypt = require("bcrypt");

describe("Bcrypt password hashing", () => {
  const plainPassword = "MySecret123!";
  let hashedPassword;

  it("should hash a password", async () => {
    hashedPassword = await bcrypt.hash(plainPassword, 10);
    expect(hashedPassword).not.toBe(plainPassword);
    expect(hashedPassword.length).toBeGreaterThan(0);
  });

  it("should return true for correct password comparison", async () => {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    expect(isMatch).toBe(true);
  });

  it("should return false for incorrect password comparison", async () => {
    const isMatch = await bcrypt.compare("WrongPassword", hashedPassword);
    expect(isMatch).toBe(false);
  });
});