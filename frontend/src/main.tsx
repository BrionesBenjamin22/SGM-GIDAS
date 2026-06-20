import { StrictMode } from "react";
import { createRoot } from "react-dom/client";


import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

import "./styles/index.css";

import AppLayout from "@/layouts/AppLayout";
import Home from "@/modules/dashboard/pages/Home";
import UctForm from "@/modules/grupo/pages/UctForm";
import NotFound from "@/modules/shared/pages/NotFound";

// auth
import Login from "@/modules/auth/pages/Login";
import Register from "@/modules/auth/pages/Register";
import Landing from "@/modules/auth/pages/Landing";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// nuevas páginas
import PersonalLanding from "@/modules/personal/pages/PersonalHome"; // título + botón Agregar + Volver
import Personal from "@/modules/personal/pages/PersonalForm";               // formulario de personal
import PersonalDetalle from "@/modules/personal/pages/PersonalDetalle";
import ProyectosLanding from "@/modules/proyectos/pages/ProyectosHome";
import ProyectosForm from "@/modules/proyectos/pages/ProyectosForm";
import DocenciaLanding from "@/modules/produccion/pages/DocenciaHome";
import DocenciaForm from "@/modules/produccion/pages/DocenciaForm";
import DocenciaDetalle from "@/modules/produccion/pages/DocenciaDetalle";
import TrabajosReunionHome from "@/modules/produccion/pages/TrabajosReunionHome";
import TrabajosReunionForm from "@/modules/produccion/pages/TrabajosReunionForm";
import ErogacionesLanding from "@/modules/recursos/pages/ErogacionesHome";
import ErogacionesForm from "@/modules/recursos/pages/ErogacionesForm";
import ErogacionesDetalle from "@/modules/recursos/pages/ErogacionesDetalle";
import EquipamientoLanding from "@/modules/recursos/pages/EquipamientoHome";
import EquipamientoForm from "@/modules/recursos/pages/EquipamientoForm";
import EquipamientoDetalle from "@/modules/recursos/pages/EquipamientoDetalle";
import ObjetosLanding from "@/modules/catalogos/pages/ObjetosFinHome";
import SearchPage from "@/modules/search/pages/SearchPage";
import DocumentacionDetalle from "@/modules/produccion/pages/DocumentacionDetalle";
import DocumentacionForm from "@/modules/produccion/pages/DocumentacionForm";
import DocumentacionLanding from "@/modules/produccion/pages/DocumentacionHome";
import PersonalForm from "@/modules/personal/pages/PersonalForm";
import ProyectosDetalle from "@/modules/proyectos/pages/ProyectosDetalle";
import RegistrosPropiedadHome from "@/modules/produccion/pages/RegistrosPropiedadHome";
import RegistrosPropiedadForm from "@/modules/produccion/pages/RegistrosPropiedadForm";
import RegistrosPropiedadDetalle from "@/modules/produccion/pages/RegistrosPropiedadDetalle";
import PlanificacionGrupoLanding from "@/modules/grupo/pages/PlanificacionesGrupoHome";
import PlanificacionesGrupoForm from "@/modules/grupo/pages/PlanificacionesGrupoForm";
import PlanificacionGrupoDetalle from "@/modules/grupo/pages/PlanificacionGrupoDetalle";
import TrabajosReunionDetalle from "@/modules/produccion/pages/TrabajosReunionDetalle";
import TrabajosRevistasHome from "@/modules/produccion/pages/TrabajosRevistasHome";
import TrabajosRevistasForm from "@/modules/produccion/pages/TrabajosRevistasForm";
import TrabajosRevistasDetalle from "@/modules/produccion/pages/TrabajosRevistasDetalle";
import ArticulosDivulgacionLanding from "@/modules/produccion/pages/ArticulosDivulgacionHome";
import ArticulosDivulgacionForm from "@/modules/produccion/pages/ArticulosDivulgacionForm";
import ArticulosDivulgacionDetalle from "@/modules/produccion/pages/ArticulosDivulgacionDetalle";
import TransferenciasForm from "@/modules/transferencia/pages/TransferenciasForm";
import TransferenciasDetalle from "@/modules/transferencia/pages/TransferenciasDetalle";
import TransferenciasHome from "@/modules/transferencia/pages/TransferenciasHome";
import DistincionesHome from "@/modules/produccion/pages/DistincionesHome";
import DistincionesForm from "@/modules/produccion/pages/DistincionesForm";
import DistincionesDetalle from "@/modules/produccion/pages/DistincionesDetalle";
import ParticipacionesHome from "@/modules/proyectos/pages/ParticipacionesHome";
import ParticipacionesForm from "@/modules/proyectos/pages/ParticipacionesForm";
import ParticipacionesDetalle from "@/modules/proyectos/pages/ParticipacionesDetalle";
import VisitantesHome from "@/modules/grupo/pages/VisitantesHome";
import VisitantesForm from "@/modules/grupo/pages/VisitantesForm";
import VisitantesDetalle from "@/modules/grupo/pages/VisitantesDetalle";
import MemoriasHome from "@/modules/memorias/pages/MemoriasHome";
import MemoriaForm from "@/modules/memorias/pages/MemoriaForm";
import MemoriaDetalle from "@/modules/memorias/pages/MemoriaDetalle";
import MemoriaVersionDetalle from "@/modules/memorias/pages/MemoriaVersionDetalle";

// Gestión de usuarios
import CambiarPassword from "@/modules/auth/pages/CambiarPassword";
import UsuariosHome from "@/modules/auth/pages/UsuariosHome";
import UsuariosForm from "@/modules/auth/pages/UsuariosForm";
import CatalogosHome from "@/modules/catalogos/pages/CatalogosHome";
import MiPerfil from "@/modules/auth/pages/MiPerfil";

// Definición de rutas
const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  // rutas públicas (sin login)
  { path: "/login", element: <Login /> },
  { path: "/registro", element: <Register /> },

  // rutas protegidas (requieren estar logueado)
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "inicio", element: <Home /> },

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

      // Memorias
      { path: "memorias", element: <MemoriasHome /> },
      {
        path: "memorias/nueva",
        element: (
          <ProtectedRoute requiredRole="ADMIN">
            <MemoriaForm />
          </ProtectedRoute>
        ),
      },
      { path: "memorias/:id", element: <MemoriaDetalle /> },
      {
        path: "memorias/:id/versiones/:versionId",
        element: <MemoriaVersionDetalle />,
      },
      

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
