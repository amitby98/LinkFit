import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faCamera, faSave } from "@fortawesome/free-solid-svg-icons";
import "../styles/Profile.css";

interface UserProfile {
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
}

function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        // User is signed in, fetch profile data
        fetchUserProfile(firebaseUser.uid);
      } else {
        // User is signed out, redirect to login
        navigate("/sign-up");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      const token = await auth.currentUser?.getIdToken();

      const response = await axios.get(`http://localhost:3001/api/user/profile/${userId}`, {
        headers: {
          Authorization: `${token}`,
        },
      });

      setUser(response.data as UserProfile);
      setEditedProfile(response.data as UserProfile);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile data");
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [name]: value,
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const userId = auth.currentUser?.uid;

      const profileData = { ...editedProfile };

      // If there's a new profile picture, upload it first
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append("profilePicture", profilePictureFile);

        const uploadResponse = await axios.post<{ imageUrl: string }>(`http://localhost:3001/api/user/upload-profile-picture/${userId}`, formData, {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        // Update the profile data with the new image URL
        profileData.profilePicture = uploadResponse.data.imageUrl;
      }

      // Update the user profile
      await axios.put(`http://localhost:3001/api/user/update-profile/${userId}`, profileData, {
        headers: {
          Authorization: `${token}`,
        },
      });

      // Update the local state
      setUser(profileData);
      setIsEditing(false);
      setError("");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile");
    }
  };

  const toggleEditMode = () => {
    if (isEditing) {
      // Cancel editing - reset to original values
      setEditedProfile(user);
      setPreviewUrl(null);
      setProfilePictureFile(null);
    }
    setIsEditing(!isEditing);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate("/sign-up");
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out");
    }
  };

  if (isLoading) {
    return <div className='loading-container'>Loading profile...</div>;
  }

  return (
    <div className='profile-container'>
      <div className='profile-header'>
        <h1>User Profile</h1>
        <div className='profile-actions'>
          <button className='btn' onClick={toggleEditMode}>
            <FontAwesomeIcon icon={isEditing ? faSave : faEdit} />
            {isEditing ? " Cancel" : " Edit Profile"}
          </button>
          <button className='btn logout-btn' onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      {error && <div className='error-message'>{error}</div>}

      <div className='profile-content'>
        <div className='profile-picture-container'>
          {isEditing ? (
            <>
              <div className='profile-picture-edit'>
                <img src={previewUrl || editedProfile?.profilePicture || "/img/default-profile.png"} alt='Profile' className='profile-picture' />
                <label className='profile-picture-upload'>
                  <FontAwesomeIcon icon={faCamera} />
                  <input type='file' accept='image/*' onChange={handleFileChange} style={{ display: "none" }} />
                </label>
              </div>
            </>
          ) : (
            <img src={user?.profilePicture || "/img/default-profile.png"} alt='Profile' className='profile-picture' />
          )}
        </div>

        <div className='profile-details'>
          {isEditing ? (
            <div className='profile-form'>
              <div className='form-group'>
                <label>Username</label>
                <input type='text' name='username' value={editedProfile?.username || ""} onChange={handleInputChange} />
              </div>
              <div className='form-group'>
                <label>Email</label>
                <input type='email' name='email' value={editedProfile?.email || ""} onChange={handleInputChange} disabled />
                <small>Email cannot be changed</small>
              </div>
              <div className='form-group'>
                <label>Bio</label>
                <textarea name='bio' value={editedProfile?.bio || ""} onChange={handleInputChange} rows={4} />
              </div>
              <button className='btn save-btn' onClick={handleSaveProfile}>
                <FontAwesomeIcon icon={faSave} /> Save Changes
              </button>
            </div>
          ) : (
            <>
              <div className='profile-info'>
                <h2>{user?.username}</h2>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                {user?.bio && (
                  <div className='bio'>
                    <h3>Bio</h3>
                    <p>{user?.bio}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
