import MessageModel from "../../models/chats/messageModel.js";

export const addMessage = async (req, res) => {
  const { chatId, senderId, text } = req.body;

  if (!chatId || !senderId || !text) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    const message = new MessageModel({ chatId, senderId, text });
    const result = await message.save();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout du message.', details: error.message });
  }
};

export const getMessages = async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    return res.status(400).json({ message: 'L\'ID du chat est requis.' });
  }

  try {
    const messages = await MessageModel.find({ chatId });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des messages.', details: error.message });
  }
};