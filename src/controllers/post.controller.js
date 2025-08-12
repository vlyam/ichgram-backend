import Post from '../db/Post.js';
import Follow from '../db/Follow.js';
import Comment from '../db/Comment.js';
import Like from '../db/Like.js';

// Получить все посты
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username fullname profile_image');
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error loading posts' });
  }
};

// Получить посты текущего пользователя
export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id })
      .populate('author', 'username fullname profile_image')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error loading user posts' });
  }
};

// Получить посты другого пользователя по id
export const getPostsByUserId = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.id })
      .populate('author', 'username fullname profile_image')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error loading user posts' });
  }
};

// Собрать ленту новостей с пагинацией
export const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 12;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const followings = await Follow.find({ follower: userId }).select('following');
    const userIds = [...followings.map(f => f.following.toString()), userId];

    const totalPosts = await Post.countDocuments({ author: { $in: userIds } });

    const posts = await Post.find({ author: { $in: userIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullname profile_image')
      .lean();

    const postIds = posts.map(p => p._id);

    const allComments = await Comment.find({ post: { $in: postIds } })
      .sort({ createdAt: 1 })
      .populate('author', 'username fullname profile_image');

    const commentsByPost = {};
    allComments.forEach(comment => {
      const pid = comment.post.toString();
      if (!commentsByPost[pid]) commentsByPost[pid] = [];
      commentsByPost[pid].push(comment);
    });

    const likesAggregation = await Like.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } }
    ]);
    const likesCountByPost = {};
    likesAggregation.forEach(item => {
      likesCountByPost[item._id.toString()] = item.count;
    });

    const userLikes = await Like.find({ post: { $in: postIds }, user: userId }).select('post');
    const likedPostIds = new Set(userLikes.map(like => like.post.toString()));

    const postsWithDetails = posts.map(post => {
      const pid = post._id.toString();
      return {
        ...post,
        comments: commentsByPost[pid] || [],
        likesCount: likesCountByPost[pid] || 0,
        isLiked: likedPostIds.has(pid),
      };
    });

    res.json({
      posts: postsWithDetails,
      totalPosts,
      page,
      limit,
      hasMore: skip + posts.length < totalPosts,
    });
  } catch (error) {
    console.error('Error in getFeedPosts:', error);
    res.status(500).json({ message: 'Error loading feed' });
  }
};

// Собрать галерею Explore с пагинацией
export const getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 14;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments();

    const posts = await Post.aggregate([
      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $project: {
          image: 1,
          createdAt: 1,
          author: {
            _id: 1,
            username: 1,
            fullname: 1,
            profile_image: 1,
          },
        },
      },
    ]);

    const hasMore = skip + posts.length < totalPosts;

    res.json({ posts, hasMore });
  } catch (err) {
    console.error("Error in getExplorePosts:", err);
    res.status(500).json({ message: "Failed to get Explore posts" });
  }
};

// Создать новый пост
export const createPost = async (req, res) => {
  try {
    const { image, description } = req.body;

    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const post = new Post({
      image,
      description,
      author: req.user.id,
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post' });
  }
};

// Получить пост по ID
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username fullname profile_image');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching post' });
  }
};

// Удалить пост
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted' });

  } catch (error) {
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// Обновить пост
export const updatePost = async (req, res) => {
  try {
    const { description, image } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    post.description = description || post.description;
    post.image = image || post.image;

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error updating post' });
  }
};
