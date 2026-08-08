module.exports = (info) => {
  const asbabWurudLink = info.querySelector('a[href$="?asbab=1"]');
  return asbabWurudLink?.getAttribute('href');
};
