import ReactDOM from "react-dom/client";
import Home from "./Home";
import AlertManager from "./dawn-ui/components/AlertManager";
import ContextMenuManager from "./dawn-ui/components/ContextMenuManager";
import { loadTheme, setTheme, themeSetBackground } from "./dawn-ui";
import "./dawn-ui/index";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ConfirmRegister from "./Pages/ConfirmRegister";
import Welcome from "./Pages/Welcome";
import Login from "./Pages/Login";
import Kairo from "./App/Kairo";
import { FlyoutManager } from "./dawn-ui/components/Flyout";

let t = localStorage.getItem("kairo-theme");
if (t) setTheme(t as any);
if (localStorage.getItem("kairo-background-url"))
  themeSetBackground(localStorage.getItem("kairo-background-url") as string);
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
    <FlyoutManager />
    <ContextMenuManager />
    <RouterProvider router={router} />
  </>
);
