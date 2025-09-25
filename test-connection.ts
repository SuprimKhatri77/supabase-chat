// test-connection.ts
import { config } from "dotenv";
import postgres from "postgres";

// Load environment variables from .env.local
config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set!");
  console.log(
    "Available env vars:",
    Object.keys(process.env).filter((key) => key.includes("DATABASE"))
  );
  process.exit(1);
}

console.log(
  "Testing connection to:",
  connectionString.replace(/:[^:@]+@/, ":****@")
);

const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: 1,
});

async function testConnection() {
  try {
    const result = await client`SELECT 1 as test`;
    console.log("✅ Database connection successful!", result);
    await client.end();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}

testConnection();
