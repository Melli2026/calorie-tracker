// Built-in food database. All nutrition values are per 100 g (or 100 ml for liquids).
// serving = a convenient default portion in grams, with a human label.
// Optional extra fields (kept for future use): sugar, satFat, fiber, salt — all per 100 g.
window.FOOD_DB = [
  // --- My products ---
  { name: "Extra Virgin Olive Oil",   kcal: 828, protein: 0,    carbs: 0,    fat: 92,   sugar: 0,    satFat: 18,  fiber: 0,   salt: 0,     serving: 14,  unit: "1 tbsp" },
  { name: "Semi-Skimmed Milk",        kcal: 47,  protein: 3.3,  carbs: 4.8,  fat: 1.6,  sugar: 4.8,  satFat: 1,   fiber: 0,   salt: 0.1,   serving: 240, unit: "1 cup" },
  { name: "Egg",                      kcal: 155, protein: 12.6, carbs: 1.1,  fat: 11.5, sugar: 0.4,  satFat: 3.3, fiber: 0,   salt: 0.37,  serving: 60,  unit: "1 egg" },
  { name: "Cherry Tomato",            kcal: 18,  protein: 0.9,  carbs: 3.9,  fat: 0.2,  sugar: 2.6,  satFat: 0,   fiber: 1.2, salt: 0.02,  serving: 17,  unit: "1 tomato" },
  { name: "Cucumber",                 kcal: 15,  protein: 0.65, carbs: 3.6,  fat: 0.11, sugar: 1.7,  satFat: 0,   fiber: 0.5, salt: 0.002, serving: 200, unit: "1 whole" },
  { name: "Banana",                   kcal: 89,  protein: 1.1,  carbs: 23,   fat: 0.3,  sugar: 12,   satFat: 0.1, fiber: 2.6, salt: 0,     serving: 120, unit: "1 medium" },
  { name: "Blueberry",                kcal: 57,  protein: 0.7,  carbs: 14.5, fat: 0.3,  sugar: 10,   satFat: 0,   fiber: 2.4,              serving: 150, unit: "1 cup" },
  { name: "Yellow Melon",             kcal: 36,  protein: 0.5,  carbs: 9.1,  fat: 0.1,  sugar: 8.1,  satFat: 0,   fiber: 0.8,              serving: 150, unit: "1 slice" },
  { name: "Mavromaris Greek Yogurt",  kcal: 132, protein: 8.5,  carbs: 4.5,  fat: 9,    sugar: 4.5,  satFat: 6,   fiber: 0,                serving: 150, unit: "1 serving" },

  // --- Staples / grains ---
  { name: "White rice (cooked)",      kcal: 130, protein: 2.7,  carbs: 28,   fat: 0.3,  serving: 150, unit: "1 cup" },
  { name: "Brown rice (cooked)",      kcal: 123, protein: 2.7,  carbs: 26,   fat: 1.0,  serving: 150, unit: "1 cup" },
  { name: "Pasta (cooked)",           kcal: 158, protein: 5.8,  carbs: 31,   fat: 0.9,  serving: 140, unit: "1 cup" },
  { name: "Bread, white",             kcal: 265, protein: 9.0,  carbs: 49,   fat: 3.2,  serving: 30,  unit: "1 slice" },
  { name: "Bread, whole wheat",       kcal: 247, protein: 13,   carbs: 41,   fat: 3.4,  serving: 30,  unit: "1 slice" },
  { name: "Oats (dry)",               kcal: 389, protein: 17,   carbs: 66,   fat: 7.0,  serving: 40,  unit: "1/2 cup" },
  { name: "Potato (boiled)",          kcal: 87,  protein: 1.9,  carbs: 20,   fat: 0.1,  serving: 150, unit: "1 medium" },
  { name: "Sweet potato (baked)",     kcal: 90,  protein: 2.0,  carbs: 21,   fat: 0.2,  serving: 150, unit: "1 medium" },
  { name: "Quinoa (cooked)",          kcal: 120, protein: 4.4,  carbs: 21,   fat: 1.9,  serving: 150, unit: "1 cup" },
  { name: "Tortilla, flour",          kcal: 310, protein: 8.0,  carbs: 52,   fat: 7.0,  serving: 50,  unit: "1 medium" },

  // --- Proteins ---
  { name: "Chicken breast (cooked)",  kcal: 165, protein: 31,   carbs: 0,    fat: 3.6,  serving: 120, unit: "1 fillet" },
  { name: "Chicken thigh (cooked)",   kcal: 209, protein: 26,   carbs: 0,    fat: 11,   serving: 100, unit: "1 thigh" },
  { name: "Beef, lean (cooked)",      kcal: 250, protein: 26,   carbs: 0,    fat: 15,   serving: 120, unit: "1 portion" },
  { name: "Pork chop (cooked)",       kcal: 231, protein: 26,   carbs: 0,    fat: 14,   serving: 120, unit: "1 chop" },
  { name: "Salmon (cooked)",          kcal: 208, protein: 20,   carbs: 0,    fat: 13,   serving: 120, unit: "1 fillet" },
  { name: "Tuna (canned, water)",     kcal: 116, protein: 26,   carbs: 0,    fat: 0.8,  serving: 100, unit: "1 can" },
  { name: "Shrimp (cooked)",          kcal: 99,  protein: 24,   carbs: 0.2,  fat: 0.3,  serving: 100, unit: "1 portion" },
  { name: "Egg, whole",               kcal: 143, protein: 13,   carbs: 0.7,  fat: 9.5,  serving: 50,  unit: "1 large" },
  { name: "Egg white",                kcal: 52,  protein: 11,   carbs: 0.7,  fat: 0.2,  serving: 33,  unit: "1 white" },
  { name: "Tofu, firm",               kcal: 144, protein: 17,   carbs: 2.8,  fat: 8.0,  serving: 100, unit: "1 portion" },
  { name: "Tempeh",                   kcal: 192, protein: 20,   carbs: 7.6,  fat: 11,   serving: 100, unit: "1 portion" },
  { name: "Lentils (cooked)",         kcal: 116, protein: 9.0,  carbs: 20,   fat: 0.4,  serving: 150, unit: "1 cup" },
  { name: "Chickpeas (cooked)",       kcal: 164, protein: 8.9,  carbs: 27,   fat: 2.6,  serving: 150, unit: "1 cup" },
  { name: "Black beans (cooked)",     kcal: 132, protein: 8.9,  carbs: 24,   fat: 0.5,  serving: 150, unit: "1 cup" },

  // --- Dairy ---
  { name: "Milk, whole",              kcal: 61,  protein: 3.2,  carbs: 4.8,  fat: 3.3,  serving: 240, unit: "1 cup" },
  { name: "Milk, skim",               kcal: 34,  protein: 3.4,  carbs: 5.0,  fat: 0.1,  serving: 240, unit: "1 cup" },
  { name: "Greek yogurt, plain",      kcal: 59,  protein: 10,   carbs: 3.6,  fat: 0.4,  serving: 170, unit: "1 cup" },
  { name: "Yogurt, plain",            kcal: 61,  protein: 3.5,  carbs: 4.7,  fat: 3.3,  serving: 170, unit: "1 cup" },
  { name: "Cheddar cheese",           kcal: 403, protein: 25,   carbs: 1.3,  fat: 33,   serving: 30,  unit: "1 slice" },
  { name: "Mozzarella cheese",        kcal: 280, protein: 28,   carbs: 3.1,  fat: 17,   serving: 30,  unit: "1 portion" },
  { name: "Cottage cheese",           kcal: 98,  protein: 11,   carbs: 3.4,  fat: 4.3,  serving: 100, unit: "1 portion" },
  { name: "Butter",                   kcal: 717, protein: 0.9,  carbs: 0.1,  fat: 81,   serving: 10,  unit: "1 pat" },

  // --- Vegetables ---
  { name: "Broccoli",                 kcal: 34,  protein: 2.8,  carbs: 7.0,  fat: 0.4,  serving: 100, unit: "1 cup" },
  { name: "Spinach",                  kcal: 23,  protein: 2.9,  carbs: 3.6,  fat: 0.4,  serving: 60,  unit: "2 cups" },
  { name: "Carrot",                   kcal: 41,  protein: 0.9,  carbs: 10,   fat: 0.2,  serving: 60,  unit: "1 medium" },
  { name: "Tomato",                   kcal: 18,  protein: 0.9,  carbs: 3.9,  fat: 0.2,  serving: 120, unit: "1 medium" },
  { name: "Bell pepper",              kcal: 31,  protein: 1.0,  carbs: 6.0,  fat: 0.3,  serving: 120, unit: "1 medium" },
  { name: "Onion",                    kcal: 40,  protein: 1.1,  carbs: 9.3,  fat: 0.1,  serving: 110, unit: "1 medium" },
  { name: "Mixed salad greens",       kcal: 17,  protein: 1.4,  carbs: 3.3,  fat: 0.2,  serving: 85,  unit: "2 cups" },
  { name: "Avocado",                  kcal: 160, protein: 2.0,  carbs: 9.0,  fat: 15,   serving: 100, unit: "1/2 fruit" },

  // --- Fruits ---
  { name: "Apple",                    kcal: 52,  protein: 0.3,  carbs: 14,   fat: 0.2,  serving: 180, unit: "1 medium" },
  { name: "Orange",                   kcal: 47,  protein: 0.9,  carbs: 12,   fat: 0.1,  serving: 130, unit: "1 medium" },
  { name: "Strawberries",             kcal: 32,  protein: 0.7,  carbs: 7.7,  fat: 0.3,  serving: 150, unit: "1 cup" },
  { name: "Grapes",                   kcal: 69,  protein: 0.7,  carbs: 18,   fat: 0.2,  serving: 150, unit: "1 cup" },

  // --- Nuts / fats / snacks ---
  { name: "Almonds",                  kcal: 579, protein: 21,   carbs: 22,   fat: 50,   serving: 28,  unit: "1 handful" },
  { name: "Peanut butter",            kcal: 588, protein: 25,   carbs: 20,   fat: 50,   serving: 32,  unit: "2 tbsp" },
  { name: "Walnuts",                  kcal: 654, protein: 15,   carbs: 14,   fat: 65,   serving: 28,  unit: "1 handful" },
  { name: "Olive oil",                kcal: 884, protein: 0,    carbs: 0,    fat: 100,  serving: 14,  unit: "1 tbsp" },
  { name: "Dark chocolate",           kcal: 546, protein: 4.9,  carbs: 61,   fat: 31,   serving: 25,  unit: "1 portion" },
  { name: "Potato chips",             kcal: 536, protein: 7.0,  carbs: 53,   fat: 35,   serving: 30,  unit: "1 small bag" },

  // --- Common meals / misc ---
  { name: "Pizza, cheese",            kcal: 266, protein: 11,   carbs: 33,   fat: 10,   serving: 110, unit: "1 slice" },
  { name: "Hamburger",                kcal: 295, protein: 17,   carbs: 24,   fat: 14,   serving: 150, unit: "1 burger" },
  { name: "French fries",             kcal: 312, protein: 3.4,  carbs: 41,   fat: 15,   serving: 120, unit: "1 medium" },
  { name: "Cooked vegetables (mixed)",kcal: 60,  protein: 2.6,  carbs: 12,   fat: 0.4,  serving: 150, unit: "1 cup" },
  { name: "Hummus",                   kcal: 166, protein: 8.0,  carbs: 14,   fat: 10,   serving: 60,  unit: "1/4 cup" },
  { name: "Honey",                    kcal: 304, protein: 0.3,  carbs: 82,   fat: 0,    serving: 21,  unit: "1 tbsp" },
  { name: "Orange juice",             kcal: 45,  protein: 0.7,  carbs: 10,   fat: 0.2,  serving: 240, unit: "1 cup" },
  { name: "Cola",                     kcal: 42,  protein: 0,    carbs: 11,   fat: 0,    serving: 330, unit: "1 can" },
  { name: "Beer",                     kcal: 43,  protein: 0.5,  carbs: 3.6,  fat: 0,    serving: 355, unit: "1 can" },
  { name: "Coffee, black",            kcal: 1,   protein: 0.1,  carbs: 0,    fat: 0,    serving: 240, unit: "1 cup" },
];
