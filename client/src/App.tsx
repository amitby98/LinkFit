import "./styles/App.css";
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { initializeApp } from "firebase/app";
import { getAuth, User } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import axios from "axios";
import SignUp from "./components/SignUp";
import HomePage from "./components/HomePage";
import { SetErrorContext } from "./contexts/ErrorContext";
import { httpService } from "./httpService";

// Define UserType enum
export enum UserType {
  Regular = "regular",
  Admin = "admin",
  Partner = "partner",
}

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

// Define types for user-related state
interface UserDetails {
  name?: string;
  email?: string;
}

interface ApiResponse {
  type: UserType;
  valid: boolean;
  details: UserDetails;
}

function App() {
  const [firebaseUser, loading] = useAuthState(auth);
  const [registered, setRegistered] = useState<boolean | undefined>(undefined);
  const [userType, setUserType] = useState<UserType>(UserType.Regular); // Added state for userType
  const [reqDone, setReqDone] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<UserDetails>({});
  console.log(user);

  // function signOut(navigate) {
  //   auth.signOut().then(() => {
  //     onAuthStateChanged(auth, () => {
  //       setRegistered(undefined);
  //       setReqDone(false);
  //       navigate("/");
  //     });
  //   });
  // }

  useEffect(() => {
    if (alertMessage) {
      setTimeout(() => {
        setAlertMessage(undefined);
      }, 4300);
    }
  }, [alertMessage]);

  useEffect(() => {
    if (reqDone) {
      httpService
        .get<ApiResponse>(`/auth/check`)
        .then(({ data }) => {
          setUser(data);
        })
        .catch(err => {
          // setErrorMessage(err.response?.data || "Error checking user status");
        });
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
      <Router>
        <SetErrorContext.Provider value={setErrorMessage}>
          <Routes>
            <Route path='/' element={<Check user={firebaseUser} loading={loading} registered={registered} userType={userType} />} />

            {/* User authentication routes */}
            <Route path='/home' element={<HomePage />} />
            <Route path='/sign-up' element={<SignUp setReqDone={setReqDone} />} />

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
      </Router>
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
  userType: UserType;
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
    return <Navigate to='/details' />;
  }

  return <Navigate to='/dashboard' />;
}

export default App;
