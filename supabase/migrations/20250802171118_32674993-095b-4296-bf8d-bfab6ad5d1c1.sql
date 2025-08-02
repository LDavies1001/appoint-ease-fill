-- First, simplify the category names and descriptions
UPDATE business_categories 
SET 
  name = CASE 
    WHEN name = 'Beauty Treatments' THEN 'Beauty'
    WHEN name = 'Cleaning & Home Maintenance' THEN 'Home Services'
    WHEN name = 'Health & Fitness' THEN 'Health & Fitness'
    WHEN name = 'Entertainment & Events' THEN 'Entertainment'
    WHEN name = 'Education & Training' THEN 'Education'
    WHEN name = 'Professional Services' THEN 'Professional'
    WHEN name = 'Retail & Shopping' THEN 'Retail'
    WHEN name = 'Automotive' THEN 'Automotive'
    WHEN name = 'Food & Beverage' THEN 'Food & Drink'
    WHEN name = 'Niche or Other' THEN 'Other'
    ELSE name
  END,
  description = CASE 
    WHEN name = 'Beauty Treatments' THEN 'Beauty and wellness services'
    WHEN name = 'Cleaning & Home Maintenance' THEN 'Home and property services'
    WHEN name = 'Health & Fitness' THEN 'Health and fitness services'
    WHEN name = 'Entertainment & Events' THEN 'Entertainment and event services'
    WHEN name = 'Education & Training' THEN 'Teaching and training services'
    WHEN name = 'Professional Services' THEN 'Business and professional services'
    WHEN name = 'Retail & Shopping' THEN 'Retail and shopping services'
    WHEN name = 'Automotive' THEN 'Vehicle and automotive services'
    WHEN name = 'Food & Beverage' THEN 'Food and drink services'
    WHEN name = 'Niche or Other' THEN 'Specialized or unique services'
    ELSE description
  END;