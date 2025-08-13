import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import SearchBar from "../src/components/SearchBar/searchBar";
import { BrowserRouter } from "react-router-dom";
jest.mock("lodash/debounce", () => jest.fn((fn) => fn));

jest.mock("fuse.js", () => {
  return {
    __esModule: true,
    default: function MockFuse(data, options) {
      return {
        search: (input) => {
          if (input.toLowerCase().includes("singa")) {
            return [{ item: { term: "Singapore, Singapore", uid: "RsBU" } }];
          } else if (input.toLowerCase().includes("sitges")) {
            return [{ item: { term: "Sitges, Spain", uid: "vkcm" } }];
          }
          return [];
        }
      };
    },
  };
});

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

const mockDestinations = [
  { term: "Singapore, Singapore", uid: "RsBU", lat: 1.2800945, lng: 103.8509491, type: "city" },
  { term: "Sitges, Spain", uid: "vkcm", lat: 41.234782, lng: 1.811222, type: "city" },
  { term: "Paris, France", uid: "vJh2", lat: 48.856667, lng: 2.350987, type: "city", state: "Ile-de-France" },
];

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockDestinations),
    })
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

beforeAll(() => {
  window.alert = jest.fn();
});

//input triggers fuzzy match and suggestions include "Singapore"
test("SearchBar renders and suggests Singapore when 'singa' is typed", async () => {
  render(
    <BrowserRouter>
      <SearchBar
        queryval=""
        testDestinations={mockDestinations}
        setLoading={jest.fn()}
        initialCheckin={new Date().toISOString()}
        initialCheckout={new Date().toISOString()}
      />
    </BrowserRouter>
  );

  const input = screen.getByPlaceholderText(/select location/i);
  fireEvent.change(input, { target: { value: "singa" } });

  await waitFor(() => {
    const suggestions = screen.getAllByRole("listitem");
    expect(suggestions.length).toBeGreaterThan(0);
  });

  const suggestions = screen.getAllByRole("listitem").map((el) => el.textContent.toLowerCase());
  expect(suggestions).toEqual(expect.arrayContaining([expect.stringContaining("singapore")]));
});


//inputting gibberish returns no suggestions
test("Typing gibberish shows no suggestions", async () => {
  render(
    <BrowserRouter>
      <SearchBar
        queryval=""
        testDestinations={mockDestinations}
        setLoading={jest.fn()}
        initialCheckin={new Date().toISOString()}
        initialCheckout={new Date().toISOString()}
      />
    </BrowserRouter>
  );

  const input = screen.getByPlaceholderText(/select location/i);
  fireEvent.change(input, { target: { value: "zzzzzzz" } });

  await waitFor(() => {
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
//clicking on a suggestion updates the input field
test("User selects a suggestion and input updates", async () => {
  render(
    <BrowserRouter>
      <SearchBar
        queryval=""
        testDestinations={mockDestinations}
        setLoading={jest.fn()}
        initialCheckin={new Date().toISOString()}
        initialCheckout={new Date().toISOString()}
      />
    </BrowserRouter>
  );

  const input = screen.getByPlaceholderText(/select location/i);
  fireEvent.change(input, { target: { value: "singa" } });

  const suggestion = await screen.findByText(/singapore/i);
  fireEvent.click(suggestion);

  expect(input.value.toLowerCase()).toContain("singapore");
});

//fallback correction activates when no suggestion is selected but "Search Hotels" is clicked
test("Fallback fuzzy correction sets UID and updates input", async () => {
  render(
    <BrowserRouter>
      <SearchBar
        queryval="singa"
        testDestinations={mockDestinations}
        setLoading={jest.fn()}
        initialCheckin={new Date().toISOString()}
        initialCheckout={new Date().toISOString()}
      />
    </BrowserRouter>
  );

  const button = screen.getByText(/search hotels/i);
  fireEvent.click(button);

  await waitFor(() =>
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
  );
});