const {
  updatePostVotesJob,
  updatePostChildrenJob,
} = require('./jobs');

updatePostVotesJob.start();
updatePostChildrenJob.start();
