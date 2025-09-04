import React from 'react';
import {
  IconButton,
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const FavoriteToggleButton = ({ isFavorite, onToggle }) => {
  return (
    <IconButton onClick={onToggle} color="secondary">
      {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
    </IconButton>
  );
};

export default FavoriteToggleButton;
