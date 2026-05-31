"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const TERMS_VERSION = "1.0.0";
const STORAGE_KEY = "portfolio-agreement-accepted";
const VERSION_KEY = "portfolio-agreement-version";

interface PortfolioAgreementContextType {
  isAccepted: boolean;
  shouldShowModal: boolean;
  acceptAgreement: () => void;
  declineAgreement: () => void;
  openModal: () => void;
  closeModal: () => void;
}

const PortfolioAgreementContext = createContext<
  PortfolioAgreementContextType | undefined
>(undefined);

export function PortfolioAgreementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAccepted, setIsAccepted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const storedAccepted = localStorage.getItem(STORAGE_KEY);
      const storedVersion = localStorage.getItem(VERSION_KEY);
      return storedAccepted === "true" && storedVersion === TERMS_VERSION;
    } catch {
      return false;
    }
  });
  const [shouldShowModal, setShouldShowModal] = useState(false);

  const acceptAgreement = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      localStorage.setItem(VERSION_KEY, TERMS_VERSION);
      setIsAccepted(true);
      setShouldShowModal(false);
    } catch (error) {
      console.error("Failed to save portfolio agreement acceptance:", error);
    }
  }, []);

  const declineAgreement = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(VERSION_KEY);
      setIsAccepted(false);
      setShouldShowModal(false);
    } catch (error) {
      console.error("Failed to clear portfolio agreement acceptance:", error);
    }
  }, []);

  const openModal = useCallback(() => {
    setShouldShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShouldShowModal(false);
  }, []);

  return (
    <PortfolioAgreementContext.Provider
      value={{
        isAccepted,
        shouldShowModal,
        acceptAgreement,
        declineAgreement,
        openModal,
        closeModal,
      }}
    >
      {children}
    </PortfolioAgreementContext.Provider>
  );
}

export function usePortfolioAgreement() {
  const context = useContext(PortfolioAgreementContext);
  if (context === undefined) {
    throw new Error(
      "usePortfolioAgreement must be used within PortfolioAgreementProvider"
    );
  }
  return context;
}
