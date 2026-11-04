const fs = require('fs');
const path = require('path');

const imgPath = 'C:/Users/PC/.gemini/antigravity/brain/0458d57d-b3d4-46a7-9522-b1f353ae414e/.user_uploaded/media_1793752683635_d1488694.png';
console.log('Image exists:', fs.existsSync(imgPath));
console.log('Image size:', fs.statSync(imgPath).size);
