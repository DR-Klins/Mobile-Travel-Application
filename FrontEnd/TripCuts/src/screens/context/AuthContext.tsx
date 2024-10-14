import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the AuthContextProps interface
interface AuthContextProps {
  isAuthenticated: boolean;
  token: string | null;
  id: string | null;
  login: (token: string, newId: string) => void;
  logout: () => void;
  loading: boolean;
  getUserID: () => void;
  storedUserID: string | null;
}

// Create the AuthContext with default values
const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  token: null,
  id: null,
  login: () => {},
  logout: () => {},
  loading: true,
  getUserID: () => {},
  storedUserID: null,
});

// Define the type for AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storedUserID, setStoredUserID] = useState<string | null>(null);

  const login = async (newToken: string, newId: string) => {
    setToken(newToken);
    setIsAuthenticated(true);
    await AsyncStorage.setItem('token', newToken); // Persist the token
    setId(newId);
    await AsyncStorage.setItem('id', newId);
    setLoading(false);
  };

  const logout = async () => {
    try {
      setToken(null);
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('token'); // Remove the token from storage
      setLoading(false);
      setId(null);
      await AsyncStorage.removeItem('id');
    } catch (error) {
      console.error('Error removing token from AsyncStorage:', error);
    }
  };

  useEffect(() => {
    // Check for token on startup
    const checkToken = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkToken();
  }, []);
  const getUserID = async () => {
    try {
      const userID = await AsyncStorage.getItem('id');
      if (userID) {
        return userID;
      }
    } catch (error) {
      console.error('UserID not found:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        login,
        logout,
        loading,
        id,
        storedUserID,
        getUserID,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the AuthProvider and useAuth hook
export {AuthProvider, useAuth};
