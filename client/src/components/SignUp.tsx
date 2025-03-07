import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faEnvelope, faEye, faUser, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

interface SignUpProps {
  setReqDone: (value: boolean) => void;
}

function SignUp({ setReqDone }: SignUpProps) {
  const [mode, setMode] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [errorMessage, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
    username: "",
  });

  const passwordRefUp = useRef<HTMLInputElement>(null);
  const passwordRefIn = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const auth = getAuth();

  // Clear validation errors when switching modes
  useEffect(() => {
    setValidationErrors({
      email: "",
      password: "",
      username: "",
    });
    setError("");
  }, [mode]);

  const validateInputs = (isSignUp: boolean) => {
    const errors = {
      email: "",
      password: "",
      username: "",
    };

    // Email validation
    if (!emailInput) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(emailInput)) {
      errors.email = "Email is invalid";
    }

    // Password validation
    if (!passwordInput) {
      errors.password = "Password is required";
    } else if (passwordInput.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    // Username validation (only for sign up)
    if (isSignUp && !usernameInput) {
      errors.username = "Username is required";
    }

    setValidationErrors(errors);

    // Return true if no errors
    return !Object.values(errors).some(error => error);
  };

  const SignUpWithGoogle = () => {
    setReqDone(false);
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(async result => {
        const user = result.user;
        const email = user.email;
        const displayName = user.displayName || "";

        // Posting to your backend to register the user
        axios
          .post(`http://localhost:3001/api/user/register`, {
            email,
            username: displayName,
            authProvider: "google",
          })
          .then(() => {
            setReqDone(true);
            navigate("/profile"); // Redirect to profile page after success
          })
          .catch(err => {
            setError(err.response?.data?.message || "Error during registration");
            setReqDone(true);
          });
      })
      .catch(err => {
        setError(err.message);
        setReqDone(true);
      });
  };

  const SignUpWithPassword = () => {
    if (!validateInputs(true)) {
      return;
    }

    setReqDone(false);

    axios
      .post(`http://localhost:3001/api/auth/register`, {
        email: emailInput,
        password: passwordInput,
        username: usernameInput,
      })
      .then(response => {
        const token = (response.data as { token: string }).token;
        localStorage.setItem("token", token);

        setReqDone(true);
        navigate("/profile");
      })
      .catch(err => {
        setError(err.response?.data?.message || "Error during registration");
        setReqDone(true);
      });
  };

  const signInWithPasswordHandler = () => {
    if (!validateInputs(false)) {
      return;
    }

    setReqDone(false);
    axios
      .post(`http://localhost:3001/api/auth/login`, {
        email: emailInput,
        password: passwordInput,
      })
      .then(response => {
        const token = (response.data as { token: string }).token;
        localStorage.setItem("token", token);

        setReqDone(true);
        navigate("/profile"); // Redirect to profile page after registration
      })
      .catch(err => {
        setError(err.response?.data?.message || "Error during registration");
        setReqDone(true);
      });
  };

  return (
    <div className={`container ${mode}`}>
      <div className='forms-container'>
        <div className='signin-signup'>
          <form onSubmit={e => e.preventDefault()} className='sign-in-form'>
            <h2 className='title'>Sign in to LinkFit</h2>
            <div className={`input-field ${validationErrors.email ? "error" : ""}`}>
              <FontAwesomeIcon icon={faEnvelope} color='#acacac' className='fa-fa' />
              <input type='text' placeholder='Email' value={emailInput} onChange={e => setEmailInput(e.target.value)} />
              {validationErrors.email && (
                <div className='error-icon'>
                  <FontAwesomeIcon icon={faExclamationCircle} color='#ff3860' />
                </div>
              )}
            </div>
            {validationErrors.email && <span className='error-text'>{validationErrors.email}</span>}

            <div className={`input-field ${validationErrors.password ? "error" : ""}`}>
              <FontAwesomeIcon icon={faLock} color='#acacac' className='fa-fa' />
              <input type='password' placeholder='Password' ref={passwordRefIn} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
              {validationErrors.password && (
                <div className='error-icon'>
                  <FontAwesomeIcon icon={faExclamationCircle} color='#ff3860' />
                </div>
              )}
            </div>
            {validationErrors.password && <span className='error-text'>{validationErrors.password}</span>}

            <button
              type='button'
              name='show-password'
              className='show-password'
              onMouseDown={() => {
                if (passwordRefIn.current) passwordRefIn.current.type = "text";
              }}
              onMouseUp={() => {
                if (passwordRefIn.current) passwordRefIn.current.type = "password";
              }}
              onMouseOut={() => {
                if (passwordRefIn.current) passwordRefIn.current.type = "password";
              }}>
              Show Password <FontAwesomeIcon icon={faEye} />
            </button>

            <input type='submit' value='Login' className='btn solid' onClick={signInWithPasswordHandler} />

            <p className='social-text'>Or Sign in with Google</p>
            <div className='social-media'>
              <button className='social-icon' onClick={SignUpWithGoogle}>
                <FontAwesomeIcon icon={faGoogle} />
              </button>
            </div>
          </form>

          <form onSubmit={e => e.preventDefault()} className='sign-up-form'>
            <h2 className='title'>Create Account</h2>

            <div className={`input-field ${validationErrors.username ? "error" : ""}`}>
              <FontAwesomeIcon icon={faUser} color='#acacac' className='fa-fa' />
              <input type='text' placeholder='Username' value={usernameInput} onChange={e => setUsernameInput(e.target.value)} />
              {validationErrors.username && (
                <div className='error-icon'>
                  <FontAwesomeIcon icon={faExclamationCircle} color='#ff3860' />
                </div>
              )}
            </div>
            {validationErrors.username && <span className='error-text'>{validationErrors.username}</span>}

            <div className={`input-field ${validationErrors.email ? "error" : ""}`}>
              <FontAwesomeIcon icon={faEnvelope} color='#acacac' className='fa-fa' />
              <input type='email' placeholder='Email' value={emailInput} onChange={e => setEmailInput(e.target.value)} />
              {validationErrors.email && (
                <div className='error-icon'>
                  <FontAwesomeIcon icon={faExclamationCircle} color='#ff3860' />
                </div>
              )}
            </div>
            {validationErrors.email && <span className='error-text'>{validationErrors.email}</span>}

            <div className={`input-field ${validationErrors.password ? "error" : ""}`}>
              <FontAwesomeIcon icon={faLock} color='#acacac' className='fa-fa' />
              <input type='password' placeholder='Password' ref={passwordRefUp} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
              {validationErrors.password && (
                <div className='error-icon'>
                  <FontAwesomeIcon icon={faExclamationCircle} color='#ff3860' />
                </div>
              )}
            </div>
            {validationErrors.password && <span className='error-text'>{validationErrors.password}</span>}

            <button
              type='button'
              name='show-password'
              className='show-password'
              onMouseDown={() => {
                if (passwordRefUp.current) passwordRefUp.current.type = "text";
              }}
              onMouseUp={() => {
                if (passwordRefUp.current) passwordRefUp.current.type = "password";
              }}
              onMouseOut={() => {
                if (passwordRefUp.current) passwordRefUp.current.type = "password";
              }}>
              Show Password <FontAwesomeIcon icon={faEye} />
            </button>

            <input type='submit' className='btn' value='Sign up' onClick={SignUpWithPassword} />

            <p className='social-text'>Or Sign up with Google</p>
            <div className='social-media'>
              <button className='social-icon' onClick={SignUpWithGoogle}>
                <FontAwesomeIcon icon={faGoogle} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className='panels-container'>
        <div className='panel left-panel'>
          <div className='content'>
            <h3>New here?</h3>
            <p>Enter your personal details and start journey with us</p>
            <button className='btn transparent' id='sign-up-btn' onClick={() => setMode("sign-up-mode")}>
              Sign up
            </button>
            {errorMessage && <h2 className='error-message'>{errorMessage}</h2>}
          </div>
          <img src='img/log.svg' className='image' alt='' />
        </div>
        <div className='panel right-panel'>
          <div className='content'>
            <h3>One of us?</h3>
            <p>To keep connected with us please login with your personal info</p>
            <button className='btn transparent' id='sign-in-btn' onClick={() => setMode("")}>
              Sign in
            </button>
            {errorMessage && <h2 className='error-message'>{errorMessage}</h2>}
          </div>
          <img src='img/register.svg' className='image' alt='' />
        </div>
      </div>
    </div>
  );
}

export default SignUp;
