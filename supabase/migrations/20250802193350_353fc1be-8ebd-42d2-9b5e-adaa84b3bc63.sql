-- First, let's add comprehensive services to the services table
INSERT INTO services (name, category, description, typical_duration) VALUES
-- Hair Services
('Hair Cut & Style', 'Hair', 'Professional haircut and styling', 60),
('Hair Color', 'Hair', 'Hair coloring service', 120),
('Hair Highlights', 'Hair', 'Hair highlighting service', 150),
('Blowdry', 'Hair', 'Professional hair blowdry', 45),
('Hair Treatment', 'Hair', 'Deep conditioning hair treatment', 45),
('Perm', 'Hair', 'Hair perming service', 180),
('Hair Extensions', 'Hair', 'Hair extension application', 120),
('Keratin Treatment', 'Hair', 'Keratin smoothing treatment', 180),

-- Beauty Services
('Facial', 'Beauty', 'Professional facial treatment', 60),
('Eyebrow Threading', 'Beauty', 'Eyebrow shaping with threading', 20),
('Eyebrow Waxing', 'Beauty', 'Eyebrow shaping with wax', 15),
('Eyebrow Tinting', 'Beauty', 'Eyebrow tinting service', 30),
('Eyelash Extensions', 'Beauty', 'Individual eyelash extension application', 120),
('Eyelash Tinting', 'Beauty', 'Eyelash tinting service', 30),
('Eyelash Lift', 'Beauty', 'Eyelash lifting and curling', 60),
('Makeup Application', 'Beauty', 'Professional makeup application', 60),
('Bridal Makeup', 'Beauty', 'Bridal makeup service', 90),

-- Nail Services
('Manicure', 'Nails', 'Professional manicure', 45),
('Pedicure', 'Nails', 'Professional pedicure', 60),
('Gel Manicure', 'Nails', 'Gel polish manicure', 60),
('Gel Pedicure', 'Nails', 'Gel polish pedicure', 75),
('Acrylic Nails', 'Nails', 'Acrylic nail application', 90),
('Nail Art', 'Nails', 'Decorative nail art', 45),
('Nail Repair', 'Nails', 'Individual nail repair', 20),

-- Massage & Wellness
('Swedish Massage', 'Massage', 'Relaxing Swedish massage', 60),
('Deep Tissue Massage', 'Massage', 'Therapeutic deep tissue massage', 60),
('Hot Stone Massage', 'Massage', 'Massage with heated stones', 90),
('Aromatherapy Massage', 'Massage', 'Massage with essential oils', 75),
('Sports Massage', 'Massage', 'Massage for athletes', 60),

-- Skincare
('Chemical Peel', 'Skincare', 'Professional chemical peel', 45),
('Microdermabrasion', 'Skincare', 'Skin resurfacing treatment', 60),
('Hydrafacial', 'Skincare', 'Hydrating facial treatment', 60),
('Anti-aging Treatment', 'Skincare', 'Anti-aging skincare treatment', 75),

-- Body Treatments
('Body Scrub', 'Body', 'Full body exfoliation', 45),
('Body Wrap', 'Body', 'Detoxifying body wrap', 60),
('Spray Tan', 'Body', 'Professional spray tanning', 30),

-- Cleaning Services
('House Cleaning', 'Cleaning', 'General house cleaning service', 120),
('Deep Cleaning', 'Cleaning', 'Comprehensive deep cleaning', 240),
('Office Cleaning', 'Cleaning', 'Commercial office cleaning', 90),
('Carpet Cleaning', 'Cleaning', 'Professional carpet cleaning', 60),
('Window Cleaning', 'Cleaning', 'Interior and exterior window cleaning', 90);

-- Now let's update your provider_details to include some beauty services you might have selected
UPDATE provider_details 
SET services_offered = ARRAY['Facial', 'Eyebrow Threading', 'Eyelash Extensions', 'Manicure', 'Pedicure']
WHERE user_id = '2a31744a-8fae-4fde-b01f-5c475082940f';