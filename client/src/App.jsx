import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Layout from './components/Layout';

// Pages
import Landing from './pages/Landing';
import Overview from './pages/Overview';
import Upload from './pages/Upload';
import Gallery from './pages/Gallery';
import AssetDetail from './pages/AssetDetail';
import Search from './pages/Search';
import Compare from './pages/Compare';
import MapPage from './pages/Map';
import Reports from './pages/Reports';
import Story from './pages/Story';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Landing Showcase */}
          <Route path="/" element={<Landing />} />

          {/* App Core Views under Layout */}
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="upload" element={<Upload />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="assets/:id" element={<AssetDetail />} />
            <Route path="search" element={<Search />} />
            <Route path="compare" element={<Compare />} />
            <Route path="map" element={<MapPage />} />
            <Route path="reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          {/* Public Shareable Impact Story (Standalone Editorial Canvas) */}
          <Route path="/story/:slug" element={<Story />} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </AuthProvider>
  );
}
