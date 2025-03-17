import express from "express";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth.middleware";
import { Response } from "express";
import CommentsModel from "../models/Comments.model";
import PostModel from "../models/Post.model";

export const commentRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: API endpoints for managing comments
 */

/**
 * @swagger
 * /api/comment/{commentId}:
 *   put:
 *     summary: Edit a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment to edit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               body:
 *                 type: string
 *                 description: The updated text of the comment
 *     responses:
 *       200:
 *         description: Comment edited successfully
 *       403:
 *         description: Unauthorized - can only edit your own comments
 *       404:
 *         description: Comment not found
 */
commentRouter.put("/:commentId", authMiddleware, async (req: express.Request, res: Response): Promise<void> => {
  try {
    const commentId = req.params.commentId;
    const userId = (req as AuthenticatedRequest).user.id;
    const { body } = req.body;

    if (!body || body.trim() === "") {
      res.status(400).json({ message: "Comment text cannot be empty" });
      return;
    }

    const comment = await CommentsModel.findById(commentId);

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    // Verify the user is the owner of the comment
    if (comment.user.toString() !== userId) {
      res.status(403).json({ message: "Unauthorized: You can only edit your own comments" });
    }

    comment.body = body;
    await comment.save();

    res.status(200).json({ message: "Comment edited successfully" });
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({ message: "Failed to edit comment" });
  }
});

/**
 * @swagger
 * /api/comment/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Unauthorized - can only delete your own comments
 *       404:
 *         description: Comment not found
 */
commentRouter.delete("/:commentId", authMiddleware, async (req: express.Request, res: Response): Promise<void> => {
  try {
    const commentId = req.params.commentId;
    const userId = (req as AuthenticatedRequest).user.id;

    const comment = await CommentsModel.findById(commentId);

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    // Verify the user is the owner of the comment
    if (comment.user.toString() !== userId) {
      res.status(403).json({ message: "Unauthorized: You can only delete your own comments" });
      return;
    }

    // Remove the comment reference from the post
    await PostModel.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId },
    });

    // Delete the comment
    await CommentsModel.findByIdAndDelete(commentId);

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

export default commentRouter;
