import "reflect-metadata";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "crm",
  password: process.env.DB_PASSWORD || "crm_secret_2024",
  database: process.env.DB_NAME || "crm",
  synchronize: false,
  logging: process.env.NODE_ENV !== "production",
  entities: [],
});
