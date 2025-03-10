import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faThumbsUp, faComment, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import NavBar from "./NavBar";
import { httpService } from "../httpService";
import { UserDetails } from "../App";
import "../styles/Dashboard.css";

interface Post {
  _id: string;
  userId: string;
  user: UserDetails;
  text: string;
  imageUrl?: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

interface Comment {
  _id: string;
  userId: string;
  user: UserDetails;
  text: string;
  createdAt: string;
}

const Dashboard = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<UserDetails | null>(null);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});

  const navigate = useNavigate();

  // Fetch current user
  useEffect(() => {
    httpService
      .get<UserDetails>("/auth/check")
      .then(({ data }) => {
        setCurrentUser(data);
      })
      .catch(err => {
        setError("Error fetching user data");
        console.error(err);
      });
  }, []);

  // Fetch all posts
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = () => {
    setIsLoading(true);
    httpService
      .get<Post[]>("/posts")
      .then(({ data }) => {
        setPosts(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError("Error fetching posts");
        setIsLoading(false);
        console.error(err);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPEG, PNG, and GIF images are allowed");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size cannot exceed 5MB");
        return;
      }

      setPostImage(file);

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setError("");
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPostText.trim() && !postImage) {
      setError("Post must contain text or an image");
      return;
    }

    try {
      setIsLoading(true);

      let imageUrl = "";

      // If there's an image, upload it first
      if (postImage) {
        const formData = new FormData();
        formData.append("postImage", postImage);

        const uploadResponse = await httpService.post<{ imageUrl: string }>("/posts/upload-image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        imageUrl = uploadResponse.data.imageUrl;
      }

      // Create the post
      const postData = {
        text: newPostText,
        imageUrl: imageUrl || undefined,
      };

      await httpService.post("/posts", postData);

      // Reset form and fetch updated posts
      setNewPostText("");
      setPostImage(null);
      setImagePreview(null);
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      setError("Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await httpService.post(`/posts/${postId}/like`);

      // Update posts state
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post._id === postId) {
            const userId = currentUser?._id || "";
            // Toggle like
            if (post.likes.includes(userId)) {
              return { ...post, likes: post.likes.filter(id => id !== userId) };
            } else {
              return { ...post, likes: [...post.likes, userId] };
            }
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Error liking post:", error);
      setError("Failed to like post");
    }
  };

  const handleRemoveImage = () => {
    setPostImage(null);
    setImagePreview(null);
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleCommentChange = (postId: string, value: string) => {
    setNewComment(prev => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment[postId]?.trim()) return;

    try {
      await httpService.post(`/posts/${postId}/comment`, {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <NavBar />
      <div className='feed-container'>
        <div className='feed-content'>
          {/* Create Post Section */}
          <div className='create-post-container'>
            <h2>Create Post</h2>
            <form onSubmit={handlePostSubmit}>
              <div className='post-input-container'>
                <textarea placeholder="What's on your mind?" value={newPostText} onChange={e => setNewPostText(e.target.value)} className='post-input' />
              </div>

              {imagePreview && (
                <div className='image-preview-container'>
                  <img src={imagePreview} alt='Preview' className='image-preview' />
                  <button type='button' className='remove-image-btn' onClick={handleRemoveImage}>
                    ×
                  </button>
                </div>
              )}

              {error && <div className='error-message'>{error}</div>}

              <div className='post-actions'>
                <label className='upload-image-btn'>
                  <FontAwesomeIcon icon={faImage} /> Add Photo
                  <input type='file' accept='image/*' onChange={handleFileChange} style={{ display: "none" }} />
                </label>
                <button type='submit' className='post-submit-btn' disabled={isLoading || (!newPostText.trim() && !postImage)}>
                  {isLoading ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>

          {/* Posts Dashboard */}
          <div className='posts-container'>
            <h2>Recent Posts</h2>

            {isLoading && <div className='loading'>Loading posts...</div>}

            {!isLoading && posts.length === 0 && (
              <div className='no-posts'>
                <p>No posts yet. Be the first to share something!</p>
              </div>
            )}

            {posts.map(post => (
              <div key={post._id} className='post-card'>
                <div className='post-header'>
                  <img src={post.user.profilePicture || "/default-avatar.png"} alt={`${post.user.username}'s profile`} className='post-avatar' onClick={() => navigate(`/profile/${post.userId}`)} />
                  <div className='post-user-info'>
                    <h3 className='post-username' onClick={() => navigate(`/profile/${post.userId}`)}>
                      {post.user.username}
                    </h3>
                    <p className='post-date'>{formatDate(post.createdAt)}</p>
                  </div>
                </div>

                <div className='post-content'>
                  {post.text && <p className='post-text'>{post.text}</p>}
                  {post.imageUrl && (
                    <div className='post-image-container'>
                      <img src={post.imageUrl} alt='Post content' className='post-image' />
                    </div>
                  )}
                </div>

                <div className='post-stats'>
                  <span className='like-count'>
                    {post.likes.length} {post.likes.length === 1 ? "like" : "likes"}
                  </span>
                  <span className='comment-count'>
                    {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
                  </span>
                </div>

                <div className='post-actions'>
                  <button className={`action-btn like-btn ${post.likes.includes(currentUser?._id || "") ? "liked" : ""}`} onClick={() => handleLike(post._id)}>
                    <FontAwesomeIcon icon={faThumbsUp} />
                    {post.likes.includes(currentUser?._id || "") ? "Liked" : "Like"}
                  </button>
                  <button className='action-btn comment-btn' onClick={() => toggleComments(post._id)}>
                    <FontAwesomeIcon icon={faComment} /> Comment
                  </button>
                </div>

                {/* Comments Section */}
                {(showComments[post._id] || post.comments.length > 0) && (
                  <div className='comments-section'>
                    {post.comments.length > 0 && (
                      <div className='comments-list'>
                        {post.comments.map(comment => (
                          <div key={comment._id} className='comment'>
                            <img src={comment.user.profilePicture || "/default-avatar.png"} alt={`${comment.user.username}'s profile`} className='comment-avatar' />
                            <div className='comment-content'>
                              <div className='comment-header'>
                                <span className='comment-username'>{comment.user.username}</span>
                                <span className='comment-date'>{formatDate(comment.createdAt)}</span>
                              </div>
                              <p className='comment-text'>{comment.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Form */}
                    <div className='add-comment'>
                      <img src={currentUser?.profilePicture || "/default-avatar.png"} alt='Your profile' className='comment-avatar' />
                      <div className='comment-input-container'>
                        <input type='text' placeholder='Write a comment...' value={newComment[post._id] || ""} onChange={e => handleCommentChange(post._id, e.target.value)} className='comment-input' />
                        <button className='send-comment-btn' onClick={() => handleAddComment(post._id)} disabled={!newComment[post._id]?.trim()}>
                          <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
