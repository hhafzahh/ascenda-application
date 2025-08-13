// flow1.cy.js
describe("Flow 1: Guest user selects room and gets login alert", () => {
  it("should search from landing, filter hotels, select a room, and get login alert", () => {
    // Start from landing page
    cy.visit("/");

    // Enter destination
    cy.get('input[placeholder="Select location"]').type("Singapore");

    // Click Search Hotels button
    cy.get("button").contains("Search Hotels").click();

    // Wait for URL change to /results
    cy.url({ timeout: 15000 }).should("include", "/results");

    // Wait for hotel cards to appear
    cy.get("[data-testid='hotel-card']", { timeout: 20000 }).should(
      "have.length.greaterThan",
      0
    );

    // Confirm 'Room Facilities' filter exists
    cy.contains("Room Facilities").should("exist");

    // Apply first 3 amenities
    cy.get('input[type="checkbox"]').each(($el, index) => {
      if (index < 3) {
        cy.wrap($el).check({ force: true });
      }
    });

    cy.wait(500); // let filter apply

    // Assert hotels still exist after filtering
    cy.get("[data-testid='hotel-card']")
      .should("exist")
      .and("have.length.greaterThan", 0);

    // Click the first hotel card
    cy.get("[data-testid='hotel-card']").first().click();

    // Wait for HotelDetails page URL
    cy.url({ timeout: 15000 }).should("include", "/hotel/");

    // Wait for hotel rooms API to finish
    cy.intercept("/api/hotelproxy/rooms*").as("getRooms");
    cy.wait("@getRooms", { timeout: 15000 });

    // Scroll to the rooms container
    cy.get('[data-testid="hotel-rooms-container"]').scrollIntoView({
      duration: 1000,
    });

    // Wait for at least one room card to appear
    cy.get('[data-testid^="hotel-room-card-"]', { timeout: 10000 }).should(
      "exist"
    );

    // Click select room on the first room
    cy.get('[data-testid^="hotel-room-card-"]')
      .first()
      .find("[data-testid='select-room']")
      .click();

    // Assert that login alert appears
    cy.on("window:alert", (alertText) => {
      expect(alertText).to.include("Please log in");
    });
  });
});
