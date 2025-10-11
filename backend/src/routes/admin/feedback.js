import { Router } from 'express';
const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, company, project, comment, rating, is_approved } = req.body;
    const { rows } = await query(
      `
      INSERT INTO feedback (name, company, project, comment, rating, is_approved, date)
      VALUES ($1,$2,$3,$4,$5,COALESCE($6,false), NOW())
      RETURNING *
      `,
      [name, company ?? null, project ?? null, comment ?? null, rating ?? null, is_approved]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});


router.put('/:id', async (req, res, next) => {
  try {
    const { name, company, project, comment, rating, is_approved } = req.body;
    const { id } = req.params;

    const { rows } = await query(
      `
      UPDATE feedback
      SET
        name = COALESCE($1, name),
        company = COALESCE($2, company),
        project = COALESCE($3, project),
        comment = COALESCE($4, comment),
        rating = COALESCE($5, rating),
        is_approved = COALESCE($6, is_approved)
      WHERE id = $7
      RETURNING *
      `,
      [name ?? null, company ?? null, project ?? null, comment ?? null, rating ?? null, is_approved ?? null, id]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

export default router;