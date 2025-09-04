// src/services/feedbackService.js
import db from './mockDatabase';

export const getFeedbackForUser = async (userId) => {
  return db.feedback.filter(f => f.userId === userId);
};

export const submitFeedback = async (orderId, userId, rating, comment) => {
  const feedbackItem = db.feedback.find(f => f.orderId === orderId && f.userId === userId);
  if (!feedbackItem) {
    throw new Error("Feedback entry not found or you cannot submit feedback for this order.");
  }
  if (feedbackItem.submittedAt) {
      throw new Error("Feedback has already been submitted for this order.");
  }
  feedbackItem.rating = rating;
  feedbackItem.comment = comment;
  feedbackItem.submittedAt = new Date().toISOString();
  return feedbackItem;
};

export const getAllFeedback = async () => {
    // Admin-only function
    return db.feedback.filter(f => f.submittedAt); // Only return submitted feedback
};
