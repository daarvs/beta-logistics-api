require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

const app = express();

app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

app.get('/', (req, res) => {
    res.json({
        mensaje: 'Beta Logistics API conectada a PostgreSQL'
    });
});

/*
 * LISTAR TASKS
 */
app.get('/tasks', async (req, res) => {

    const resultado = await pool.query(
        'SELECT * FROM tasks ORDER BY id'
    );

    res.json(resultado.rows);
});

/*
 * CREAR TASK
 */
app.post('/tasks', async (req, res) => {

    const { titulo, estado } = req.body;

    const resultado = await pool.query(
        `INSERT INTO tasks (titulo, estado)
         VALUES ($1, $2)
         RETURNING *`,
        [titulo, estado]
    );

    res.status(201).json(resultado.rows[0]);
});

/*
 * ACTUALIZAR TASK
 */
app.put('/tasks/:id', async (req, res) => {

    const { id } = req.params;
    const { titulo, estado } = req.body;

    const resultado = await pool.query(
        `UPDATE tasks
         SET titulo = $1,
             estado = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [titulo, estado, id]
    );

    res.json(resultado.rows[0]);
});

/*
 * ELIMINAR TASK
 */
app.delete('/tasks/:id', async (req, res) => {

    const { id } = req.params;

    await pool.query(
        'DELETE FROM tasks WHERE id = $1',
        [id]
    );

    res.json({
        mensaje: 'Tarea eliminada correctamente'
    });
});

app.listen(process.env.PORT, () => {
    console.log(
        `Servidor ejecutándose en puerto ${process.env.PORT}`
    );
});
