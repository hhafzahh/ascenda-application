describe("Login Page Tests", () => {
  beforeEach(() => {
    // Visit the login page
    cy.visit("/login");
  });

  it("should load the login page correctly", () => {
    // Check if the login form is present
    cy.get(".login-title").should("contain.text", "Log In");
    cy.get("input[name='email']").should("be.visible");
    cy.get("input[name='password']").should("be.visible");
    cy.get("button[type='submit']").should("contain.text", "Log In");
  });

  it("should show an error message for invalid credentials", () => {
    // Simulate entering invalid email and password
    cy.get("input[name='email']").type("invalidemail@example.com");
    cy.get("input[name='password']").type("wrongpassword");

    // Click the login button
    cy.get("button[type='submit']").click();

    // Wait for the error message and check its content
    cy.get(".error-message")
      .should("be.visible")
      .and("contain.text", "Login failed. Please try again later.");
  });

  it("should redirect to the registration page when the sign-up link is clicked", () => {
    // Click the register link
    cy.get(".login-link").click();

    // Check if it navigates to the registration page
    cy.url().should("include", "/register");
  });

  it("login user -> search -> select room -> book room", () => {
    // Intercept the login API call to mock successful login
    cy.intercept("POST", "http://localhost:3004/api/user/login", {
      statusCode: 200,
      body: {
        userId: "12345",
        token: "some_token",
      },
    }).as("loginRequest");

    // Simulate entering valid email and password
    cy.get("input[name='email']").type("yolo@gmail.com");
    cy.get("input[name='password']").type("password");

    // Click the login button
    cy.get("button[type='submit']").click();

    // Wait for the API request to complete
    cy.wait("@loginRequest");

    // Check if the success message is displayed
    cy.get(".success-message")
      .should("be.visible")
      .and("contain.text", "Login successful");

    // Ensure that the userId and token are stored in sessionStorage
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem("userId")).to.equal("12345");
      expect(win.sessionStorage.getItem("token")).to.equal("some_token");
    });

    // Ensure that the page redirects (if applicable)
    cy.url().should("include", "/");

    // Enter destination
    cy.get('input[placeholder="Select location"]').type("Singapore");

    // Click Search Hotels
    cy.get("button").contains("Search Hotels").click();

    // Wait for /results page
    cy.url({ timeout: 15000 }).should("include", "/results");

    // Wait for hotel cards to appear
    cy.get("[data-testid='hotel-card']", { timeout: 20000 }).should(
      "have.length.greaterThan",
      0
    );

    // Confirm Room Facilities filter exists
    cy.contains("Room Facilities").should("exist");

    // Apply first 3 amenities
    cy.get('input[type="checkbox"]').each(($el, index) => {
      if (index < 3) cy.wrap($el).check({ force: true });
    });

    cy.wait(500); // allow filter to apply

    // Assert hotels still exist
    cy.get("[data-testid='hotel-card']")
      .should("exist")
      .and("have.length.greaterThan", 0);

    // Click first hotel card
    cy.get("[data-testid='hotel-card']").first().click();

    // Click Select Room in HotelOverview
    cy.get("button").contains("Select Room").click();

    // Wait for rooms wrapper
    cy.get('[data-testid="hotel-rooms-wrapper"]', { timeout: 10000 }).should(
      "exist"
    );

    cy.get('[data-testid="hotel-rooms-wrapper-2"]', { timeout: 12000 }).should(
      "exist"
    );

    // Click select room on first room card
    cy.get('[data-testid="select-room"]')
      .should("have.length.greaterThan", 0) // ensure at least one button exists
      .first() // get the first one
      .click(); // click it

    //enter booking form details
    cy.get(".booking-form-card", { timeout: 10000 }).should("exist");

    // Personal Information
    cy.get("select#title").select("Mr");
    cy.get("input#firstName").type("yolo");
    cy.get("input#lastName").type("Doe");

    // Contact Details
    cy.get("input#email").type("yolo@gmail.com");
    cy.get("select.country-code").select("+65");
    cy.get("input#mobile").type("91234567");

    // Booking Details
    cy.get("input[type='checkbox']").check({ force: true }); // booking for someone else
    cy.get("textarea#specialRequests").type("Need extra pillows, please.");

    // --- Submit Booking Form ---
    cy.get("button[type='submit']")
      .should("contain.text", "Continue to Payment")
      .click();

    // --- Verify Navigation to Payment Page ---
    cy.url({ timeout: 10000 }).should("include", "/payment");

    //emter payment form details

    // Cardholder Name
    cy.get('input[placeholder="Name as it appears on card"]').type("Yolo Doe");
    cy.getStripeElement("cardNumber").type("4242424242424242");
    cy.getStripeElement("cardExpiry").type("12/34");
    cy.getStripeElement("cardCvc").type("123");

    // Submit Payment
    cy.get('button[type="submit"]').contains("Pay Now").click();

    // Wait for confirmation and redirect
    cy.url({ timeout: 20000 }).should("include", "/my-bookings");

    // Ensure sessionStorage has booking info
    // cy.window().then((win) => {
    //   const bookingData = JSON.parse(win.sessionStorage.getItem("booking"));
    //   expect(bookingData).to.have.property("status", "confirmed");
    // });
  });
});
