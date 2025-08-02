-- First, let's add more comprehensive services to the services table
INSERT INTO services (name, category, description, typical_duration) VALUES
-- Beauty Services
('Haircuts', 'Beauty', 'Professional hair cutting services', 60),
('Hair Coloring', 'Beauty', 'Hair dyeing and coloring services', 120),
('Hair Styling', 'Beauty', 'Hair styling and blowdry services', 45),
('Eyebrow Threading', 'Beauty', 'Precision eyebrow shaping', 30),
('Eyebrow Waxing', 'Beauty', 'Eyebrow hair removal with wax', 20),
('Eyelash Extensions', 'Beauty', 'Individual lash extension application', 90),
('Facial Treatments', 'Beauty', 'Deep cleansing and rejuvenating facials', 75),
('Makeup Application', 'Beauty', 'Professional makeup services', 45),
('Manicures', 'Beauty', 'Nail care and polish application', 45),
('Pedicures', 'Beauty', 'Foot and toenail care services', 60),
('Gel Nails', 'Beauty', 'Gel nail application and design', 75),
('Acrylic Nails', 'Beauty', 'Acrylic nail extensions', 90),
('Nail Art', 'Beauty', 'Creative nail design services', 60),
('Body Waxing', 'Beauty', 'Hair removal services', 45),
('Microblading', 'Beauty', 'Semi-permanent eyebrow tattooing', 120),
('Permanent Makeup', 'Beauty', 'Long-lasting cosmetic tattooing', 150),

-- Wellness Services  
('Massage Therapy', 'Wellness', 'Therapeutic massage treatments', 60),
('Deep Tissue Massage', 'Wellness', 'Intensive muscle therapy', 75),
('Swedish Massage', 'Wellness', 'Relaxing full-body massage', 60),
('Hot Stone Massage', 'Wellness', 'Heated stone therapy massage', 90),
('Aromatherapy', 'Wellness', 'Essential oil therapeutic treatments', 60),
('Reflexology', 'Wellness', 'Foot pressure point therapy', 45),
('Acupuncture', 'Wellness', 'Traditional Chinese medicine therapy', 60),
('Reiki Healing', 'Wellness', 'Energy healing therapy', 60),

-- Spa Services
('Body Wraps', 'Spa', 'Detoxifying body treatments', 90),
('Sauna Sessions', 'Spa', 'Heat therapy relaxation', 30),
('Steam Room', 'Spa', 'Steam therapy sessions', 20),

-- Hair Services (Extended)
('Beard Trimming', 'Grooming', 'Professional beard styling', 30),
('Mustache Grooming', 'Grooming', 'Precision mustache trimming', 15),
('Hair Washing', 'Beauty', 'Professional hair cleansing', 20),
('Scalp Treatments', 'Beauty', 'Therapeutic scalp care', 45),
('Hair Extensions', 'Beauty', 'Hair length and volume enhancement', 180),
('Keratin Treatments', 'Beauty', 'Hair smoothing treatments', 180),
('Perms', 'Beauty', 'Chemical hair curling', 120),
('Hair Straightening', 'Beauty', 'Chemical hair relaxing', 150),

-- Cleaning Services (Extended)
('Regular House Cleaning', 'Cleaning', 'Standard home cleaning service', 120),
('Move-in/Move-out Cleaning', 'Cleaning', 'Comprehensive cleaning for relocations', 240),
('Post-Construction Cleaning', 'Cleaning', 'Cleanup after renovation work', 300),
('Window Cleaning', 'Cleaning', 'Interior and exterior window washing', 90),
('Carpet Cleaning', 'Cleaning', 'Deep carpet and rug cleaning', 120),
('Upholstery Cleaning', 'Cleaning', 'Furniture and fabric cleaning', 90),
('Office Cleaning', 'Cleaning', 'Commercial workspace cleaning', 180),

-- Fitness Services
('Personal Training', 'Fitness', 'One-on-one fitness coaching', 60),
('Group Fitness Classes', 'Fitness', 'Instructor-led group workouts', 45),
('Yoga Sessions', 'Fitness', 'Individual or group yoga instruction', 60),
('Pilates', 'Fitness', 'Core strengthening exercise sessions', 60),
('Nutritional Counseling', 'Fitness', 'Diet and nutrition guidance', 45),

-- Photography Services
('Portrait Photography', 'Photography', 'Individual and family portraits', 120),
('Event Photography', 'Photography', 'Special occasion photography', 240),
('Wedding Photography', 'Photography', 'Wedding day photography services', 480),
('Product Photography', 'Photography', 'Commercial product imaging', 90),
('Headshot Photography', 'Photography', 'Professional business portraits', 60),

-- Automotive Services
('Car Detailing', 'Automotive', 'Comprehensive vehicle cleaning', 180),
('Car Wash', 'Automotive', 'Exterior vehicle washing', 30),
('Oil Changes', 'Automotive', 'Engine oil replacement service', 30),
('Tire Services', 'Automotive', 'Tire installation and repair', 60),

-- Home Services
('Plumbing Repairs', 'Home Services', 'Residential plumbing fixes', 120),
('Electrical Repairs', 'Home Services', 'Home electrical maintenance', 90),
('HVAC Maintenance', 'Home Services', 'Heating and cooling system service', 120),
('Handyman Services', 'Home Services', 'General home repairs and maintenance', 90),
('Gardening', 'Home Services', 'Landscape and garden maintenance', 120),
('Lawn Care', 'Home Services', 'Grass cutting and yard maintenance', 60),
('Pressure Washing', 'Home Services', 'High-pressure exterior cleaning', 90),
('Gutter Cleaning', 'Home Services', 'Roof gutter maintenance', 60),

-- Professional Services
('Legal Consultation', 'Professional', 'Legal advice and consultation', 60),
('Accounting Services', 'Professional', 'Financial and tax services', 90),
('Business Consulting', 'Professional', 'Strategic business advice', 90),
('Tax Preparation', 'Professional', 'Income tax filing services', 120),
('Notary Services', 'Professional', 'Document notarization', 15),

-- Pet Services
('Dog Grooming', 'Pet Services', 'Professional pet grooming', 90),
('Pet Sitting', 'Pet Services', 'In-home pet care', 240),
('Dog Walking', 'Pet Services', 'Exercise and outdoor time for pets', 30),
('Pet Training', 'Pet Services', 'Behavioral training for pets', 60),

-- Food Services
('Catering', 'Food', 'Event and party catering services', 240),
('Personal Chef', 'Food', 'In-home cooking services', 180),
('Meal Prep', 'Food', 'Weekly meal preparation service', 120),
('Baking Services', 'Food', 'Custom cakes and baked goods', 180)

ON CONFLICT (name, category) DO NOTHING;