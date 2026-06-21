import "reflect-metadata";
import { DataSource } from "typeorm";
import { ENV } from "./config/env.js";
import { User } from "./entities/User.js";
import { Product } from "./entities/Product.js";
import { Address } from "./entities/Address.js";
import { Cart } from "./entities/Cart.js";
import { CartItem } from "./entities/CartItem.js";
import { WishlistItem } from "./entities/WishlistItem.js";
import { Order } from "./entities/Order.js";
import { OrderItem } from "./entities/OrderItem.js";
import { SiteSettings } from "./entities/SiteSettings.js";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: ENV.db.host,
  port: ENV.db.port,
  username: ENV.db.user,
  password: ENV.db.password,
  database: ENV.db.name,
  synchronize: true,
  logging: ENV.nodeEnv === "development" ? ["error", "warn"] : ["error"],
  entities: [User, Product, Address, Cart, CartItem, WishlistItem, Order, OrderItem, SiteSettings],
});
