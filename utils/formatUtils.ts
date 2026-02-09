
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  let date: Date;

  // Handles YYYY-MM-DD from date input
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    if (day && month && year) {
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
        return dateString;
    }
  } else if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) { // Handles DD/MM/YYYY
        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else if (parts.length === 2) { // Handles DD/MM from AI
        return dateString; // It's already in the correct format
    } else {
         return dateString;
    }
  } else {
    return dateString; // Return original if format is unknown
  }

  if (isNaN(date.getTime())) {
    return dateString; // Invalid date parsed
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  return `${day}/${month}`;
};


export const isValidDateString = (dateString: string): boolean => {
    if (!dateString) return false;
    
    // YYYY-MM-DD format from <input type="date">
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (isoRegex.test(dateString)) {
        const date = new Date(dateString);
        // Also check if it's a real date, e.g. 2023-02-30 is invalid
        return !isNaN(date.getTime()) && date.toISOString().startsWith(dateString);
    }

    // DD/MM/YYYY or D/M/YYYY format
    const brRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
    const parts = dateString.match(brRegex);
    if (!parts) return false;
    
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10);
    const year = parseInt(parts[3], 10);

    if (year < 1000 || year > 3000 || month === 0 || month > 12) return false;

    const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) monthLength[1] = 29;

    return day > 0 && day <= monthLength[month - 1];
};

export const formatCurrency = (value: string | number): string => {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  
  let num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;

  if (isNaN(num)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
};
