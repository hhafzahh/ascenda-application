import "./command.js";
// cypress/support/e2e.js

// Custom command to type into Stripe iframe fields
Cypress.Commands.add("getStripeElement", (testId) => {
  return cy
    .get(`[data-testid='${testId}'] iframe`, { timeout: 10000 })
    .should("exist")
    .then(($iframe) => {
      const body = $iframe.contents().find("body");
      return cy
        .wrap(body)
        .find("input:visible") // <-- select only visible input
        .should("exist");
    });
});
