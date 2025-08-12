// Загрузка и возврат изображения в Base64
export const uploadImageController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Конвертация в base64
  const base64Image = req.file.buffer.toString("base64");
  const base64EncodedImage = `data:${req.file.mimetype};base64,${base64Image}`;

  res.json({ image: base64EncodedImage });
};