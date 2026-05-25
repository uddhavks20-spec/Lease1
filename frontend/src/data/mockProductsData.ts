export interface ProductAttribute {
  name: string;
  options: { label: string; weight: number; imageUrl?: string }[];
}

export interface MockProduct {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  paybackPeriod: number;
  attributes: ProductAttribute[];
}

export const mockProductsData: MockProduct[] = [
  // Appliances & Cooling (Payback: 8 months)
  {
    id: "air-conditioner",
    title: "Air Conditioner",
    category: "Appliances & Cooling",
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 8,
    attributes: [
      { 
        name: "Type", 
        options: [
          { label: "1.5 Ton Split", weight: 1.2, imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80" }, 
          { label: "1 Ton Window", weight: 0.9, imageUrl: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=500&q=80" }
        ] 
      },
      { name: "Star Rating", options: [{ label: "3-Star", weight: 0.9 }, { label: "5-Star Inverter", weight: 1.25 }] },
      { name: "Brand Tier", options: [{ label: "Premium", weight: 1.2 }, { label: "Economy", weight: 1.0 }] }
    ]
  },
  {
    id: "refrigerator",
    title: "Refrigerator",
    category: "Appliances & Cooling",
    imageUrl: "https://images.unsplash.com/photo-1571175432247-5c868d32b350?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 8,
    attributes: [
      { 
        name: "Model", 
        options: [
          { label: "190L Single Door", weight: 1.0, imageUrl: "https://images.unsplash.com/photo-1571175432247-5c868d32b350?auto=format&fit=crop&w=500&q=80" }, 
          { label: "50L Mini-Fridge", weight: 0.7, imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=500&q=80" }
        ] 
      },
      { name: "Defrost Type", options: [{ label: "Direct Cool", weight: 0.9 }, { label: "Frost-Free", weight: 1.2 }] },
      { name: "Shelf Material", options: [{ label: "Toughened Glass", weight: 1.1 }, { label: "Wire", weight: 0.9 }] }
    ]
  },
  {
    id: "washing-machine",
    title: "Washing Machine",
    category: "Appliances & Cooling",
    imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 8,
    attributes: [
      { 
        name: "Technology", 
        options: [
          { label: "Fully Automatic", weight: 1.2, imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=500&q=80" }, 
          { label: "Semi-Automatic", weight: 0.8, imageUrl: "https://images.unsplash.com/photo-1545173168-9f1947e80154?auto=format&fit=crop&w=500&q=80" }
        ] 
      },
      { name: "Loading Type", options: [{ label: "Top-load", weight: 1.0 }, { label: "Front-load", weight: 1.3 }] },
      { name: "Capacity", options: [{ label: "6.5kg", weight: 1.0 }, { label: "8kg", weight: 1.2 }] }
    ]
  },
  {
    id: "microwave-20l",
    title: "20L Solo Microwave Oven",
    category: "Appliances & Cooling",
    imageUrl: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 8,
    attributes: [
      { name: "Control Type", options: [{ label: "Mechanical Knobs", weight: 0.9 }, { label: "Digital Touch", weight: 1.2 }] },
      { name: "Cavity Type", options: [{ label: "Powder Coated", weight: 1.0 }, { label: "Ceramic", weight: 1.2 }] }
    ]
  },
  {
    id: "induction-cooktop",
    title: "Induction Cooktop",
    category: "Appliances & Cooling",
    imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 8,
    attributes: [
      { name: "Wattage", options: [{ label: "1600W", weight: 0.9 }, { label: "2000W", weight: 1.1 }, { label: "2200W", weight: 1.3 }] },
      { name: "Surface Glass Quality", options: [{ label: "Standard", weight: 1.0 }, { label: "Schott Ceran", weight: 1.4 }] },
      { name: "Preset Menus", options: [{ label: "Basic (5-7)", weight: 1.0 }, { label: "Advanced (10+)", weight: 1.2 }] }
    ]
  },
  {
    id: "air-cooler-40l",
    title: "Compact Air Cooler (40L)",
    category: "Appliances & Cooling",
    imageUrl: "https://images.unsplash.com/photo-1618945596041-aa6d89dfda71?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 8,
    attributes: [
      { name: "Cooling Pad", options: [{ label: "Honeycomb", weight: 1.2 }, { label: "Aspen Wood", weight: 0.9 }] },
      { name: "Fan Type", options: [{ label: "Blower", weight: 1.1 }, { label: "Axial Fan", weight: 0.9 }] }
    ]
  },
  {
    id: "garment-steamer",
    title: "Garment Steamer & Iron Press Board",
    category: "Appliances & Cooling",
    imageUrl: "https://images.unsplash.com/photo-1517420812313-8fc1b5b8f30c?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 8,
    attributes: [
      { name: "Continuous Steam Rate", options: [{ label: "Standard", weight: 1.0 }, { label: "High Flow", weight: 1.3 }] },
      { name: "Water Tank Volume", options: [{ label: "1.5L", weight: 1.0 }, { label: "2.5L+", weight: 1.2 }] },
      { name: "Board Padding Thickness", options: [{ label: "Standard", weight: 1.0 }, { label: "Premium Extra Thick", weight: 1.2 }] }
    ]
  },

  // Electronics & Entertainment (Payback: 6 months)
  {
    id: "smart-tv",
    title: "Smart TV",
    category: "Electronics & Entertainment",
    imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 6,
    attributes: [
      { 
        name: "Size", 
        options: [
          { label: "43-inch 4K", weight: 1.2, imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=500&q=80" }, 
          { label: "32-inch LED", weight: 0.8, imageUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=500&q=80" }
        ] 
      },
      { name: "Panel Type", options: [{ label: "LED", weight: 1.0 }, { label: "QLED", weight: 1.3 }] },
      { name: "Resolution", options: [{ label: "Full HD", weight: 0.9 }, { label: "4K UHD", weight: 1.2 }] }
    ]
  },
  {
    id: "monitor",
    title: "Monitor",
    category: "Electronics & Entertainment",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 6,
    attributes: [
      { 
        name: "Type", 
        options: [
          { label: "24-inch IPS", weight: 1.0, imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80" }, 
          { label: "27-inch 2K Gaming", weight: 1.4, imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80" }
        ] 
      },
      { name: "Refresh Rate", options: [{ label: "60Hz", weight: 0.9 }, { label: "144Hz", weight: 1.2 }, { label: "240Hz", weight: 1.4 }] },
      { name: "Panel Tech", options: [{ label: "IPS", weight: 1.1 }, { label: "VA", weight: 0.9 }] }
    ]
  },
  {
    id: "laptop",
    title: "Laptop",
    category: "Electronics & Entertainment",
    imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 6,
    attributes: [
      { 
        name: "Model", 
        options: [
          { label: "Intel i5 / 16GB", weight: 1.0, imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=500&q=80" }, 
          { label: "M-Series MacBook", weight: 1.5, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80" }
        ] 
      },
      { name: "Storage", options: [{ label: "256GB SSD", weight: 0.9 }, { label: "512GB SSD", weight: 1.1 }] },
      { name: "GPU", options: [{ label: "Integrated", weight: 1.0 }, { label: "Dedicated", weight: 1.3 }] }
    ]
  },
  {
    id: "soundbar-bt",
    title: "Bluetooth Soundbar with Subwoofer",
    category: "Electronics & Entertainment",
    imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 6,
    attributes: [
      { name: "Total RMS Wattage", options: [{ label: "60W", weight: 0.9 }, { label: "120W+", weight: 1.25 }] },
      { name: "Audio Channels", options: [{ label: "2.1", weight: 1.0 }, { label: "4.1", weight: 1.3 }] },
      { name: "Connectivity", options: [{ label: "Optical", weight: 1.0 }, { label: "HDMI ARC", weight: 1.2 }, { label: "Bluetooth Only", weight: 0.8 }] }
    ]
  },
  {
    id: "headphones-anc",
    title: "Noise-Canceling Wireless Headphones",
    category: "Electronics & Entertainment",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 6,
    attributes: [
      { name: "ANC Efficiency", options: [{ label: "Standard (20dB)", weight: 1.0 }, { label: "Premium (35dB+)", weight: 1.4 }] },
      { name: "Ear-pad Material", options: [{ label: "Leatherette", weight: 1.0 }, { label: "Memory Foam/Fabric", weight: 1.2 }] },
      { name: "Fast Charging Support", options: [{ label: "Yes", weight: 1.15 }, { label: "No", weight: 0.9 }] }
    ]
  },
  {
    id: "keyboard-mech",
    title: "Mechanical Gaming Keyboard",
    category: "Electronics & Entertainment",
    imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 6,
    attributes: [
      { name: "Switch Type", options: [{ label: "Red Linear", weight: 1.0 }, { label: "Brown Tactile", weight: 1.1 }, { label: "Blue Clicky", weight: 0.9 }] },
      { name: "Frame Material", options: [{ label: "Plastic", weight: 1.0 }, { label: "Aluminum/Metal", weight: 1.3 }] },
      { name: "Keycap Profile", options: [{ label: "OEM", weight: 1.0 }, { label: "PBT Double-shot", weight: 1.2 }] }
    ]
  },
  {
    id: "mouse-vertical",
    title: "Ergonomic Vertical Wireless Mouse",
    category: "Electronics & Entertainment",
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 6,
    attributes: [
      { name: "DPI Sensor Sensitivity", options: [{ label: "Standard (1600)", weight: 1.0 }, { label: "High (4000+)", weight: 1.25 }] },
      { name: "Ergonomic Size", options: [{ label: "Medium", weight: 1.0 }, { label: "Large/Pro", weight: 1.15 }] },
      { name: "Power Source", options: [{ label: "Rechargeable", weight: 1.2 }, { label: "AA Battery", weight: 0.9 }] }
    ]
  },

  // Furniture & Room Layouts (Payback: 10 months)
  {
    id: "chair-office",
    title: "Ergonomic Office Chair",
    category: "Study & Furniture",
    imageUrl: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Adjustment Options", options: [{ label: "2D Armrest", weight: 1.0 }, { label: "3D Armrest", weight: 1.2 }, { label: "Tilt Lock", weight: 1.1 }] },
      { name: "Mesh Type", options: [{ label: "Standard", weight: 1.0 }, { label: "Breathable Premium", weight: 1.25 }] },
      { name: "Hydraulic Class", options: [{ label: "Class 3", weight: 1.0 }, { label: "Class 4 (Pro)", weight: 1.3 }] }
    ]
  },
  {
    id: "desk-wooden",
    title: "Wooden Study Desk",
    category: "Study & Furniture",
    imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Frame Material", options: [{ label: "Engineered Wood", weight: 0.9 }, { label: "Steel Frame", weight: 1.2 }] },
      { name: "Drawer Units", options: [{ label: "None", weight: 0.8 }, { label: "Single", weight: 1.0 }, { label: "Double+", weight: 1.25 }] },
      { name: "Cable Management", options: [{ label: "Yes", weight: 1.15 }, { label: "No", weight: 1.0 }] }
    ]
  },
  {
    id: "bed-frame",
    title: "Single Solid Wood Bed Frame",
    category: "Study & Furniture",
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Wood Grain Class", options: [{ label: "Standard", weight: 1.0 }, { label: "Premium Teak/Sheesham", weight: 1.4 }] },
      { name: "Built-in Under-bed Storage", options: [{ label: "Yes", weight: 1.3 }, { label: "No", weight: 1.0 }] },
      { name: "Joint Assembly System", options: [{ label: "Standard Bolt", weight: 1.0 }, { label: "Interlocking Tool-free", weight: 1.25 }] }
    ]
  },
  {
    id: "mattress-ortho",
    title: "6-Inch Orthopedic Foam Mattress",
    category: "Study & Furniture",
    imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Core Layering", options: [{ label: "Memory Foam", weight: 1.3 }, { label: "High-Density Coir", weight: 1.0 }] },
      { name: "Outer Fabric Rating", options: [{ label: "Breathable Cotton", weight: 1.0 }, { label: "Anti-bacterial Premium", weight: 1.2 }] },
      { name: "Anti-Sag Warranty", options: [{ label: "Standard", weight: 1.0 }, { label: "Lifetime Structure", weight: 1.25 }] }
    ]
  },
  {
    id: "wardrobe-2door",
    title: "2-Door Wooden Wardrobe",
    category: "Study & Furniture",
    imageUrl: "https://images.unsplash.com/photo-1558882224-cca16673336d?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Hanger Rod Config", options: [{ label: "Single", weight: 1.0 }, { label: "Double High-capacity", weight: 1.2 }] },
      { name: "Internal Locker Safe", options: [{ label: "Yes", weight: 1.35 }, { label: "No", weight: 1.0 }] },
      { name: "Integrated Mirror", options: [{ label: "Yes", weight: 1.2 }, { label: "No", weight: 1.0 }] }
    ]
  },
  {
    id: "bookshelf-3tier",
    title: "3-Tier Compact Bookshelf",
    category: "Study & Furniture",
    imageUrl: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Weight Capacity per Shelf", options: [{ label: "10kg", weight: 1.0 }, { label: "25kg+", weight: 1.3 }] },
      { name: "Shelf Adjustability", options: [{ label: "Fixed", weight: 0.9 }, { label: "Modular/Adjustable", weight: 1.2 }] },
      { name: "Anti-Scratch Coating", options: [{ label: "Yes", weight: 1.15 }, { label: "No", weight: 1.0 }] }
    ]
  },
  {
    id: "mirror-full",
    title: "Full-Length Dressing Mirror",
    category: "Study & Furniture",
    imageUrl: "https://images.unsplash.com/photo-1617806118233-18e1db207f62?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Support Type", options: [{ label: "Wall Mount", weight: 1.0 }, { label: "Floor Stand", weight: 1.3 }] },
      { name: "Border Accent Material", options: [{ label: "Minimal Plastic", weight: 0.9 }, { label: "Metal/Wood", weight: 1.2 }] },
      { name: "Distortion-Free Glass", options: [{ label: "Yes", weight: 1.4 }, { label: "Standard", weight: 1.0 }] }
    ]
  },
  {
    id: "laptop-table-bed",
    title: "Adjustable Laptop Table for Bed",
    category: "Study & Furniture",
    imageUrl: "https://images.unsplash.com/photo-1565793298595-6a879990407c?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Tilt Angles Available", options: [{ label: "4-Point", weight: 1.0 }, { label: "Infinite Adjust", weight: 1.3 }] },
      { name: "Passive Fan Slats", options: [{ label: "Yes", weight: 1.2 }, { label: "No", weight: 1.0 }] },
      { name: "Leg Lock Stability", options: [{ label: "Basic", weight: 1.0 }, { label: "Pro-Grip", weight: 1.25 }] }
    ]
  },
  {
    id: "bean-bag-xxl",
    title: "Bean Bag with Beans (XXL)",
    category: "Study & Furniture",
    imageUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Outer Material", options: [{ label: "Leatherette", weight: 1.2 }, { label: "Canvas", weight: 0.9 }] },
      { name: "Bean Fill Volume", options: [{ label: "3kg Standard", weight: 1.0 }, { label: "5kg Full", weight: 1.3 }] },
      { name: "Seam Stitching Grade", options: [{ label: "Single", weight: 0.9 }, { label: "Double-reinforced", weight: 1.2 }] }
    ]
  },
  {
    id: "shoe-rack-metal",
    title: "Metal Shoe Rack (4-Tier)",
    category: "Study & Furniture",
    imageUrl: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Pipe Gauge Thickness", options: [{ label: "Standard", weight: 1.0 }, { label: "Heavy Duty", weight: 1.3 }] },
      { name: "Powder-Coating Grade", options: [{ label: "Basic", weight: 1.0 }, { label: "Industrial Rust-proof", weight: 1.25 }] },
      { name: "Modular Stackability", options: [{ label: "Yes", weight: 1.2 }, { label: "No", weight: 1.0 }] }
    ]
  },

  // Lifestyle & Academics (Payback: 10 months)
  {
    id: "backpack-65l",
    title: "65L Trekking Backpack",
    category: "Clothing & Accessories",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Internal Frame Material", options: [{ label: "Fiberglass", weight: 1.0 }, { label: "Aluminum Alloy", weight: 1.3 }] },
      { name: "Waterproof Denier Index", options: [{ label: "400D", weight: 1.0 }, { label: "1000D+", weight: 1.4 }] },
      { name: "Torso Adjustment Nodes", options: [{ label: "3-point", weight: 1.0 }, { label: "Micro-adjust Infinite", weight: 1.3 }] }
    ]
  },
  {
    id: "camping-tent",
    title: "Water-Resistant 3-Person Camping Tent",
    category: "Clothing & Accessories",
    imageUrl: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Rainfly Hydrostatic Rating", options: [{ label: "1500mm", weight: 0.9 }, { label: "3000mm+", weight: 1.35 }] },
      { name: "Pole Type", options: [{ label: "Fiberglass", weight: 1.0 }, { label: "Aluminum Alloy", weight: 1.4 }] },
      { name: "Groundsheet Grade", options: [{ label: "Standard PE", weight: 1.0 }, { label: "Reinforced Oxford", weight: 1.25 }] }
    ]
  },
  {
    id: "drawing-board-a1",
    title: "Engineering Graphics Drawing Board (A1)",
    category: "Clothing & Accessories",
    imageUrl: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=500&q=80",
    paybackPeriod: 10,
    attributes: [
      { name: "Wood Smoothness Grade", options: [{ label: "Class B", weight: 0.9 }, { label: "Class A+ Super Smooth", weight: 1.3 }] },
      { name: "Straight-edge Precision Level", options: [{ label: "±0.5mm", weight: 1.0 }, { label: "±0.1mm (Pro)", weight: 1.4 }] },
      { name: "Integrated Draft Machine Compatibility", options: [{ label: "Yes", weight: 1.3 }, { label: "No", weight: 1.0 }] }
    ]
  }
];
