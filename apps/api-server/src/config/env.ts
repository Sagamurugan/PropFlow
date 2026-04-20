export const envConfig = () => ({
  app: {
    name: "propflow-api",
    port: parseInt(process.env.PORT ?? "3001", 10),
    jwtSecret: process.env.JWT_SECRET ?? "change-me"
  },
  database: {
    url: process.env.DATABASE_URL
  },
  redis: {
    url: process.env.REDIS_URL
  }
});
