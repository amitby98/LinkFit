import "./App.scss";
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import SignUp from "./components/SignUp/SignUp";
import HomePage from "./components/HomePage/HomePage";
import { SetErrorContext } from "./contexts/ErrorContext";
import { httpService } from "./httpService";
import Profile from "./components/Profile/Profile";
import Dashboard from "./components/Dashboard/Dashboard";
import ExerciseChallenge from "./components/Challenge/ExerciseChallenge";
import Favorites from "./components/Favorites/Favorites";

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
  const [alertMessage, setAlertMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<UserDetails | undefined>(undefined);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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
      navigate("/");
      localStorage.removeItem("token");
      setUser(undefined);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const refetchUser = (): Promise<void> => {
    if (!localStorage.getItem("token")) {
      return Promise.resolve();
    }
    return new Promise((res, rej) => {
      httpService
        .get<UserDetails>(`/auth/check`)
        .then(({ data }) => {
          setUser(data);
          setIsLoadingUser(false);
          if (location.pathname === "/") {
            navigate("/dashboard");
          }
          res();
        })
        .catch(err => {
          navigate("/home");
          rej();
          setErrorMessage(JSON.stringify(err.response?.data) || "Error checking user status");
        });
    });
  };

  useEffect(() => {
    refetchUser();
  }, []);

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
    <div className='main-app'>
      <SetErrorContext.Provider value={setErrorMessage}>
        <Routes>
          <Route path='/exercises' element={<ExerciseChallenge user={user} />} />
          <Route path='/' element={<HomePage />} />
          <Route path='/home' element={<HomePage />} />
          <Route path='/sign-up' element={<SignUp refetchUser={refetchUser} />} />
          <Route path='/profile' element={<Profile user={user} isLoadingUser={isLoadingUser} refetchUser={refetchUser} signOut={signOut} />} />
          <Route path='/profile/:userId' element={<Profile user={user} isLoadingUser={isLoadingUser} refetchUser={refetchUser} signOut={signOut} />} />
          <Route path='/dashboard' element={<Dashboard user={user} />} />
          <Route path='/favorites' element={<Favorites user={user} isLoadingUser={isLoadingUser} />} />
          <Route path='*' element={<Navigate to='/' />} />
        </Routes>
      </SetErrorContext.Provider>
      {alertMessage && <div className='alert-message alert-popup'>{alertMessage}</div>}
      {errorMessage && <div className='error-message alert-popup'>{errorMessage}</div>}
    </div>
  );
}

export default App;
