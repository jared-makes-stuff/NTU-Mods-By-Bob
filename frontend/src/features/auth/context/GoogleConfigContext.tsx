"use client";

import React, { createContext, useContext } from "react";

interface GoogleConfigContextType {
  isReady: boolean;
}

const GoogleConfigContext = createContext<GoogleConfigContextType>({ isReady: false });

export const useGoogleConfig = () => useContext(GoogleConfigContext);

export function GoogleConfigProvider({ 
  children, 
  isReady 
}: { 
  children: React.ReactNode; 
  isReady: boolean; 
}) {
  return (
    <GoogleConfigContext.Provider value={{ isReady }}>
      {children}
    </GoogleConfigContext.Provider>
  );
}
