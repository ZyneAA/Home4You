import type mongoose from "mongoose";

export interface IProperty extends mongoose.Document {
  listedBy: mongoose.Types.ObjectId;
  title?: string;

  price: number;
  currency?: string;
  transactionType: "sale" | "rent";

  location: {
    type: "Point";
    coordinates: [number, number];
  };

  address?: string;
  city?: string;
  country?: string;

  bedrooms?: number;
  bathrooms?: number;
  numOfFloors?: number;
  areaSqFt?: number;

  category?: "apartment" | "house" | "condo" | "villa" | "studio" | "land";

  photos?: string[];

  amenities?: string[];

  builtYear?: number;
  furnished?: boolean;
}
