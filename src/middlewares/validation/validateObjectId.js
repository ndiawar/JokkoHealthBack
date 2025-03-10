// middlewares/validateObjectId.js
import mongoose from 'mongoose';

export const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ 
      success: false,
      error: 'ID invalide' 
    });
  }
  next();
};