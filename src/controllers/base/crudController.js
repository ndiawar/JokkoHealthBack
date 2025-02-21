import { Error as MongooseError } from 'mongoose';

class CrudController {
    constructor(model) {
        this.model = model;
        this.cacheExpiration = 3600; // 1 heure en secondes
        this.modelName = model.modelName.toLowerCase();
    }

    // 🔹 Clé du cache pour un élément unique
    #getItemCacheKey(id) {
        return `${this.modelName}:${id}`;
    }

    // 🔹 Clé du cache pour la liste
    #getListCacheKey() {
        return `${this.modelName}:all`;
    }

    // 🔹 Gestion des erreurs globales
    #handleError(res, error, message = 'Erreur serveur') {
        console.error(message, error);

        if (error instanceof MongooseError.ValidationError) {
            return res.status(400).json({ message: 'Validation échouée', details: error.errors });
        }
        if (error.code === 11000) { // Gestion des duplications (ex: email unique)
            return res.status(409).json({ message: 'Conflit de données', details: error.keyValue });
        }

        return res.status(500).json({ message, error: error.message });
    }

    // 🔹 Création d'un élément
    async create(req, res) {
        try {
            const newItem = await this.model.create(req.body);
            return res.status(201).json(newItem);
        } catch (error) {
            return this.#handleError(res, error, "Erreur lors de la création de l'élément");
        }
    }

    // 🔹 Lecture d'un élément par ID
    async read(req, res) {
        try {
            const item = await this.model.findById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: 'Élément non trouvé' });
            }

            return res.status(200).json(item);
        } catch (error) {
            return this.#handleError(res, error, "Erreur lors de la récupération de l'élément");
        }
    }

    // 🔹 Mise à jour d'un élément par ID
    async update(req, res) {
        try {
            const updatedItem = await this.model.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true, context: 'query' }
            );

            if (!updatedItem) {
                return res.status(404).json({ message: "Élément introuvable pour mise à jour" });
            }

            return res.status(200).json(updatedItem);
        } catch (error) {
            return this.#handleError(res, error, "Erreur lors de la mise à jour de l'élément");
        }
    }

    // 🔹 Suppression d'un élément par ID
    async delete(req, res) {
        try {
            const deletedItem = await this.model.findByIdAndDelete(req.params.id);
            if (!deletedItem) {
                return res.status(404).json({ message: "Élément introuvable pour suppression" });
            }

            return res.status(204).send();
        } catch (error) {
            return this.#handleError(res, error, "Erreur lors de la suppression de l'élément");
        }
    }

    // 🔹 Récupération de tous les éléments
    async list(req, res) {
        try {
            const items = await this.model.find({});
            return res.status(200).json({
                count: items.length,
                elements: items
            });
        } catch (error) {
            return this.#handleError(res, error, "Erreur lors de la récupération des éléments");
        }
    }
}

export default CrudController;