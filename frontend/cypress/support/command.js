Cypress.Commands.add("getStripeElement", (element) => {
  return cy
    .get(`iframe[name='${element}']`) // select iframe by name
    .its("0.contentDocument.body") // get iframe's body
    .find("input") // find input inside iframe
    .should("exist"); // make sure it exists
});
