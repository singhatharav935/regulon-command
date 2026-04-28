module.exports = {
  apps: [
    {
      name: "regulon-agent",
      script: "./index.js",
      cwd: ".",
      instances: 1,
      autorestart: true,
      watch: false,
      env_file: ".env.agent",
      max_memory_restart: "400M",
      min_uptime: "10s",
      max_restarts: 20,
      exp_backoff_restart_delay: 200,
      merge_logs: true,
      out_file: "./logs/regulon-agent.out.log",
      error_file: "./logs/regulon-agent.err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      env: {
        NODE_ENV: "production",
        ALERT_AGENT_PORT: "8787",
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  ],
};
