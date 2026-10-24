import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Spinner } from './components/ui.jsx';
import StoreLayout from './layouts/StoreLayout.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import MenuPage from './pages/MenuPage.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Account from './pages/Account.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';
import Dashboard from './admin/pages/Dashboard.jsx';
import AdminOrders from './admin/pages/AdminOrders.jsx';
import MenuManager from './admin/pages/MenuManager.jsx';
import Coupons from './admin/pages/Coupons.jsx';
import Riders from './admin/pages/Riders.jsx';
import Customers from './admin/pages/Customers.jsx';
import Settings from './admin/pages/Settings.jsx';

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <img src="/brand/mark.svg" alt="" className="h-12 w-12 animate-pulse" />
        <Spinner />
        <p className="text-[12px] text-muted">Setting the table…</p>
      </div>
    </div>
  );
}

function Protected({ admin = false }) {
  const { user, isAdmin, booting } = useAuth();
  const location = useLocation();
  if (booting) return <FullScreenLoader />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

function GuestOnly() {
  const { user, booting } = useAuth();
  if (booting) return <FullScreenLoader />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<MenuPage />} />
        <Route element={<Protected />}>
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:code" element={<OrderDetail />} />
          <Route path="account" element={<Account />} />
        </Route>
      </Route>

      <Route element={<GuestOnly />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      <Route element={<Protected admin />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="riders" element={<Riders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
