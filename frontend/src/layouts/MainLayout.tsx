import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/common/Sidebar';
import Navbar from '../components/common/Navbar';
import { useSidebar } from '../contexts/useSidebar';

export default function MainLayout() {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-surface-950">
      <Sidebar />

      {/* Main content area — dynamically tracks sidebar width */}
      <motion.div
        animate={{ marginLeft: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Navbar />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="p-6"
        >
          <Outlet />
        </motion.main>
      </motion.div>
    </div>
  );
}
