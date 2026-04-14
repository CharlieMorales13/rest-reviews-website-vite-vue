/**
 * Carreras disponibles en la Universidad Anáhuac Oaxaca.
 * Single Source of Truth — importar desde aquí en RegisterPage y EditProfileModal.
 */
export const CARRERAS = [
  'Administración de Empresas',
  'Administración Turística',
  'Comunicación',
  'Derecho',
  'Diseño de Moda e Innovación',
  'Diseño Gráfico',
  'Diseño Industrial',
  'Diseño Multimedia',
  'Finanzas y Contaduría Pública',
  'Gastronomía',
  'Ingeniería Biomédica',
  'Ingeniería Civil',
  'Ingeniería Industrial para la Dirección',
  'Ingeniería Mecatrónica',
  'Ingeniería en Tecnologías de la Información y Negocios Digitales',
  'Médico Cirujano',
  'Mercadotecnia Estratégica',
  'Psicología',
  'Turismo',
] as const;

export type Carrera = (typeof CARRERAS)[number];
