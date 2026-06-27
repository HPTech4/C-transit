import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import env from "../config/env.js";
import logger from "../config/logger.js";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

// What the controller receives after a successful login.
// Password hash is stripped inside this service — never leaves here.
export interface AgentLoginResult {
  token: string;
  agent: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    status: string;
  };
}

// ─────────────────────────────────────────────
// loginAgent
//
// Verifies agent credentials and issues a signed JWT.
//
// Timing note: we always run bcrypt.compare even when
// the agent row is not found (dummy compare against a
// static hash). This prevents email enumeration via
// response-time differences — an attacker cannot tell
// whether the email exists or the password was wrong.
//
// Status errors (SUSPENDED / DEACTIVATED) are surfaced
// only after the password is confirmed correct, so a
// legitimate agent gets a clear reason they're blocked.
// ─────────────────────────────────────────────

// Pre-computed hash used in the dummy compare path.
// bcrypt.compare is constant-time regardless of match,
// but calling it at all is what prevents timing leaks.
const DUMMY_HASH =
  "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345";

async function loginAgent(
  email: string,
  password: string
): Promise<AgentLoginResult> {
  const normalisedEmail = email.toLowerCase().trim();

  const agent = await prisma.agent.findUnique({
    where: { email: normalisedEmail },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      phone: true,
      password: true,
      status: true,
    },
  });

  // Always run bcrypt — prevents timing-based email enumeration
  const passwordMatch = await bcrypt.compare(
    password,
    agent?.password ?? DUMMY_HASH
  );

  if (!agent || !passwordMatch) {
    logger.warn({ email: normalisedEmail }, "agent.login_invalid_credentials");
    throw new Error("INVALID_CREDENTIALS");
  }

  // Status check is after credential verification — the agent
  // deserves a clear reason for the block, not a generic error
  if (agent.status !== "ACTIVE") {
    logger.warn(
      { agentId: agent.id, status: agent.status },
      "agent.login_blocked_by_status"
    );
    throw new Error(
      agent.status === "SUSPENDED" ? "AGENT_SUSPENDED" : "AGENT_DEACTIVATED"
    );
  }

  // Token expiry for agents — matches the session duration expected for
  // internal staff. Adjust here if agent sessions need a different window
  // to the student token expiry defined in the main auth service.
  const AGENT_TOKEN_EXPIRY = "8h";

  const token = jwt.sign(
    { userId: agent.id, role: "AGENT", email: agent.email },
    env.jwt.secret,
    { expiresIn: AGENT_TOKEN_EXPIRY }
  );

  logger.info({ agentId: agent.id }, "agent.login_success");

  // Build return object explicitly from the select fields — avoids a
  // destructure-to-discard pattern that triggers no-unused-vars on the
  // stripped password variable
  return {
    token,
    agent: {
      id: agent.id,
      firstname: agent.firstname,
      lastname: agent.lastname,
      email: agent.email,
      phone: agent.phone,
      status: agent.status,
    },
  };
}

export { loginAgent };
