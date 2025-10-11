// ...imports...
// CREATE
router.post('/', async (req, res, next) => {
  try {
    const { title, slug, description, excerpt, author, category, featured, published_at } = req.body;

    const { rows } = await query(
      `
      INSERT INTO articles (title, slug, description, excerpt, author, category, featured, published_at)
      VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,false),$8)
      RETURNING *
      `,
      [title, slug, description ?? null, excerpt ?? null, author ?? null, category ?? null, featured, published_at ?? null]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// UPDATE
router.put('/:id', async (req, res, next) => {
  try {
    const { title, slug, description, excerpt, author, category, featured, published_at } = req.body;
    const { id } = req.params;

    const { rows } = await query(
      `
      UPDATE articles
      SET
        title = COALESCE($1, title),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        excerpt = COALESCE($4, excerpt),
        author = COALESCE($5, author),
        category = COALESCE($6, category),
        featured = COALESCE($7, featured),
        published_at = COALESCE($8, published_at),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
      `,
      [title ?? null, slug ?? null, description ?? null, excerpt ?? null, author ?? null, category ?? null, featured ?? null, published_at ?? null, id]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});
