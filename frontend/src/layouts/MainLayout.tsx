import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-surface-950">
      <Sidebar />

      {/* Main content area — offset by sidebar width */}
      <div className="ml-[240px] transition-all duration-200">
        <Navbar />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="p-6"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
