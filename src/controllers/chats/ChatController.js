import ChatModel from '../../models/chats/chatModel.js';
import User from '../../models/user/userModel.js'; // Vérifiez ce chemin
import mongoose from 'mongoose'; // Assurez-vous d'importer mongoose

export const createChat = async (req, res) => {
  try {
      const { senderId, receiverId } = req.body;

      if (!senderId || !receiverId) {
          return res.status(400).json({ message: 'Les IDs de l\'expéditeur et du destinataire sont requis.' });
      }

      if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
          return res.status(400).json({ message: 'ID de l\'expéditeur ou du destinataire invalide.' });
      }

      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);

      if (!sender || !receiver) {
          return res.status(400).json({ message: 'Utilisateur non trouvé pour l\'expéditeur ou le destinataire.' });
      }

      const existingChat = await ChatModel.findOne({
          members: { $all: [senderId, receiverId] },
      });

      if (existingChat) {
          return res.status(400).json({ message: 'Un chat entre ces utilisateurs existe déjà.' });
      }

      const newChat = new ChatModel({
          members: [senderId, receiverId],
      });

      const result = await newChat.save();
      res.status(200).json(result);
  } catch (error) {
      console.error('Erreur lors de la création du chat :', error);
      res.status(500).json({ error: 'Erreur lors de la création du chat.', details: error.message });
  }
};
export const userChats = async (req, res) => {
  try {
    // Vérifier que l'utilisateur existe
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Récupérer les chats contenant l'ID de l'utilisateur
    const chats = await ChatModel.find({
      members: { $in: [req.params.userId] },
    }).populate('members', 'nom prenom email'); // Optionnel : populate avec quelques champs de l'utilisateur

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des chats.', details: error.message });
  }
};

export const findChat = async (req, res) => {
  try {
    const { firstId, secondId } = req.params;

    // Vérifier que les deux utilisateurs existent
    const firstUser = await User.findById(firstId);
    const secondUser = await User.findById(secondId);
    if (!firstUser || !secondUser) {
      return res.status(400).json({ message: 'Un ou plusieurs utilisateurs non trouvés.' });
    }

    // Trouver le chat contenant les deux identifiants
    const chat = await ChatModel.findOne({
      members: { $all: [firstId, secondId] },
    }).populate('members', 'nom prenom email'); // Optionnel : populate avec des informations utilisateur

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la recherche du chat.', details: error.message });
  }
};

// Nouvelle méthode pour lister tous les chats
export const listChats = async (req, res) => {
    try {
      const chats = await ChatModel.find({}).populate('members', 'nom prenom email'); // Optionnel : populate avec des informations utilisateur
      res.status(200).json(chats);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des chats.', details: error.message });
    }
  };
  
