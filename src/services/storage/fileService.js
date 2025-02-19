import fs from 'fs';
import path from 'path';

class FileService {
    constructor(uploadDir) {
        this.uploadDir = uploadDir;
        this.ensureUploadDirExists();
    }

    ensureUploadDirExists() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async saveFile(file) {
        const filePath = path.join(this.uploadDir, file.name);
        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filePath);
            file.stream.pipe(writeStream);
            writeStream.on('finish', () => resolve(filePath));
            writeStream.on('error', (error) => reject(error));
        });
    }

    async deleteFile(fileName) {
        const filePath = path.join(this.uploadDir, fileName);
        return new Promise((resolve, reject) => {
            fs.unlink(filePath, (error) => {
                if (error) {
                    return reject(error);
                }
                resolve(true);
            });
        });
    }

    async getFile(fileName) {
        const filePath = path.join(this.uploadDir, fileName);
        return new Promise((resolve, reject) => {
            fs.access(filePath, fs.constants.F_OK, (error) => {
                if (error) {
                    return reject(new Error('File not found'));
                }
                resolve(filePath);
            });
        });
    }
}

export default new FileService(path.join(__dirname, '../../public/uploads'));