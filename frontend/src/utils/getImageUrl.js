import { API_BASE_URL } from '../constants/config';

const getImageUrl = (relativePath) => {
  if (!relativePath) {
    return null;
  }
  return `${API_BASE_URL}${relativePath}`;
};

export default getImageUrl;
