import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import NavBar from "../NavBar/NavBar";
import { httpService } from "../../httpService";
import { UserDetails } from "../../App";
import "./Dashboard.css";
import { Post } from "../Post";

export interface IPost {
  _id: string;
  user: { username: string; profilePicture: string; _id: string };
  body: string;
  image: string;
  likes: string[];
  comments: Comment[];

  createdAt: string;
  updatedAt: string;
}

interface Comment {
  _id: string;
  user: Pick<UserDetails, "profilePicture" | "username">;
  body: string;
  createdAt: string;
}

const Dashboard = ({ user }: { user: UserDetails | undefined }) => {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Fetch all posts
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = () => {
    setIsLoading(true);
    httpService
      .get<IPost[]>("/post")
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
        console.log("Only JPEG, PNG, and GIF images are allowed");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size cannot exceed 5MB");
        console.log("Image size cannot exceed 5MB");
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

        const uploadResponse = await httpService.post<{ imageUrl: string }>("/post/upload-image", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        imageUrl = uploadResponse.data.imageUrl;
      }

      // Create the post
      const postData = {
        body: newPostText,
        imageUrl: imageUrl || undefined,
      };

      await httpService.post("/post", postData);

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
      await httpService.post(`/post/${postId}/like`);

      // Update posts state
      setPosts(prevPosts =>
        prevPosts.map(post => {
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

            {user && posts.map(post => <Post key={post._id} post={post} setSelectedPostId={setSelectedPostId} user={user} handleAddComment={handleAddComment} onCommentInputChange={onCommentInputChange} showComment={false} newComment={newComment} />)}
          </div>
        </div>
      </div>
      {selectedPostId && user && (
        <div className='modal'>
          <div className='modal-content'>
            <Post post={posts.find(p => p._id === selectedPostId)!} setSelectedPostId={setSelectedPostId} user={user} handleAddComment={handleAddComment} onCommentInputChange={onCommentInputChange} showComment={true} newComment={newComment} />
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
