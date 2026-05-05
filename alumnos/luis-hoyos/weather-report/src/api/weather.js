const mockData = {
  madrid: {
    name: 'Madrid',
    country: 'España',
    temperature: 22,
    description: 'Parcialmente nublado',
    humidity: 65,
    windSpeed: 12,
    forecast: [
      { day: 'Lun', max: 24, min: 18, code: '02d' },
      { day: 'Mar', max: 23, min: 17, code: '04d' },
      { day: 'Mié', max: 25, min: 19, code: '01d' },
      { day: 'Jue', max: 20, min: 15, code: '09d' },
      { day: 'Vie', max: 21, min: 16, code: '10d' },
      { day: 'Sáb', max: 26, min: 20, code: '01d' },
      { day: 'Dom', max: 24, min: 19, code: '02d' }
    ]
  },
  barcelona: {
    name: 'Barcelona',
    country: 'España',
    temperature: 19,
    description: 'Lluvia ligera',
    humidity: 78,
    windSpeed: 18,
    forecast: [
      { day: 'Lun', max: 20, min: 16, code: '10d' },
      { day: 'Mar', max: 19, min: 15, code: '09d' },
      { day: 'Mié', max: 21, min: 17, code: '04d' },
      { day: 'Jue', max: 22, min: 18, code: '02d' },
      { day: 'Vie', max: 23, min: 19, code: '01d' },
      { day: 'Sáb', max: 21, min: 17, code: '04d' },
      { day: 'Dom', max: 20, min: 16, code: '10d' }
    ]
  },
  'buenos aires': {
    name: 'Buenos Aires',
    country: 'Argentina',
    temperature: 18,
    description: 'Cielo despejado',
    humidity: 72,
    windSpeed: 15,
    forecast: [
      { day: 'Lun', max: 22, min: 16, code: '01d' },
      { day: 'Mar', max: 24, min: 18, code: '01d' },
      { day: 'Mié', max: 21, min: 17, code: '02d' },
      { day: 'Jue', max: 19, min: 14, code: '04d' },
      { day: 'Vie', max: 20, min: 15, code: '09d' },
      { day: 'Sáb', max: 23, min: 17, code: '01d' },
      { day: 'Dom', max: 25, min: 19, code: '01d' }
    ]
  }
};

export function getWeatherByCity(city) {
  const normalizedCity = city.toLowerCase().trim();
  return mockData[normalizedCity] || null;
}
