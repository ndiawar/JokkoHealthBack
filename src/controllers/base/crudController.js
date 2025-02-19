// Importation de modules si nécessaire (ici, il n'y en a pas, mais si tu utilises d'autres services, tu peux les importer)
import { model } from 'mongoose'; // Exemple d'importation, si nécessaire

class CrudController {
    constructor(model) {
        this.model = model;
    }

    async create(req, res) {
        try {
            const newItem = await this.model.create(req.body);
            return res.status(201).json(newItem);
        } catch (error) {
            return res.status(500).json({ message: 'Error creating item', error });
        }
    }

    async read(req, res) {
        try {
            const item = await this.model.findById(req.params.id);
            if (!item) {
                return res.status(404).json({ message: 'Item not found' });
            }
            return res.status(200).json(item);
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving item', error });
        }
    }

    async update(req, res) {
        try {
            const updatedItem = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedItem) {
                return res.status(404).json({ message: 'Item not found' });
            }
            return res.status(200).json(updatedItem);
        } catch (error) {
            return res.status(500).json({ message: 'Error updating item', error });
        }
    }

    async delete(req, res) {
        try {
            const deletedItem = await this.model.findByIdAndDelete(req.params.id);
            if (!deletedItem) {
                return res.status(404).json({ message: 'Item not found' });
            }
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ message: 'Error deleting item', error });
        }
    }
}

// Exportation de la classe pour qu'elle soit utilisée ailleurs dans l'application
export default CrudController;
