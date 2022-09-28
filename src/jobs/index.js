const {
  updatePostVotesJob,
  updatePostChildrenJob,
  waivioWelcomeJob,
} = require('./jobs');

updatePostVotesJob.start();
updatePostChildrenJob.start();
waivioWelcomeJob.start();
