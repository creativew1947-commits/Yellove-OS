import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'src', 'assets');

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    
    files.forEach(function (file) {
        const ext = path.extname(file).toLowerCase();
        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
            const inputPath = path.join(directoryPath, file);
            const outputPath = path.join(directoryPath, file.replace(ext, '.webp'));
            sharp(inputPath)
                .webp({ quality: 80 })
                .toFile(outputPath)
                .then(() => {
                    console.log('Converted and compressed ' + file + ' to ' + path.basename(outputPath));
                    fs.unlinkSync(inputPath); // Remove original
                })
                .catch(err => {
                    console.error('Error processing ' + file + ':', err);
                });
        }
    });
});
