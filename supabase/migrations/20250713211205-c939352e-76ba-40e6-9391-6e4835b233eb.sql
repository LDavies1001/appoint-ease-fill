-- Clear existing services and add only the requested ones
DELETE FROM services;

INSERT INTO services (name, category, description, typical_duration) VALUES
('Lashes', 'Beauty', 'Professional lash extension services', 120),
('Nails', 'Beauty', 'Manicure and pedicure services', 75),
('Deep Cleans', 'Cleaning', 'Comprehensive deep cleaning services', 180);