import { createContext, useContext } from 'react';
export const AppContext = createContext({ session: null, profile: null, refreshProfile: async () => {} });
export const useApp = () => useContext(AppContext);
