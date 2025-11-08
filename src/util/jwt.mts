import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5, // number of virtual users
  duration: "15s", // total duration of the test
};

const BASE_URL = "http://localhost:8000";

// Replace with valid login credentials
const LOGIN_PAYLOAD = JSON.stringify({
  email: "test@example.com",
  password: "password123",
});

const LOGIN_HEADERS = {
  "Content-Type": "application/json",
};

export default function (): void {
  //  Login to get JWT (not finish, write as my thought)
  const loginRes = http.post(`${BASE_URL}/auth/login`, LOGIN_PAYLOAD, {
    headers: LOGIN_HEADERS,
  });

  check(loginRes, {
    "Login successful": r => r.status === 200 && r.json("token") !== undefined,
  });

  const token = loginRes.json("token"); // assuming your login returns { token: "<JWT>" }

  if (!token) {
    return;
  }

  //  Request without token
  const resNoToken = http.get(`${BASE_URL}/protected`);
  check(resNoToken, { "No token returns 401": r => r.status === 401 });

  //  Request with invalid token
  const resInvalidToken = http.get(`${BASE_URL}/protected`, {
    headers: { Cookie: "jwt=invalidtoken" },
  });
  check(resInvalidToken, {
    "Invalid token returns 401 or 500": r =>
      r.status === 401 || r.status === 500,
  });

  //  Request with valid token
  const resValidToken = http.get(`${BASE_URL}/protected`, {
    headers: { Cookie: `jwt=${token}` },
  });
  check(resValidToken, {
    "Valid token returns 200": r => r.status === 200,
    "Response contains user": r => r.json("user") !== undefined,
  });

  sleep(1); // pause between iterations
}
