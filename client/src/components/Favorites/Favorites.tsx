import { useState, useEffect } from "react";
import { httpService } from "../../httpService";
import { UserDetails } from "../../App";
import NavBar from "../NavBar/NavBar";
import { Post } from "../Post/Post";
import { IPost } from "../Dashboard/Dashboard";
import "./Favorites.css";

interface FavoritesProps {
  user: UserDetails | undefined;
  isLoadingUser: boolean;
}

function Favorites({ user, isLoadingUser }: FavoritesProps) {
  const [favoritePosts, setFavoritePosts] = useState<IPost[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [error, setError] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isLoadingUser && user?._id) {
      fetchFavoritePosts();
    }
  }, [user?._id, isLoadingUser]);

  const fetchFavoritePosts = async () => {
    setIsLoadingFavorites(true);
    try {
      if (!user?._id) {
        setIsLoadingFavorites(false);
        return;
      }

      const { data } = await httpService.get<IPost[]>(`/post/favorites`);
      setFavoritePosts(data);
    } catch (error) {
      console.error("Error fetching favorite posts:", error);
      setError("Failed to load favorite posts");
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await httpService.post(`/post/${postId}/like`);

      // Update favorites states
      const updateFavoritesState = (currentPosts: IPost[]) =>
        currentPosts.map(post => {
          if (post._id === postId) {
            const userId = user?._id || "";
            // Toggle like
            if (post.likes.includes(userId)) {
              return { ...post, likes: post.likes.filter(id => id !== userId) };
            } else {
              return { ...post, likes: [...post.likes, userId] };
            }
          }
          return post;
        });

      setFavoritePosts(updateFavoritesState);

      // If unliked post is in favorites and user removed their like, refetch
      const post = favoritePosts.find(p => p._id === postId);
      if (post && post.likes.includes(user?._id || "")) {
        fetchFavoritePosts();
      }
    } catch (error) {
      console.error("Error liking post:", error);
      setError("Failed to like post");
    }
  };

  const onCommentInputChange = (postId: string, value: string) => {
    setNewComment(prev => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment[postId]?.trim()) return;

    try {
      await httpService.post(`/post/${postId}/comment`, {
        text: newComment[postId],
      });

      // Clear comment input
      setNewComment(prev => ({
        ...prev,
        [postId]: "",
      }));

      // Refresh posts to show new comment
      fetchFavoritePosts();
    } catch (error) {
      console.error("Error adding comment:", error);
      setError("Failed to add comment");
    }
  };

  function updateSinglePost(updatedPost: IPost): void {
    setFavoritePosts(prevFavoritePosts => prevFavoritePosts.map(post => (post._id === updatedPost._id ? updatedPost : post)));
  }

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

        <div className='favorites-container'>
          {isLoadingFavorites ? (
            <div className='loading'>Loading favorite posts...</div>
          ) : favoritePosts.length > 0 ? (
            user && favoritePosts.map(post => <Post key={post._id} post={post} setSelectedPostId={setSelectedPostId} user={user} handleAddComment={handleAddComment} onCommentInputChange={onCommentInputChange} showComment={false} newComment={newComment} handleLike={handleLike} refetchPosts={fetchFavoritePosts} updateSinglePost={updateSinglePost} />)
          ) : (
            <div className='empty-favorites'>
              <p>You haven't saved any posts to your favorites yet.</p>
            </div>
          )}
        </div>

        {/* Modal with Post Component */}
        {selectedPostId && user && (
          <div className='modal'>
            <div className='modal-content'>
              <button className='close-btn' onClick={() => setSelectedPostId(null)}>
                ×
              </button>
              <Post post={favoritePosts.find(p => p._id === selectedPostId)!} setSelectedPostId={setSelectedPostId} user={user} handleAddComment={handleAddComment} onCommentInputChange={onCommentInputChange} showComment={true} newComment={newComment} handleLike={handleLike} refetchPosts={fetchFavoritePosts} updateSinglePost={updateSinglePost} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Favorites;
