const ModAction = {
  ALLOW: 'allow',
  WARN: 'warn',
  MUTE: 'mute',
  TEMP_BAN: 'temp_ban',
  PERM_BAN: 'perm_ban',
  REVIEW: 'needs_review'
};

const ContentCategory = {
  HATE: 'hate',
  HARASSMENT: 'harassment',
  SEXUAL: 'sexual',
  VIOLENCE: 'violence',
  SELF_HARM: 'self-harm',
  SPAM: 'spam'
};

module.exports = {
  ModAction,
  ContentCategory
};
