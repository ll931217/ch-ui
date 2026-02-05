import { createContext, useContext } from 'react';

interface TreeExpansionContextValue {
  isExpanded: (path: string) => boolean;
  toggleExpanded: (path: string) => void;
}

export const TreeExpansionContext = createContext<TreeExpansionContextValue | null>(null);

export const useTreeExpansion = (): TreeExpansionContextValue => {
  const context = useContext(TreeExpansionContext);
  if (!context) {
    throw new Error('useTreeExpansion must be used within TreeExpansionContext.Provider');
  }
  return context;
};
