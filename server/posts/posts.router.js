const express = require('express');
const axios = require('axios');
const { fetchPosts } = require('./posts.service');
const { fetchUserById } = require('../users/users.service');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { start = 0, limit = 10 } = req.query;
    const posts = await fetchPosts({ start, limit });

    const postsWithImages = await posts.reduce(async (accPromise, post) => {
      const acc = await accPromise;

      try {
        const photosResponse = await axios.get(
          `https://jsonplaceholder.typicode.com/albums/${post.id}/photos`,
        );
        const photos = photosResponse.data.map(photo => ({ url: photo.url }));

        const user = await fetchUserById(post.userId);

        return [
          ...acc,
          {
            ...post,
            images: photos,
            user: {
              name: user.name,
              email: user.email,
            },
          },
        ];
      } catch (error) {
        console.error('Error fetching photos for post ', post.id, error);
        return acc; // If there's an error, just return the accumulator without modifying it
      }
    }, Promise.resolve([]));

    res.json(postsWithImages);
  } catch (error) {
    console.error('Error fetching posts with images ', error);
    res.status(500).json({ error: 'Error fetching on server' });
  }
});

module.exports = router;
