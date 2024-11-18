import ReactDOM from "react-dom/client";
import Home from "./Home";
import AlertManager from "./dawn-ui/components/AlertManager";
import ContextMenuManager from "./dawn-ui/components/ContextMenuManager";
import { loadTheme } from "./dawn-ui";
import "./dawn-ui/index";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ConfirmRegister from "./Pages/ConfirmRegister";
import Welcome from "./Pages/Welcome";
import Login from "./Pages/Login";
import Kairo from "./App/Kairo";

loadTheme();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/app",
    element: <Kairo />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/auth/confirm_register",
    element: <ConfirmRegister />,
  },
  {
    path: "/welcome",
    element: <Welcome />,
  },
]);

root.render(
  <>
    <AlertManager />
    <ContextMenuManager />
    <RouterProvider router={router} />
  </>
);
