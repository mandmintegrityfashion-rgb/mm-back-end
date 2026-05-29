import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import Product from "../models/Product.js";

function createObjectId() {
  return new mongoose.Types.ObjectId();
}

function buildProduct(overrides = {}) {
  return {
    name: "Classic Tee",
    description: "Everyday cotton tee",
    costPrice: 5000,
    salePriceIncTax: 7500,
    taxRate: 7.5,
    quantity: 12,
    minStock: 2,
    maxStock: 20,
    images: [
      {
        full: "https://example.com/images/classic-tee.webp",
        thumb: "https://example.com/images/classic-tee-thumb.webp",
      },
    ],
    ...overrides,
  };
}

function buildOrderItem(overrides = {}) {
  return {
    productId: createObjectId(),
    name: "Classic Tee",
    price: 7500,
    quantity: 2,
    category: "Tees",
    description: "Everyday cotton tee",
    images: ["https://example.com/images/classic-tee.webp"],
    ...overrides,
  };
}

function buildOrder(overrides = {}) {
  return {
    customer: createObjectId(),
    shippingDetails: {
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "08000000000",
      address: "12 Broad Street",
      city: "Lagos",
    },
    items: [buildOrderItem()],
    subtotal: 15000,
    shippingCost: 1500,
    total: 16500,
    ...overrides,
  };
}

test("Product accepts a valid inventory payload", () => {
  const error = new Product(buildProduct()).validateSync();

  assert.equal(error, undefined);
});

test("Product rejects negative inventory quantities", () => {
  const error = new Product(buildProduct({ quantity: -1 })).validateSync();

  assert.ok(error);
  assert.equal(error.errors.quantity.kind, "min");
});

test("Product image entries require full and thumb URLs", () => {
  const error = new Product(
    buildProduct({
      images: [{ full: "https://example.com/images/classic-tee.webp" }],
    })
  ).validateSync();

  assert.ok(error);
  assert.equal(error.errors["images.0.thumb"].kind, "required");
});

test("Order rejects line items with non-positive quantities", () => {
  const error = new Order(
    buildOrder({
      items: [buildOrderItem({ quantity: 0 })],
    })
  ).validateSync();

  assert.ok(error);
  assert.equal(error.errors["items.0.quantity"].kind, "min");
});

test("Order rejects invalid payment status values", () => {
  const error = new Order(
    buildOrder({
      paymentStatus: "Settled",
    })
  ).validateSync();

  assert.ok(error);
  assert.equal(error.errors.paymentStatus.kind, "enum");
});