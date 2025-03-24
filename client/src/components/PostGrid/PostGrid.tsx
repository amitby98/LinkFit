import { formatDate } from "../../utils";
import { useState, useEffect } from "react";
import { httpService } from "../../httpService";
import { UserDetails } from "../../App";
import { IPost } from "../Dashboard/Dashboard";
import { Post } from "../Post/Post";
import "./PostGrid.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComment, faHeart } from "@fortawesome/free-solid-svg-icons";

interface FavoritesProps {
  user: UserDetails | undefined;
  isLoadingUser: boolean;
  type: "favorites" | "profile";
  userId?: string;
}

const PostGrid = ({ user, isLoadingUser, type, userId }: FavoritesProps) => {
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [_error, setError] = useState("");
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoadingUser && user?._id) {
      fetchPosts();
    }
  }, [user?._id, isLoadingUser, type, userId]);

  const fetchPosts = async () => {
    setIsLoadingPosts(true);
    try {
      if (!user?._id) {
        setIsLoadingPosts(false);
        return;
      }
      let endpoint = "";
      if (type === "favorites") {
        endpoint = "/post/favorites";
      } else if (type === "profile") {
        const targetUserId = userId || user?._id;
        endpoint = `/post/user/${targetUserId}`;
      }

      const { data } = await httpService.get<IPost[]>(endpoint);
      setPosts(data);
    } catch (error) {
      console.error(`Error fetching ${type} posts:`, error);
      setError(`Failed to load ${type} posts`);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await httpService.post(`/post/${postId}/like`);

      // Update favorites states
      const updatePostsState = (currentPosts: IPost[]) =>
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

      setPosts(updatePostsState);

      if (type === "favorites") {
        const post = posts.find(p => p._id === postId);
        if (post && post.likes.includes(user?._id || "")) {
          fetchPosts();
        }
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
      fetchPosts();
    } catch (error) {
      console.error("Error adding comment:", error);
      setError("Failed to add comment");
    }
  };

  function updateSinglePost(updatedPost: IPost): void {
    setPosts(prevPosts => prevPosts.map(post => (post._id === updatedPost._id ? updatedPost : post)));
  }

  const handlePostClick = (postId: string) => {
    setSelectedPostId(postId);
  };
  const getEmptyMessage = () => {
    if (type === "favorites") {
      return "You haven't saved any posts to your favorites yet.";
    } else {
      // Check if viewing own profile or someone else's
      const isOwnProfile = !userId || userId === user?._id;
      return isOwnProfile ? "Nothing here yet — Share your first post and get started!" : "This user hasn't posted anything yet.";
    }
  };

  // Determine loading message based on type
  const getLoadingMessage = () => {
    return type === "favorites" ? "Loading favorite posts..." : "Loading posts...";
  };

  return (
    <>
      <div className={`${type === "favorites" ? "favorites-container fGrid" : "posts-grid-container fGrid"}`}>
        {isLoadingPosts ? (
          <div className='loading'>{getLoadingMessage()}</div>
        ) : posts.length > 0 ? (
          user &&
          posts.map(post => (
            <div className='post-item' key={post._id} onClick={() => handlePostClick(post._id)}>
              <div className='grid-post-header'>
                <div className='grid-user-info'>
                  <img src={post.user?.profilePicture || "/default-avatar.png"} alt={`${post.user?.username || "User"}'s profile`} className='grid-post-avatar' />
                  <span className='grid-username'>{post.user.username}</span>
                </div>
                <div className='grid-post-date'>{formatDate(post.createdAt)}</div>
              </div>
              <div className='post-favorite-content'>
                {post.image ? (
                  <img src={post.image} alt={post.body || "Post image"} />
                ) : post.body ? (
                  <div className='text-only-post'>
                    <p>{post.body}</p>
                  </div>
                ) : (
                  <div className='empty-post'>
                    <p>No content</p>
                  </div>
                )}
                <div className='post-stats-overlay'>
                  <div className='post-stat'>
                    <FontAwesomeIcon icon={faHeart} />
                    <span>{post.likes.length}</span>
                  </div>
                  <div className='post-stat'>
                    <FontAwesomeIcon icon={faComment} />
                    <span>{post.comments.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={type === "favorites" ? "empty-favorites" : "empty-posts"}>
            <p>{getEmptyMessage()}</p>
          </div>
        )}
      </div>

      {/* Modal with Post Component */}
      {selectedPostId && user && (
        <div className='modal'>
          <div className='post-modal-content'>
            <button className='close-modal' onClick={() => setSelectedPostId(null)}>
              ×
            </button>
            <Post post={posts.find(p => p._id === selectedPostId)!} setSelectedPostId={setSelectedPostId} user={user} handleAddComment={handleAddComment} onCommentInputChange={onCommentInputChange} showComment={true} newComment={newComment} handleLike={handleLike} updateSinglePost={updateSinglePost} refetchPosts={fetchPosts} />
          </div>
        </div>
      )}
    </>
  );
};

export default PostGrid;
