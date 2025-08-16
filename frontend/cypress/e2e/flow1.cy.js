// flow1.cy.js
describe("Flow 1: Guest user selects room and gets login alert", () => {
  it("searches, filters hotels, selects a room, and triggers login alert", () => {
    // Visit landing page
    cy.visit("/");

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

    cy.get('[data-testid="hotel-rooms-wrapper-2"]', { timeout: 10000 }).should(
      "exist"
    );

    cy.wait(2000);

    // Click select room on first room card
    cy.get('[data-testid="select-room"]')
      .should("have.length.greaterThan", 0) // ensure at least one button exists
      .first() // get the first one
      .click(); // click it

    // Assert login alert
    cy.on("window:alert", (alertText) => {
      expect(alertText).to.include("Please log in to select a room.");
    });
  });
});
