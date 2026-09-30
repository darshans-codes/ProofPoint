import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { UploadCloud, Menu, X, ArrowUpRight, ShieldCheck } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Overview', path: '/app' },
  { label: 'Upload', path: '/app/upload' },
  { label: 'Gallery', path: '/app/gallery' },
  { label: 'Search', path: '/app/search' },
  { label: 'Compare', path: '/app/compare' },
  { label: 'Map', path: '/app/map' },
  { label: 'Reports', path: '/app/reports' },
];

export default function Navbar() {
  const { projects, selectedProjectId, setSelectedProjectId } = useProject();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isStoryPage = location.pathname.startsWith('/story/');
  if (isStoryPage) return null; // Story page has no app chrome

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F5F2EB] border-b border-[#D8D2C4]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Wordmark & Evidence Lab tag */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-baseline gap-2 group">
            <span className="font-serif text-2xl font-semibold tracking-tight text-[#1B221D] group-hover:text-[#2F5D46] transition-colors">
              ProofPoint
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-[#5F6A61] border-l border-[#D8D2C4] pl-2 hidden sm:inline-block">
              EVIDENCE LAB
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#D8D2C4]">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === '/app'
                  ? location.pathname === '/app'
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`group relative px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#1B221D] font-semibold'
                      : 'text-[#5F6A61] hover:text-[#1B221D]'
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0 left-3 right-3 h-[2px] origin-left bg-[#1B221D] transition-transform duration-300 ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Right side controls: Project Selector & Intake Action */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Project Selector */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#5F6A61] uppercase tracking-wider">PROJECT:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#FBF9F4] text-[#1B221D] border border-[#D8D2C4] rounded-[2px] px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-[#2F5D46] cursor-pointer"
            >
              <option value="all">ALL ACTIVE PROJECTS</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Intake Evidence Button */}
          <Link
            to="/app/upload"
            className="inline-flex items-center gap-1.5 bg-[#2F5D46] hover:bg-[#244A38] text-[#FBF9F4] text-xs font-medium px-3.5 py-1.5 rounded-[2px] transition-colors shadow-none"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Intake Evidence</span>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/app/upload"
            className="p-1.5 bg-[#2F5D46] text-[#FBF9F4] rounded-[2px]"
            title="Upload"
          >
            <UploadCloud className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#1B221D] hover:bg-[#FBF9F4] border border-[#D8D2C4] rounded-[2px]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#D8D2C4] bg-[#FBF9F4] px-4 py-4 space-y-3">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === '/app'
                  ? location.pathname === '/app'
                  : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 text-sm font-medium rounded-[2px] transition-colors ${
                    isActive
                      ? 'bg-[#E8E4DA] text-[#1B221D] font-semibold'
                      : 'text-[#5F6A61] hover:text-[#1B221D]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#D8D2C4] flex flex-col gap-2">
            <span className="text-xs font-mono text-[#5F6A61] uppercase tracking-wider">
              PROJECT CONTEXT:
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setMobileMenuOpen(false);
              }}
              className="bg-[#F5F2EB] text-[#1B221D] border border-[#D8D2C4] rounded-[2px] p-2 text-xs font-mono"
            >
              <option value="all">ALL ACTIVE PROJECTS</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
}
