import { model, Schema } from "mongoose";
import type { InferSchemaType } from "mongoose";

const HomeSchema = new Schema(
  {
    price: { type: String, required: true, trim: true },

    location: { type: String, required: true, trim: true },

    city: { type: String, required: true, trim: true, index: true },

    coord: {
      type: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      required: true,
      _id: false,
    },

    // Sale type: 'sale' or 'rent'
    type: {
      type: String,
      required: true,
      enum: ["sale", "rent"],
      trim: true,
      index: true,
    },

    photo_urls: {
      type: [String],
      default: [],
    },

    area: { type: String, trim: true },

    listedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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

export type CreatedHome = InferSchemaType<typeof HomeSchema>;
export const Home = model("Home", HomeSchema);
