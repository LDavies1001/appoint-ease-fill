// Temporary compatibility layer for schema migration
// This addresses TypeScript errors by providing fallback values for removed fields

export const addCompatibilityFields = (data: any) => {
  if (!data) return data;
  
  return {
    ...data,
    // Provide fallback values for removed address fields
    business_address: data.formatted_address || '',
    business_street: '',
    business_city: data.formatted_address?.split(',')[0] || '',
    business_county: data.formatted_address?.split(',')[1] || '',
    business_country: 'UK',
    service_area: Array.isArray(data.coverage_areas) 
      ? data.coverage_areas.map((area: any) => area.area_name || area).join(', ')
      : (data.coverage_areas || ''),
  };
};

export const stripCompatibilityFields = (data: any) => {
  if (!data) return data;
  
  const { 
    business_address, 
    business_street, 
    business_city, 
    business_county, 
    business_country, 
    service_area,
    ...cleanData 
  } = data;
  
  return cleanData;
};