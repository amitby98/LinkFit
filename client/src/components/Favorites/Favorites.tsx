import { UserDetails } from "../../App";
import NavBar from "../NavBar/NavBar";
import "./Favorites.css";
import PostGrid from "../PostGrid/PostGrid";

interface FavoritesProps {
  user: UserDetails | undefined;
  isLoadingUser: boolean;
}

function Favorites({ user, isLoadingUser }: FavoritesProps) {
  if (isLoadingUser) {
    return <div className='loading-container'>Loading...</div>;
  }

  return (
    <>
      <NavBar user={user} />
      <div className='favorites-page'>
        <div className='favorites-header'>
          <h1>Your Favorites</h1>
          <p>Posts you've bookmarked</p>
        </div>
        <PostGrid user={user} isLoadingUser={isLoadingUser} type='favorites' />
      </div>
    </>
  );
}

export default Favorites;
