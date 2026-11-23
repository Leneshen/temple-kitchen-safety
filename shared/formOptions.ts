// Form options shared by the app and the API. Edit these to match the temple's own kitchen procedures.

export const AREAS = [
  "Benches and prep surfaces",
  "Stovetops and burners",
  "Ovens",
  "Sinks and dishwasher",
  "Fridges and cool room",
  "Floors",
  "Dry storage",
  "Exhaust hood",
  "Bins and waste area",
];

export const CHECKS = [
  "Gloves worn",
  "Apron worn",
  "Chemicals used as per label",
  "Chemicals stored away after use",
  "Raw and cooked food kept separate",
  "Food covered and labelled",
  "Fridge temperature checked",
  "Hand-wash station stocked",
  "Rubbish and waste disposed of",
  "Gas and appliances switched off",
];

export const HAZARDS = [
  "Wet or slippery floor",
  "Sharp object",
  "Hot surface or oil",
  "Chemical",
  "Electrical",
  "Gas smell",
  "Pests",
  "Damaged equipment",
  "Blocked exit",
];

export const ACTIONS = [
  "Cleaned up",
  "Area cordoned off",
  "Equipment tagged out",
  "First aid given",
  "Reported to committee",
  "Reported to kitchen coordinator",
];

/** Safe range for chilled storage, in °C. */
export const FRIDGE_MAX_C = 5;

