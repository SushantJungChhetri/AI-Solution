export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

export function onError(err, req, res, _next) {
  console.error(err);
  if (res.headersSent) return;
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
}
