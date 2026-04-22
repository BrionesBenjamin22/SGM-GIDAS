import { StrictMode } from "react";
import { createRoot } from "react-dom/client";


import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

import "./styles/index.css";

import AppLayout from "@/layouts/AppLayout";
import Home from "@/pages/Home";
import UctForm from "@/pages/UctForm";
import NotFound from "@/pages/NotFound";

// auth
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// nuevas páginas
import PersonalLanding from "@/pages/PersonalHome"; // título + botón Agregar + Volver
import Personal from "@/pages/PersonalForm";               // formulario de personal
import PersonalDetalle from "./pages/PersonalDetalle";
import ProyectosLanding from "./pages/ProyectosHome";
import ProyectosForm from "./pages/ProyectosForm";
import DocenciaLanding from "./pages/DocenciaHome";
import DocenciaForm from "./pages/DocenciaForm";
import DocenciaDetalle from "./pages/DocenciaDetalle";
import TrabajosReunionHome from "./pages/TrabajosReunionHome";
import TrabajosReunionForm from "./pages/TrabajosReunionForm";
import ErogacionesLanding from "./pages/ErogacionesHome";
import ErogacionesForm from "./pages/ErogacionesForm";
import ErogacionesDetalle from "./pages/ErogacionesDetalle";
import EquipamientoLanding from "./pages/EquipamientoHome";
import EquipamientoForm from "./pages/EquipamientoForm";
import EquipamientoDetalle from "./pages/EquipamientoDetalle";
import ObjetosLanding from "./pages/ObjetosFinHome";
import SearchPage from "./pages/SearchPage";
import DocumentacionDetalle from "./pages/DocumentacionDetalle";
import DocumentacionForm from "./pages/DocumentacionForm";
import DocumentacionLanding from "./pages/DocumentacionHome";
import PersonalForm from "@/pages/PersonalForm";
import ProyectosDetalle from "./pages/ProyectosDetalle";
import RegistrosPropiedadHome from "./pages/RegistrosPropiedadHome";
import RegistrosPropiedadForm from "./pages/RegistrosPropiedadForm";
import RegistrosPropiedadDetalle from "./pages/RegistrosPropiedadDetalle";
import PlanificacionGrupoLanding from "./pages/PlanificacionesGrupoHome";
import PlanificacionesGrupoForm from "./pages/PlanificacionesGrupoForm";
import PlanificacionGrupoDetalle from "./pages/PlanificacionGrupoDetalle";
import TrabajosReunionDetalle from "./pages/TrabajosReunionDetalle";
import TrabajosRevistasHome from "./pages/TrabajosRevistasHome";
import TrabajosRevistasForm from "./pages/TrabajosRevistasForm";
import TrabajosRevistasDetalle from "./pages/TrabajosRevistasDetalle";
import ArticulosDivulgacionLanding from "./pages/ArticulosDivulgacionHome";
import ArticulosDivulgacionForm from "./pages/ArticulosDivulgacionForm";
import ArticulosDivulgacionDetalle from "./pages/ArticulosDivulgacionDetalle";
import TransferenciasForm from "./pages/TransferenciasForm";
import TransferenciasDetalle from "./pages/TransferenciasDetalle";
import TransferenciasHome from "./pages/TransferenciasHome";
import DistincionesHome from "./pages/DistincionesHome";
import DistincionesForm from "./pages/DistincionesForm";
import DistincionesDetalle from "./pages/DistincionesDetalle";
import ParticipacionesHome from "./pages/ParticipacionesHome";
import ParticipacionesForm from "./pages/ParticipacionesForm";
import ParticipacionesDetalle from "./pages/ParticipacionesDetalle";
import VisitantesHome from "./pages/VisitantesHome";
import VisitantesForm from "./pages/VisitantesForm";
import VisitantesDetalle from "./pages/VisitantesDetalle";

// Gestión de usuarios
import CambiarPassword from "./pages/CambiarPassword";
import UsuariosHome from "./pages/UsuariosHome";
import UsuariosForm from "./pages/UsuariosForm";
import CatalogosHome from "./pages/CatalogosHome";
import MiPerfil from "./pages/MiPerfil";

// Definición de rutas
const router = createBrowserRouter([
  // rutas públicas (sin login)
  { path: "/login", element: <Login /> },
  { path: "/registro", element: <Register /> },

  // rutas protegidas (requieren estar logueado)
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },

      { path: "busqueda", element: <SearchPage /> },

      // UCT
      { path: "uct/nueva", element: <UctForm /> },

      // Personal
      { path: "personal", element: <PersonalLanding /> },   // landing  
      { path: "personal/nuevo", element: <PersonalForm /> },    // formulario
      { path: "personal/:rol/:id", element: <PersonalDetalle /> }, // detalle de personal
      { path: "personal/:rol/:id/editar", element: <PersonalForm /> }, // editar personal
      { path: "becarios/:id/editar", element: <PersonalForm /> }, // editar becario
      { path: "investigadores/:id/editar", element: <PersonalForm /> }, // editar investigador
      { path: "becarios/:id", element: <PersonalDetalle /> }, // detalle de becario
      { path: "investigadores/:id", element: <PersonalDetalle /> }, // detalle de investigador
      { path: "ptaa/:id", element: <PersonalDetalle /> }, // detalle de PTAA
      { path: "profesionales/:id", element: <PersonalDetalle /> }, // detalle de profesional
      // Redirecciones para mantener compatibilidad con URLs anteriores
      {
        path: "investigadores",
        element: <Navigate to="/personal?tipo=INVESTIGADOR" replace />
      },
      {
        path: "becarios",
        element: <Navigate to="/personal?tipo=BECARIO" replace />
      },
      {
        path: "ptaa",
        element: <Navigate to="/personal?tipo=PTAA" replace />
      },
      {
        path: "profesionales",
        element: <Navigate to="/personal?tipo=PROFESIONAL" replace />
      },


      // Proyectos
      { path: "proyectos", element: <ProyectosLanding /> },
      { path: "proyectos/nuevo", element: <ProyectosForm /> },
      { path: "proyectos/:id", element: <ProyectosDetalle /> },
      { path: "proyectos/editar/:id", element: <ProyectosForm /> },
      // Docencia
      { path: "docenciaInvestigador", element: <DocenciaLanding /> },
      { path: "docenciaInvestigador/nuevo", element: <DocenciaForm /> },
      { path: "docenciaInvestigador/:id", element: <DocenciaDetalle /> },
      { path: "docenciaInvestigador/:id/editar", element: <DocenciaForm /> },

      // Trabajos en reuniones científicas
      { path: "trabajosCientInv", element: <TrabajosReunionHome /> },
      { path: "trabajosCientInv/nuevo", element: <TrabajosReunionForm /> },

      //Actividades I+D+I
      //Registros de propiedad  e industrial
      { path: "registros-propiedad", element: <RegistrosPropiedadHome /> },
      { path: "registros-propiedad/nuevo", element: <RegistrosPropiedadForm /> },
      { path: "registros-propiedad/:id", element: <RegistrosPropiedadDetalle /> },
      { path: "registros-propiedad/:id/editar", element: <RegistrosPropiedadForm /> },


      //Trabajos en reuniones científicas
      { path: "trabajos-reunion", element: <TrabajosReunionHome /> },
      { path: "trabajos-reunion/nuevo", element: <TrabajosReunionForm /> },
      { path: "trabajos-reunion/:id", element: <TrabajosReunionDetalle /> },
      { path: "trabajos-reunion/:id/editar", element: <TrabajosReunionForm /> },

      //Trabajos en revistas
      { path: "trabajos-revistas", element: <TrabajosRevistasHome /> },
      { path: "trabajos-revistas/nuevo", element: <TrabajosRevistasForm /> },
      { path: "trabajos-revistas/:id", element: <TrabajosRevistasDetalle /> },
      { path: "trabajos-revistas/:id/editar", element: <TrabajosRevistasForm /> },

      //Artículos de divulgación
      { path: "articulos-divulgacion", element: <ArticulosDivulgacionLanding /> },
      { path: "articulos-divulgacion/nuevo", element: <ArticulosDivulgacionForm /> },
      { path: "articulos-divulgacion/:id", element: <ArticulosDivulgacionDetalle /> },
      { path: "articulos-divulgacion/:id/editar", element: <ArticulosDivulgacionForm /> },




      // Erogaciones / Compras
      { path: "erogaciones", element: <ErogacionesLanding /> },
      { path: "erogaciones/nuevo", element: <ErogacionesForm /> },
      { path: "erogaciones/:id", element: <ErogacionesDetalle /> },
      { path: "erogaciones/:id/editar", element: <ErogacionesForm /> },

      // Equipamiento
      { path: "equipamiento", element: <EquipamientoLanding /> },
      { path: "equipamiento/nuevo", element: <EquipamientoForm /> },
      { path: "equipamiento/:id", element: <EquipamientoDetalle /> },
      { path: "equipamiento/:id/editar", element: <EquipamientoForm /> },

      // Objetos y financiamiento
      { path: "objetosfinanciamiento", element: <ObjetosLanding /> },

      // Documentación
      { path: "documentacion", element: <DocumentacionLanding /> },
      { path: "documentacion/nuevo", element: <DocumentacionForm /> },
      { path: "documentacion/:id", element: <DocumentacionDetalle /> },
      { path: "documentacion/:id/editar", element: <DocumentacionForm /> },

      // Transferencias (Vinculación Socio-Productiva)
      { path: "transferencias", element: <TransferenciasHome /> },
      { path: "transferencias/nuevo", element: <TransferenciasForm /> },
      { path: "transferencias/:id", element: <TransferenciasDetalle /> },
      { path: "transferencias/:id/editar", element: <TransferenciasForm /> },

      // Actividades I+D+i
      { path: "distinciones", element: <DistincionesHome /> },
      { path: "distinciones/nuevo", element: <DistincionesForm /> },
      { path: "distinciones/:id", element: <DistincionesDetalle /> },
      { path: "distinciones/:id/editar", element: <DistincionesForm /> },

      { path: "participaciones", element: <ParticipacionesHome /> },
      { path: "participaciones/nuevo", element: <ParticipacionesForm /> },
      { path: "participaciones/:id", element: <ParticipacionesDetalle /> },
      { path: "participaciones/:id/editar", element: <ParticipacionesForm /> },

      { path: "visitantes", element: <VisitantesHome /> },
      { path: "visitantes/nuevo", element: <VisitantesForm /> },
      { path: "visitantes/:id", element: <VisitantesDetalle /> },
      { path: "visitantes/:id/editar", element: <VisitantesForm /> },
      

      // Gestión de Usuarios (solo admin)
      {
        path: "cambiar-password",
        element: (
          <ProtectedRoute>
            <CambiarPassword />
          </ProtectedRoute>
        ),
      },
      {
        path: "mi-perfil",
        element: (
          <ProtectedRoute>
            <MiPerfil />
          </ProtectedRoute>
        ),
      },
      {
        path: "usuarios",
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <UsuariosHome />
          </ProtectedRoute>
        ),
      },
      {
        path: "usuarios/nuevo",
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <UsuariosForm />
          </ProtectedRoute>
        ),
      },
      {
        path: "catalogos",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN", "GESTOR"]}>
            <CatalogosHome />
          </ProtectedRoute>
        ),
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

// Cliente de React Query
const queryClient = new QueryClient();

// Renderizado de la aplicación
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </QueryClientProvider>
);
