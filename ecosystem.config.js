module.exports = {
  apps: [
    {
      name: "ufriends-app",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 5070,
      },
      instances: 1,
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
