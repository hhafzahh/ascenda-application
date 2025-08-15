//guest -> seach -> searchresults -> open map -> select hotel card ->
// flow6.cy.js
describe("Guest user searches and open map preview", () => {
  it("searches, expand map preview, clicks the hotel card in full map modal, navigated to /hotel/", () => {
    // Visit landing page
    cy.visit("/");

    // Enter destination
    cy.get('input[placeholder="Select location"]').type("Dubai");

    // Click Search Hotels
    cy.get("button").contains("Search Hotels").click();

    // Wait for /results page
    cy.url({ timeout: 15000 }).should("include", "/results");

    // Wait for hotel cards to appear
    cy.get("[data-testid='hotel-card']", { timeout: 20000 }).should(
      "have.length.greaterThan",
      0
    );

    // === Apply Rating Filter ===
    cy.contains("Property Rating")
      .parent()
      .find('input[type="checkbox"]')
      .eq(0) // 1st checkbox -> 5 star rating
      .check({ force: true });

    cy.wait(1000); // allow rating filter to apply

    cy.get("[data-testid='map-preview']").should("exist"); //check if map-preview can be seen
    //open map modal
    cy.get("[data-testid='expand-button'] ").click();

    // Wait for the full map modal to appear
    cy.get("[data-testid='map-hotel-cards']").should("exist");

    cy.wait(2000);

    // Click the first hotel marker in the modal
    cy.get("[data-testid='map-hotel-cards']").first().click();
    cy.window().then((win) => {
      //scroll to top
      win.scrollTo(0, 0);
    });

    cy.wait(2000);

    //should navigate /hotel
    cy.url().should("include", "/hotels/");
  });
});
