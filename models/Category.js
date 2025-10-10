import mongoose, { Schema, models, model } from "mongoose";


const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    parent: { type: mongoose.Types.ObjectId, ref: "Category" },
    properties: [{ type: Object }],
     images: [
      {
        full: { type: String, required: true },
        thumb: { type: String, required: true },
      },
    ],
    slug: { type: String },
  },
  { timestamps: true }
);

export const Category =
  models?.Category || model("Category", CategorySchema);
