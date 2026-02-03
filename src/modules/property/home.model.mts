import { model, Schema } from "mongoose";
import type { InferSchemaType } from "mongoose";

import { CurrencyType } from "./types/currencyType.type.mjs";
import type { IProperty } from "./types/property.types.mjs";
import { PropertyCatagory } from "./types/propertyCatagory.type.mjs";

const PropertySchema = new Schema<IProperty>(
  {
    listedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: { type: String, default: "" },

    price: { type: Number, required: true },
    currency: { type: CurrencyType, default: CurrencyType.KYAT },
    transactionType: {
      type: String,
      required: true,
    },

    locationReadable: { type: String, required: true },
    locationCoordinates: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    city: { type: String, default: "" },
    country: { type: String, default: "" },

    bedrooms: { type: Number, default: "" },
    bathrooms: { type: Number, default: "" },
    numOfFloors: { type: Number, default: "" },
    areaSqFt: { type: Number, default: "" },

    category: { type: PropertyCatagory, default: PropertyCatagory.HOUSE },

    photos: { type: [String] },
    amenities: { type: [String] },

    builtYear: { type: Number },
    furnished: { type: Number },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    toJSON: {
      transform(_doc, ret) {
        return ret;
      },
    },
  },
);

PropertySchema.index({ locationCoordinates: "2dsphere" });

export type CreatedHome = InferSchemaType<typeof PropertySchema>;
export const Home = model("Home", PropertySchema);
