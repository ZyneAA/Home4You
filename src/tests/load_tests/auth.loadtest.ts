import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 10, // virtual users
  duration: "10s", // test duration
};

const BASE_URL = "http://localhost:8000";

export default function () {
  // Example: Request without token
  let res1 = http.get(`${BASE_URL}/protected`);
  check(res1, {
    "No token returns 401": r => r.status === 401,
  });

  // Example: Request with invalid token
  let res2 = http.get(`${BASE_URL}/protected`, {
    headers: { Cookie: "jwt=invalidtoken" },
  });
  check(res2, {
    "Invalid token returns 500": r => r.status === 500 || r.status === 401,
  });

  // Example: Request with valid token
  // Replace this with a token generated from your server
  const validToken = "your-valid-jwt";
  let res3 = http.get(`${BASE_URL}/protected`, {
    headers: { Cookie: `jwt=${validToken}` },
  });
  check(res3, {
    "Valid token returns 200": r => r.status === 200,
    "Response contains user": r => r.json("user") !== undefined,
  });
}
