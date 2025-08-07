// const request = require("supertest");
// const app = require("../app");

// //test for hotel search api
// describe("Hotel API", () => {
//     it("should return hotels for valid UID and query params", async () => {
//         const res = await request(app)
//             .get("/api/hotelproxy/hotels/uid/RsBU")
//             .query({ checkin: "2025-07-21", checkout: "2025-07-23", guests: "2|2" });

//         expect(res.statusCode).toBe(200);
//         expect(Array.isArray(res.body)).toBe(true);
//         if (res.body.length > 0) {
//             expect(res.body[0]).toHaveProperty("id");
//             expect(res.body[0]).toHaveProperty("name");
//             expect(res.body[0]).toHaveProperty("price");
//         }
//     }, 15000);

//     //invalid destination uid search
//     it("should return 200 and empty array for invalid UID", async () => {
//         const res = await request(app)
//             .get("/api/hotelproxy/hotels/uid/invaliduid123")
//             .query({ checkin: "2025-07-21", checkout: "2025-07-23", guests: "2|2" });

//         expect(res.statusCode).toBe(200);
//         expect(Array.isArray(res.body)).toBe(true);
//         expect(res.body.length).toBe(0);
//     }, 15000);

//     //missing params
//     it("should return 200 and array (possibly empty) if missing query parameters", async () => {
//         const res = await request(app)
//             .get("/api/hotelproxy/hotels/uid/RsBU"); // no query params

//         expect(res.statusCode).toBe(200);
//         expect(Array.isArray(res.body)).toBe(true);
//     }, 15000);

//     //invalid date
//     it("should return 200 and empty array for invalid date format", async () => {
//         const res = await request(app)
//             .get("/api/hotelproxy/hotels/uid/RsBU")
//             .query({ checkin: "invalid", checkout: "alsoInvalid", guests: "2|2" });

//         expect(res.statusCode).toBe(200);
//         expect(Array.isArray(res.body)).toBe(true);
//         expect(res.body.length).toBe(0);
//     }, 15000);

//     //check without guest param (should still run bcs default 1 set)
//     it("should return hotels even with guests omitted (if frontend auto-fills)", async () => {
//         const res = await request(app)
//             .get("/api/hotelproxy/hotels/uid/RsBU")
//             .query({ checkin: "2025-07-21", checkout: "2025-07-23" });

//         expect(res.statusCode).toBe(200);
//         expect(Array.isArray(res.body)).toBe(true);
//         if (res.body.length > 0) {
//             expect(res.body[0]).toHaveProperty("id");
//             expect(res.body[0]).toHaveProperty("name");
//             expect(res.body[0]).toHaveProperty("price");
//         }
//     }, 15000);
// });
