import { Routes, Route, Navigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { AppLayout } from "@/components/layout/app-layout";
import { EmptyState } from "@/components/shared/empty-state";
import { PageView } from "@/components/pages/page-view";

function WelcomeRedirect() {
  const latestPage = useLiveQuery(() =>
    db.pages.orderBy("updatedAt").reverse().first()
  );

  // Still loading from IndexedDB
  if (latestPage === undefined) return null;

  // No pages exist — show the welcome empty state
  if (!latestPage) return <EmptyState />;

  // Redirect to the most recently updated page
  return <Navigate to={`/page/${latestPage.id}`} replace />;
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<WelcomeRedirect />} />
        <Route path="page/:pageId" element={<PageView />} />
      </Route>
    </Routes>
  );
}

export default App;
