import "dotenv/config";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const TEST_EMAIL = `person2-${String(Date.now())}@example.com`;
const TEST_PASSWORD = "Password123!";
const TEST_DISPLAY_NAME = "Person Two";

let cookieHeader = "";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logPass(message: string): void {
  console.log(`PASS: ${message}`);
}

function logInfo(message: string): void {
  console.log(`INFO: ${message}`);
}

function updateCookieHeader(response: Response): void {
  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) {
    return;
  }

  const firstCookie = setCookie.split(",")[0];

  if (!firstCookie) {
    return;
  }

  const sessionCookie = firstCookie.split(";")[0];

  if (sessionCookie) {
    cookieHeader = sessionCookie;
  }
}

async function parseJson(response: Response): Promise<JsonObject> {
  const text = await response.text();

  assert(text, "Expected JSON response body, but body was empty.");

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON response body, but got: ${text}`);
  }

  assert(
    parsed !== null && typeof parsed === "object" && !Array.isArray(parsed),
    "Expected JSON object response.",
  );

  return parsed as JsonObject;
}

async function requestJson(
  path: string,
  options: {
    method?: string;
    body?: JsonObject;
    useCookie?: boolean;
  } = {},
): Promise<{ response: Response; json: JsonObject }> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (options.useCookie && cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    redirect: "manual",
  });

  updateCookieHeader(response);

  const json = await parseJson(response);

  return { response, json };
}

async function checkUnauthenticatedMe(): Promise<void> {
  const { response, json } = await requestJson("/auth/me");

  assert(
    response.status === 401,
    `Expected GET /auth/me before login to return 401, got ${String(response.status)}.`,
  );
  assert(
    json.error === "Not authenticated.",
    'Expected error message "Not authenticated." before login.',
  );

  logPass("Unauthenticated GET /auth/me is rejected.");
}

async function checkRegister(): Promise<void> {
  const { response, json } = await requestJson("/auth/register", {
    method: "POST",
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      display_name: TEST_DISPLAY_NAME,
    },
  });

  assert(
    response.status === 201,
    `Expected POST /auth/register to return 201, got ${String(response.status)}.`,
  );
  assert(json.message === "Registration successful.", "Expected registration success message.");
  assert(
    typeof json.user === "object" && json.user !== null,
    "Expected registered user in response.",
  );
  assert(cookieHeader.length > 0, "Expected session cookie after registration.");

  const user = json.user as JsonObject;
  assert(user.email === TEST_EMAIL, "Expected registered user email to match.");
  assert(user.display_name === TEST_DISPLAY_NAME, "Expected registered display_name to match.");

  logPass("Registration succeeds and creates a session.");
}

async function checkDuplicateRegister(): Promise<void> {
  const { response, json } = await requestJson("/auth/register", {
    method: "POST",
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      display_name: TEST_DISPLAY_NAME,
    },
  });

  assert(
    response.status === 400,
    `Expected duplicate POST /auth/register to return 400, got ${String(response.status)}.`,
  );
  assert(
    json.error === "An account with that email already exists.",
    "Expected duplicate email error message.",
  );

  logPass("Duplicate registration is rejected.");
}

async function checkAuthenticatedMeAfterRegister(): Promise<void> {
  const { response, json } = await requestJson("/auth/me", {
    useCookie: true,
  });

  assert(
    response.status === 200,
    `Expected authenticated GET /auth/me to return 200, got ${String(response.status)}.`,
  );
  assert(
    typeof json.user === "object" && json.user !== null,
    "Expected authenticated user in /auth/me response.",
  );

  const user = json.user as JsonObject;
  assert(user.email === TEST_EMAIL, "Expected /auth/me user email to match registered email.");
  assert(
    user.display_name === TEST_DISPLAY_NAME,
    "Expected /auth/me display_name to match registered user.",
  );

  logPass("Authenticated GET /auth/me returns session user.");
}

async function checkLogin(): Promise<void> {
  const { response, json } = await requestJson("/auth/login", {
    method: "POST",
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });

  assert(
    response.status === 200,
    `Expected POST /auth/login to return 200, got ${String(response.status)}.`,
  );
  assert(json.message === "Login successful.", "Expected login success message.");
  assert(
    typeof json.user === "object" && json.user !== null,
    "Expected logged-in user in response.",
  );
  assert(cookieHeader.length > 0, "Expected session cookie after login.");

  const user = json.user as JsonObject;
  assert(user.email === TEST_EMAIL, "Expected logged-in user email to match.");
  assert(user.display_name === TEST_DISPLAY_NAME, "Expected logged-in display_name to match.");

  logPass("Login succeeds with valid credentials.");
}

async function checkInvalidLogin(): Promise<void> {
  const { response, json } = await requestJson("/auth/login", {
    method: "POST",
    body: {
      email: TEST_EMAIL,
      password: "WrongPassword123!",
    },
  });

  assert(
    response.status === 401,
    `Expected invalid POST /auth/login to return 401, got ${String(response.status)}.`,
  );
  assert(
    json.error === "Invalid email or password.",
    "Expected invalid credentials error message.",
  );

  logPass("Login fails with invalid credentials.");
}

async function checkAuthenticatedMeAfterLogin(): Promise<void> {
  const { response, json } = await requestJson("/auth/me", {
    useCookie: true,
  });

  assert(
    response.status === 200,
    `Expected authenticated GET /auth/me after login to return 200, got ${String(response.status)}.`,
  );
  assert(
    typeof json.user === "object" && json.user !== null,
    "Expected authenticated user after login.",
  );

  logPass("Session persists after login.");
}

async function checkLogout(): Promise<void> {
  const { response, json } = await requestJson("/auth/logout", {
    method: "POST",
    useCookie: true,
  });

  assert(
    response.status === 200,
    `Expected POST /auth/logout to return 200, got ${String(response.status)}.`,
  );
  assert(json.message === "Logout successful.", "Expected logout success message.");

  logPass("Logout succeeds.");
}

async function checkMeAfterLogout(): Promise<void> {
  const { response, json } = await requestJson("/auth/me", {
    useCookie: true,
  });

  assert(
    response.status === 401,
    `Expected GET /auth/me after logout to return 401, got ${String(response.status)}.`,
  );
  assert(json.error === "Not authenticated.", 'Expected "Not authenticated." after logout.');

  logPass("Session is cleared after logout.");
}

async function main(): Promise<void> {
  logInfo(`Testing auth flow against ${BASE_URL}`);

  cookieHeader = "";
  await checkUnauthenticatedMe();
  await checkRegister();
  await checkDuplicateRegister();
  await checkAuthenticatedMeAfterRegister();

  cookieHeader = "";
  await checkLogin();
  await checkInvalidLogin();
  await checkAuthenticatedMeAfterLogin();
  await checkLogout();
  await checkMeAfterLogout();

  console.log("");
  console.log("Auth checks completed successfully.");
}

main().catch((error: unknown) => {
  console.error("");
  console.error("Auth checks failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});
