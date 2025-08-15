// flow1.cy.js
describe("Multiple Filtering flow and Sorting", () => {
  it("should filter hotels and sort the hotels and select hotel", () => {
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

    // === Apply Room Facilities Filter ===
    cy.contains("Room Facilities").should("exist");
    cy.get('input[type="checkbox"]').each(($el, index) => {
      if (index < 3) cy.wrap($el).check({ force: true });
    });

    cy.wait(500); // allow filter to apply

    // === Apply Rating Filter ===
    cy.contains("Property Rating")
      .parent() // or closest container wrapping the checkboxes
      .find('input[type="checkbox"]')
      .eq(2) // 3rd checkbox inside this section
      .check({ force: true });

    cy.wait(500); // allow rating filter to apply

    // === Apply Sort Control ===
    cy.contains("Sort by").should("exist"); // optional check
    cy.contains("High to Low Price").click();

    cy.wait(500); // allow sorting to apply

    // === Verify hotel cards after filters and sort ===
    cy.get("[data-testid='hotel-card']").each(($card) => {
      cy.wrap($card).within(() => {
        cy.get("[data-testid='hotel-price']").should("exist");
        cy.get("[data-testid='hotel-rating']").should(($rating) => {
          // Verify it contains at least one full star for 3+
          const stars = $rating.text();
          expect(stars.split("★").length - 1).to.be.gte(3);
        });
      });
    });

    // === Select first hotel card ===
    cy.get("[data-testid='hotel-card']").first().click();

    // Verify navigation to hotel details page
    cy.url().should("include", "/hotels/");
  });
});
