import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="grid place-items-center py-20">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">404 — Página no encontrada</h1>
        <Link to="/" className="inline-block mt-4 underline">Volver al inicio</Link>
      </div>
    </section>
  );
}