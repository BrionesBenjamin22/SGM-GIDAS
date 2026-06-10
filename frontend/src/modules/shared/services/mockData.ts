export interface Distincion {
  id: number;
  fecha: string;
  descripcion: string;
  proyecto_investigacion_id?: number;
  proyecto?: {
    id: number;
    codigo: string;
    nombre: string;
  };
}

export interface Participacion {
  id: number;
  nombre_evento: string;
  forma_participacion: string;
  fecha: string;
  investigador_id: number;
  investigador?: string;
}

export interface Visitante {
  id: number;
  razon: string;
  fecha: string;
  grupo_utn_id: number;
  grupo?: string;
  procedencia: string;
  tipo_visita_id: number;
  tipo_visita?: {
    id: number;
    nombre: string;
  };
}

export const MOCK_DISTINCIONES: Distincion[] = [
  {
    id: 1,
    fecha: "2024-03-15",
    descripcion: "Premio a la Mejor Investigación 2024",
    proyecto_investigacion_id: 1,
    proyecto: { id: 1, codigo: "CAPNEE", nombre: "CAPNEE" }
  },
  {
    id: 2,
    fecha: "2024-06-20",
    descripcion: "Mención Honorífica por Publicación",
    proyecto_investigacion_id: 2,
    proyecto: { id: 2, codigo: "GMET", nombre: "GMET" }
  },
  {
    id: 3,
    fecha: "2024-09-10",
    descripcion: "Reconocimiento por Trayectoria Científica",
    proyecto_investigacion_id: undefined,
    proyecto: undefined
  },
  {
    id: 4,
    fecha: "2025-01-15",
    descripcion: "Premio Nacional de Ciencia y Tecnología",
    proyecto_investigacion_id: 1,
    proyecto: { id: 1, codigo: "CAPNEE", nombre: "CAPNEE" }
  },
  {
    id: 5,
    fecha: "2025-02-28",
    descripcion: "Distinción por Investigación Destacada",
    proyecto_investigacion_id: 3,
    proyecto: { id: 3, codigo: "TELEPARK", nombre: "TELEPARK" }
  },
];

export const MOCK_PARTICIPACIONES: Participacion[] = [
  {
    id: 1,
    nombre_evento: "Congreso Nacional de Ingeniería 2024",
    forma_participacion: "jurado",
    fecha: "2024-06-20",
    investigador_id: 1,
    investigador: "Juan Pérez"
  },
  {
    id: 2,
    nombre_evento: "Conferencia Internacional de IA",
    forma_participacion: "panelista",
    fecha: "2024-08-15",
    investigador_id: 2,
    investigador: "María García"
  },
  {
    id: 3,
    nombre_evento: "Evaluación de Proyectos FONCYT",
    forma_participacion: "evaluador",
    fecha: "2024-10-01",
    investigador_id: 1,
    investigador: "Juan Pérez"
  },
  {
    id: 4,
    nombre_evento: "Symposium de Investigación 2025",
    forma_participacion: "comite",
    fecha: "2025-01-20",
    investigador_id: 3,
    investigador: "Carlos López"
  },
  {
    id: 5,
    nombre_evento: "Jornadas Regionales de Ciencia",
    forma_participacion: "jurado",
    fecha: "2025-03-10",
    investigador_id: 2,
    investigador: "María García"
  },
];

export const MOCK_VISITANTES: Visitante[] = [
  {
    id: 1,
    razon: "Colaboración en investigación de energías renovables",
    fecha: "2024-08-10",
    grupo_utn_id: 1,
    grupo: "GIDAS",
    procedencia: "Universidad Nacional de La Plata",
    tipo_visita_id: 2,
    tipo_visita: { id: 2, nombre: "Del país" }
  },
  {
    id: 2,
    razon: "Intercambio académico - Doctorado",
    fecha: "2024-09-15",
    grupo_utn_id: 1,
    grupo: "GIDAS",
    procedencia: "Universidad de Chile",
    tipo_visita_id: 3,
    tipo_visita: { id: 3, nombre: "Del extranjero" }
  },
  {
    id: 3,
    razon: "Visita técnica - Equipamiento",
    fecha: "2024-11-20",
    grupo_utn_id: 1,
    grupo: "GIDAS",
    procedencia: "CONICET",
    tipo_visita_id: 2,
    tipo_visita: { id: 2, nombre: "Del país" }
  },
  {
    id: 4,
    razon: "Proyecto de investigación conjunto",
    fecha: "2025-01-10",
    grupo_utn_id: 1,
    grupo: "GIDAS",
    procedencia: "Universidad de São Paulo",
    tipo_visita_id: 3,
    tipo_visita: { id: 3, nombre: "Del extranjero" }
  },
  {
    id: 5,
    razon: "Capacitación en laboratorio",
    fecha: "2025-02-05",
    grupo_utn_id: 1,
    grupo: "GIDAS",
    procedencia: "Universidad de Buenos Aires",
    tipo_visita_id: 2,
    tipo_visita: { id: 2, nombre: "Del país" }
  },
];

export const MOCK_PROYECTOS = [
  { id: 1, codigo: "CAPNEE", nombre: "CAPNEE" },
  { id: 2, codigo: "GMET", nombre: "GMET" },
  { id: 3, codigo: "TELEPARK", nombre: "TELEPARK" },
];

export const MOCK_INVESTIGADORES = [
  { id: 1, nombre_apellido: "Juan Pérez" },
  { id: 2, nombre_apellido: "María García" },
  { id: 3, nombre_apellido: "Carlos López" },
  { id: 4, nombre_apellido: "Ana Martínez" },
  { id: 5, nombre_apellido: "Pedro Gómez" },
];

export const MOCK_GRUPOS_UTN = [
  { id: 1, nombre: "GIDAS" },
  { id: 2, nombre: "GIT" },
  { id: 3, nombre: "GIA" },
];

export const MOCK_TIPOS_VISITA = [
  { id: 2, nombre: "Del país" },
  { id: 3, nombre: "Del extranjero" },
];

export const MOCK_PROCEDENCIAS = [
  { id: 1, nombre: "Universidad Nacional de La Plata" },
  { id: 2, nombre: "Universidad de Chile" },
  { id: 3, nombre: "CONICET" },
  { id: 4, nombre: "Universidad de São Paulo" },
  { id: 5, nombre: "Universidad de Buenos Aires" },
  { id: 6, nombre: "Universidad Nacional de Córdoba" },
  { id: 7, nombre: "Instituto Tecnológico de Buenos Aires" },
];
