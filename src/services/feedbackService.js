// src/services/feedbackService.js
import db from './mockDatabase';

export const getFeedbackForUser = async (userId) => {
  // In a real app, this would query a database.
  // This ensures that even if a feedback entry was created, it is only returned if it has been submitted.
  return db.feedback.filter(f => f.userId === userId && f.submittedAt);
};

export const submitFeedback = async (orderId, rating, comment) => {
  // Find the feedback entry placeholder that was created when the order was delivered.
  const feedbackItem = db.feedback.find(f => f.orderId === orderId);

  if (!feedbackItem) {
    // This case should ideally not happen if the logic is correct elsewhere.
    throw new Error("Could not find a matching order to leave feedback.");
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
