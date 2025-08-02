-- Update existing categories with new names and descriptions
UPDATE business_categories 
SET 
  name = CASE 
    WHEN name = 'Beauty & Wellness' THEN 'Beauty Treatments'
    WHEN name = 'Home Services' THEN 'Cleaning & Home Maintenance'
    WHEN name = 'Health & Fitness' THEN 'Health & Fitness'
    WHEN name = 'Entertainment' THEN 'Entertainment & Events'
    WHEN name = 'Education & Training' THEN 'Education & Training'
    WHEN name = 'Professional Services' THEN 'Professional Services'
    WHEN name = 'Retail & Shopping' THEN 'Retail & Shopping'
    WHEN name = 'Automotive' THEN 'Automotive'
    WHEN name = 'Food & Beverage' THEN 'Food & Beverage'
    WHEN name = 'Other' THEN 'Niche or Other'
    ELSE name
  END,
  description = CASE 
    WHEN name = 'Beauty & Wellness' THEN 'Lashes, nails, brows, facials, hair'
    WHEN name = 'Home Services' THEN 'Domestic cleaning, deep cleans, gardening, handyman tasks'
    WHEN name = 'Health & Fitness' THEN 'Gyms, personal trainers, yoga, wellness clinics'
    WHEN name = 'Entertainment' THEN 'Photographers, DJs, party planners, entertainers'
    WHEN name = 'Education & Training' THEN 'Tutors, coaches, online training, schools'
    WHEN name = 'Professional Services' THEN 'Legal, accounting, consultants, business support'
    WHEN name = 'Retail & Shopping' THEN 'Shops, boutiques, ecommerce, product-based services'
    WHEN name = 'Automotive' THEN 'Car detailing, mechanics, valeting'
    WHEN name = 'Food & Beverage' THEN 'Catering, private chefs, food trucks, cafes'
    WHEN name = 'Other' THEN 'Unlisted or unique services'
    ELSE description
  END;