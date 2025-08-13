describe("Recently Viewed Hotels - Guest User Flow", () => {
  const searchQuery = "Singapore";

  beforeEach(() => {
    // Clear sessionStorage/localStorage before each test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("should show recently viewed hotels after visiting a hotel page and returning", () => {
    cy.visit("/");

    cy.get('input[placeholder="Select location"]').type("Singapore");

    cy.get("button").contains("Search Hotels").click();

    cy.url({ timeout: 15000 }).should("include", "/results");

    // Wait for hotel cards to appear
    cy.get("[data-testid='hotel-card']", { timeout: 20000 }).should(
      "have.length.greaterThan",
      0
    );
    cy.wait(4000);

    cy.get("[data-testid='hotel-card']").first().as("firstHotel");

    // Wait for .hotel-name to appear inside the first hotel
    cy.get("@firstHotel")
      .find("[data-testid='hotel-name']")
      .invoke("text")
      .as("hotelName");

    // Now click safely
    cy.get("@firstHotel").click();

    cy.wait(4000);

    // Verify navigation to hotel details page
    cy.url().should("include", "/hotels/");

    cy.visit("/");

    //scroll down
    cy.get("[data-testid='recently-viewed-title']")
      .contains("Recently Viewed Hotels for You")
      .scrollIntoView();

    cy.get("[data-testid='recently-viewed-hotels']", { timeout: 15000 }).should(
      "exist"
    );

    // Check recently viewed hotels
    cy.get("@hotelName").then((name) => {
      cy.get("[data-testid='recently-viewed-hotels']")
        .find("[data-testid='hotel-card']")
        .first()
        .find("[data-testid='hotel-name']")
        .should("contain.text", name);
    });
  });
});
