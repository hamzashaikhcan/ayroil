// PM2 process definitions for the ayroil stack (production).
// Backend reads its own .env via dotenv (cwd-relative, PORT=4400).
// Next apps are `output: "standalone"` builds — their server.js loads
// .env.local from cwd at runtime, same as `next start`. They bind to
// loopback only; nginx is the public entrypoint.
module.exports = {
  apps: [
    {
      name: "ayroil-backend",
      cwd: "/opt/ayroil/express-backend/current",
      script: "dist/server.js",
      env: { NODE_ENV: "production" },
      max_memory_restart: "400M",
      time: true,
    },
    {
      name: "ayroil-frontend",
      cwd: "/opt/ayroil/next-frontend/current",
      script: "server.js",
      env: { NODE_ENV: "production", PORT: "3400", HOSTNAME: "127.0.0.1" },
      max_memory_restart: "640M",
      time: true,
    },
    {
      name: "ayroil-admin",
      cwd: "/opt/ayroil/admin-panel/current",
      script: "server.js",
      env: { NODE_ENV: "production", PORT: "3401", HOSTNAME: "127.0.0.1" },
      max_memory_restart: "640M",
      time: true,
    },
  ],
};
