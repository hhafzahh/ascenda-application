//flow5, register validation, register -> login -> then go my bookings then go profile -> logout
//error flow, access profile without logining in

/// <reference types="cypress" />

const API = "http://localhost:3004";

// Reuse the same test account each run.
// If it already exists, we'll just log in. If not, we'll create it once (via API).
const TEST_USER = {
  email: "e2e.flow5.user@example.com",
  password: "Flow5StrongPass!23",
  name: "Flow5 User",
  dateOfBirth: "1990-01-01",
};

let createdUserId = null;
let authToken = null;

function ensureUserExists() {
  // Try real login first
  return cy
    .request({
      method: "POST",
      url: `http://localhost:3004/api/user/login`,
      body: { email: TEST_USER.email, password: TEST_USER.password },
      failOnStatusCode: false,
    })
    .then((res) => {
      if (res.status === 200 && res.body?.userId && res.body?.token) {
        createdUserId = res.body.userId;
        authToken = res.body.token;
        return; // user already exists
      }
      // Create once if login failed
      return cy
        .request({
          method: "POST",
          url: `http://localhost:3004/api/user/register`,
          body: {
            username: TEST_USER.name,
            email: TEST_USER.email,
            password: TEST_USER.password,
          },
          failOnStatusCode: false,
        })
        .then((reg) => {
          // Get a fresh token via login
          return cy.request("POST", `http://localhost:3004/api/user/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password,
          });
        })
        .then((login) => {
          createdUserId = login.body.userId;
          authToken = login.body.token;
        });
    });
}

describe("Flow5 with real login+delete and mocked registration", () => {
  before(() => {
    // Ensure our test user exists ONCE (real API),
    // so later we can perform a REAL login.
    ensureUserExists();
  });

  //check protected route
  //visit /profile
  //should redirect back to '/login'
  it("Protected route: /profile redirects to /login when not logged in", () => {
    cy.visit("/profile", {
      onBeforeLoad(win) {
        win.sessionStorage.clear();
      },
    });
    cy.location("pathname").should("eq", "/login");
  });

  //visit /login
  //click signup link
  //create new credenetials (mock) & register
  //to prevent spamming the backend if we register
  it("UI registration step is mocked (no real API call) → success → redirect to /login", () => {
    cy.visit("/login");
    cy.get(".login-link").click();
    cy.url().should("include", "/register");

    // Basic validation checks to assert the UI behaves
    cy.get("form").submit();
    cy.contains("Full name is required").should("be.visible");
    cy.contains("Please enter a valid email").should("be.visible");
    cy.contains("Password must be at least 6 characters").should("be.visible");

    // MOCK ONLY the register endpoint for the UI flow
    cy.intercept("POST", `${API}/api/user/register`, {
      statusCode: 201,
      body: { id: "mocked_only_for_ui" },
    }).as("registerMock");

    // Fill the form with our known test user //mocked
    cy.get("#fullName").clear().type(TEST_USER.name);
    cy.get("#email").clear().type(TEST_USER.email);
    cy.get("#password").clear().type(TEST_USER.password);

    cy.get('button[type="submit"]').click();
    cy.wait("@registerMock");

    cy.contains("Registration successful", { matchCase: false }).should(
      "be.visible"
    );

    // Skip the component's 2s redirect delay
    cy.clock();
    cy.tick(2000);
    cy.location("pathname").should("eq", "/login");
  });

  //login with that account
  //go to profile check the email is the same as the one login
  // delete account
  it("Real login → My Bookings → Profile (email matches) → real delete → logout", () => {
    cy.visit("/login");

    // REAL login (no intercept)
    cy.get('input[name="email"]').clear().type(TEST_USER.email);
    cy.get('input[name="password"]').clear().type(TEST_USER.password);
    cy.get('button[type="submit"]').click();

    cy.contains("Login successful", { matchCase: false }).should("be.visible");

    // Skip 2s redirect delay
    cy.clock();
    cy.tick(2000);
    cy.location("pathname").should("eq", "/");

    // Go to My Bookings
    cy.get('[data-testid="nav-bookings"], a, button')
      .contains(/my bookings/i)
      .click({ force: true });
    cy.location("pathname").should("include", "/my-bookings");

    // Go to Profile
    cy.get('[data-testid="nav-profile"], a, button')
      .contains(/profile/i)
      .click({ force: true });
    cy.location("pathname").should("include", "/profile");

    cy.get('[data-testid="profile-container"]').should("be.visible");

    cy.get('[data-testid="profile-email"]')
      .should("be.disabled")
      .should("have.value", TEST_USER.email);

    cy.wait(1200);

    cy.on("window:confirm", (text) => {
      expect(text).to.match(/delete your account/i);
      return true; // click "OK"
    });

    cy.get("a.delete-link").click();

    // delete acc - back to '/'
    cy.location("pathname", { timeout: 10000 }).should("eq", "/");

    // check if session storage is cleared
    cy.window().then((w) => {
      expect(w.sessionStorage.getItem("userId") || "").to.eq("");
      expect(w.sessionStorage.getItem("token") || "").to.eq("");
    });

    // Visiting /profile again should now redirect to /login (protected route check)
    cy.visit("/profile");
    cy.location("pathname").should("eq", "/login");
  });
});
