import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Test credentials for development
const TEST_CREDENTIALS = {
  username: 'test',
  password: 'test123',
  user: {
    id: 1,
    username: 'test',
    email: 'test@example.com'
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // For testing, consider the user logged in if token exists
          setUser(TEST_CREDENTIALS.user);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // For testing purposes
      if (username === TEST_CREDENTIALS.username && password === TEST_CREDENTIALS.password) {
        const mockToken = 'test-token-123';
        localStorage.setItem('token', mockToken);
        setUser(TEST_CREDENTIALS.user);
        navigate('/');
        return;
      }
      throw new Error('Invalid credentials');
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string) => {
    try {
      // For testing purposes
      const mockToken = 'test-token-123';
      const newUser = {
        id: Date.now(),
        username,
        email
      };
      localStorage.setItem('token', mockToken);
      setUser(newUser);
      navigate('/');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 