const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({ message: 'Token non fourni' });
    }

    // Vérifier si le token est déjà blacklisté
    const existingToken = await BlacklistedToken.findOne({ token });
    
    if (!existingToken) {
      // Ajouter le token à la liste noire seulement s'il n'existe pas déjà
      await BlacklistedToken.create({ token });
    }

    res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({ message: 'Erreur lors de la déconnexion' });
  }
}; 