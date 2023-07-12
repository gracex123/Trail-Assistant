import React from "react";
import * as ReactDOMClient from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Trails from "./components/Trails";
import TrailDetail from "./components/TrailDetail";
import Wishlist from "./components/Wishlist";
import Profile from "./components/Profile";
import NotFound from "./components/NotFound";

import Home from "./components/Home";
import VerifyUser from "./components/VerifyUser";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { AuthTokenProvider } from "./AuthTokenContext";
import "./style/normalize.css";
import "./style/index.css";

const container = document.getElementById("root");

//add "read:trailitem"
const requestedScopes = [
  "profile",
  "email",
  "read:wishitem",
  "read:user",
  "edit:wishitem",
  "edit:user",
  "delete:wishitem",
  "delete:user",
  "write:user",
  "write:wishitem",
];

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

const root = ReactDOMClient.createRoot(container);

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/verify-user`,
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: requestedScopes.join(" "),
      }}
    >
      <AuthTokenProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trails" element={<Trails />} />
            <Route path="/trails/:trailId" element={<TrailDetail />} />
            <Route path="/verify-user" element={<VerifyUser />} />
            <Route
              path="app"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Profile />} />
              <Route path="wishlist" element={<Wishlist />} />


            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthTokenProvider>
    </Auth0Provider>
  </React.StrictMode>
);
