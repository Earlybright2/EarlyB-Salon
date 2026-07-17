import { relations } from "drizzle-orm";
import { users, stylists, salons, services, appointments, reviews, products, cartItems, wishlistItems, orders, orderItems, notifications } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
  reviews: many(reviews),
  cartItems: many(cartItems),
  wishlistItems: many(wishlistItems),
  orders: many(orders),
  notifications: many(notifications),
}));

export const stylistsRelations = relations(stylists, ({ one, many }) => ({
  user: one(users, { fields: [stylists.userId], references: [users.id] }),
  services: many(services),
  appointments: many(appointments),
}));

export const salonsRelations = relations(salons, ({ many }) => ({
  stylists: many(stylists),
  services: many(services),
  appointments: many(appointments),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  salon: one(salons, { fields: [services.salonId], references: [salons.id] }),
  stylist: one(stylists, { fields: [services.stylistId], references: [stylists.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  user: one(users, { fields: [appointments.userId], references: [users.id] }),
  stylist: one(stylists, { fields: [appointments.stylistId], references: [stylists.id] }),
  salon: one(salons, { fields: [appointments.salonId], references: [salons.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  appointment: one(appointments, { fields: [reviews.appointmentId], references: [appointments.id] }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  wishlistItems: many(wishlistItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, { fields: [wishlistItems.userId], references: [users.id] }),
  product: one(products, { fields: [wishlistItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
