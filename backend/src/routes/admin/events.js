// ...imports...
// CREATE
router.post('/', async (req, res, next) => {
  try {
    const { title, description, date, time, location, type, status, image_url } = req.body;

    const { rows } = await query(
      `
      INSERT INTO events (title, description, date, "time", location, type, status, image_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [title, description ?? null, date ?? null, time ?? null, location ?? null, type ?? null, status ?? null, image_url ?? null]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// UPDATE
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, date, time, location, type, status, image_url } = req.body;
    const { id } = req.params;

    const { rows } = await query(
      `
      UPDATE events
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        date = COALESCE($3, date),
        "time" = COALESCE($4, "time"),
        location = COALESCE($5, location),
        type = COALESCE($6, type),
        status = COALESCE($7, status),
        image_url = COALESCE($8, image_url),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
      `,
      [title ?? null, description ?? null, date ?? null, time ?? null, location ?? null, type ?? null, status ?? null, image_url ?? null, id]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});
