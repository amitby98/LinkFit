import "./styles/App.css";
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth, User } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import SignUp from "./components/SignUp";
import HomePage from "./components/HomePage";
import { SetErrorContext } from "./contexts/ErrorContext";
import { httpService } from "./httpService";
import Profile from "./components/Profile";

const firebaseConfig = {
  apiKey: "AIzaSyBdZM4I2vlLtKPzIdl810TiFE5UxI6PJ30",
  authDomain: "linkfit-85c85.firebaseapp.com",
  projectId: "linkfit-85c85",
  storageBucket: "linkfit-85c85.firebasestorage.app",
  messagingSenderId: "491586424612",
  appId: "1:491586424612:web:a7eb18024584c14cf9edb1",
  measurementId: "G-F45BPMCT0Z",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export interface UserDetails {
  username: string;
  bio?: string;
  email: string;
  profilePicture: string;
  _id: string;
}

function App() {
  const [firebaseUser, loading] = useAuthState(auth);
  const [registered, setRegistered] = useState<boolean | undefined>(undefined);
  const [reqDone, setReqDone] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<UserDetails | undefined>(undefined);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (alertMessage) {
      setTimeout(() => {
        setAlertMessage(undefined);
      }, 4300);
    }
  }, [alertMessage]);

  const signOut = async () => {
    try {
      await auth.signOut();
      navigate("/sign-up");
      localStorage.removeItem("token");
      setUser(undefined);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const refetchUser = () => {
    httpService
      .get<UserDetails>(`/auth/check`)
      .then(({ data }) => {
        setUser(data);
        setIsLoadingUser(false);
      })
      .catch(err => {
        // setErrorMessage(err.response?.data || "Error checking user status");
        setIsLoadingUser(false);
      });
  };

  useEffect(() => {
    if (reqDone) {
      refetchUser();
    }
  }, [firebaseUser, loading, reqDone]);

  // Separate useEffect for error message timer
  useEffect(() => {
    if (errorMessage) {
      setTimeout(() => {
        setErrorMessage(undefined);
      }, 4300);
    }
  }, [errorMessage]);

  window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <SetErrorContext.Provider value={setErrorMessage}>
        <Routes>
          <Route path='/' element={<Check user={firebaseUser} loading={loading} registered={registered} />} />

          {/* User authentication routes */}
          <Route path='/home' element={<HomePage />} />
          <Route path='/sign-up' element={<SignUp setReqDone={setReqDone} />} />
          <Route path='/profile' element={<Profile user={user} isLoadingUser={isLoadingUser} refetchUser={refetchUser} signOut={signOut} />} />

          {/* Add the details route */}
          <Route path='/details' element={firebaseUser ? <SignUp setReqDone={setReqDone} /> : <Navigate to='/' />} />

          {/* Dashboard route */}
          <Route
            path='/dashboard'
            element={
              firebaseUser && registered ? (
                <div>Dashboard Page</div> // Replace with actual dashboard component
              ) : (
                <Navigate to='/' />
              )
            }
          />

          <Route path='*' element={<Navigate to='/' />} />
        </Routes>
      </SetErrorContext.Provider>
      {alertMessage && <div className='alert-message alert-popup'>{alertMessage}</div>}
      {errorMessage && <div className='error-message alert-popup'>{errorMessage}</div>}
    </div>
  );
}

// Corrected Check component
interface CheckProps {
  user: User | null | undefined;
  loading: boolean;
  registered: boolean | undefined;
}

function Check({ user, loading, registered }: CheckProps) {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to='/home' />;
  }

  if (registered === undefined) {
    return <div>Checking registration status...</div>;
  }

  if (registered === false) {
    return <Navigate to='/profile' />;
  }

  return <Navigate to='/dashboard' />;
}

export default App;
