import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "./components/PublicLayout";
import { Landing } from "./pages/Landing";
import { RequestVisit } from "./pages/RequestVisit";
import { TrackStatus } from "./pages/TrackStatus";
import { PageView } from "./pages/PageView";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="request" element={<RequestVisit />} />
        <Route path="track" element={<TrackStatus />} />
        <Route path="page/:id" element={<PageView />} />
      </Route>
    </Routes>
  );
}
