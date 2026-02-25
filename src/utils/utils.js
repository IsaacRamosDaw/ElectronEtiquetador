export const removeExtension = (fileName) => {
  if (!fileName) return "";
  return fileName.replace(/\.[^/.]+$/, "");
};