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
('Office Cleaning', 'Cleaning', 'Commercial workspace cleaning', 180);