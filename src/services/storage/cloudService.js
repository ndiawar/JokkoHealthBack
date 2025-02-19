import cloudStorage from 'cloud-storage-library'; // Remplacez par la bibliothèque de stockage cloud que vous utilisez

class CloudService {
    constructor() {
        this.bucketName = process.env.CLOUD_STORAGE_BUCKET; // Nom du bucket de stockage
    }

    async uploadFile(file) {
        try {
            const result = await cloudStorage.upload({
                Bucket: this.bucketName,
                Key: file.name,
                Body: file.data,
            });
            return result.Location; // Retourne l'URL du fichier téléchargé
        } catch (error) {
            throw new Error('Erreur lors du téléchargement du fichier: ' + error.message);
        }
    }

    async deleteFile(fileName) {
        try {
            await cloudStorage.deleteObject({
                Bucket: this.bucketName,
                Key: fileName,
            });
            return { message: 'Fichier supprimé avec succès' };
        } catch (error) {
            throw new Error('Erreur lors de la suppression du fichier: ' + error.message);
        }
    }

    async getFile(fileName) {
        try {
            const file = await cloudStorage.getObject({
                Bucket: this.bucketName,
                Key: fileName,
            });
            return file.Body; // Retourne le contenu du fichier
        } catch (error) {
            throw new Error('Erreur lors de la récupération du fichier: ' + error.message);
        }
    }
}

export default new CloudService();