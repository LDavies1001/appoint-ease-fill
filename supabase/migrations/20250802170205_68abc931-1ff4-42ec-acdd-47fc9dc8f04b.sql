UPDATE business_categories 
SET description = CASE 
  WHEN name = 'Beauty & Wellness' THEN 'Hair styling, cuts, coloring, nail art, manicures, pedicures, facials, waxing, eyebrow threading, makeup services'
  WHEN name = 'Health & Fitness' THEN 'Personal training, yoga instruction, pilates, nutrition coaching, massage therapy, physiotherapy, sports coaching'
  WHEN name = 'Home Services' THEN 'House cleaning, gardening, plumbing, electrical work, painting, carpentry, appliance repair, pest control'
  WHEN name = 'Professional Services' THEN 'Legal advice, accounting, bookkeeping, business consulting, marketing, graphic design, web development, translation'
  WHEN name = 'Automotive' THEN 'Car repairs, MOT testing, tire fitting, car detailing, oil changes, brake service, engine diagnostics'
  WHEN name = 'Food & Beverage' THEN 'Catering, private chef services, baking, cake decorating, meal prep, bartending, coffee services'
  WHEN name = 'Entertainment' THEN 'Photography, videography, DJ services, live music, party planning, magic shows, face painting, event hosting'
  WHEN name = 'Education & Training' THEN 'Tutoring, music lessons, language teaching, driving instruction, art classes, computer training, skills coaching'
  WHEN name = 'Retail & Shopping' THEN 'Personal shopping, styling services, custom clothing, jewelry making, gift wrapping, product sourcing'
  WHEN name = 'Other' THEN 'Pet services, childcare, eldercare, moving services, travel planning, virtual assistance, custom services'
  ELSE description
END;