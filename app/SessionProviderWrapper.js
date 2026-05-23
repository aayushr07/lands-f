// app/SessionProviderWrapper.js
"use client"; // This line makes this component a client component

import { SessionProvider } from "next-auth/react";

const SessionProviderWrapper = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default SessionProviderWrapper;
