require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

/*
 * HOME
 */
app.get('/', (req, res) => {
    res.json({
        mensaje: 'Beta Logistics API conectada a PostgreSQL'
    });
});

/*
 * LISTAR TAREAS (WEB)
 */
app.get('/tasks', async (req, res) => {

    const resultado = await pool.query(
        'SELECT * FROM tasks ORDER BY id'
    );

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Beta Logistics - Gestión de Tareas</title>

        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 40px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }

            th, td {
                border: 1px solid #ccc;
                padding: 10px;
            }

            input {
                padding: 8px;
                margin-right: 5px;
            }

            button {
                padding: 8px 12px;
                cursor: pointer;
            }

            .acciones {
                display: flex;
                gap: 10px;
                align-items: center;
            }

            form.inline {
                display: inline;
            }
        </style>
    </head>

    <body>

        <h1>Beta Logistics - Gestión de Tareas</h1>

        <form action="/tasks" method="POST">

            <input
                type="text"
                name="titulo"
                placeholder="Título"
                required
            >

            <input
                type="text"
                name="estado"
                placeholder="Estado"
                required
            >

            <button type="submit">
                Crear tarea
            </button>

        </form>

        <table>

            <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Acciones</th>
            </tr>
    `;

    resultado.rows.forEach(task => {

        html += `
        <tr>

            <td>${task.id}</td>
            <td>${task.titulo}</td>
            <td>${task.estado}</td>

            <td>

                <div class="acciones">

                    <a href="/tasks/${task.id}/edit">
                        Editar
                    </a>

                    <form
                        class="inline"
                        action="/tasks/${task.id}/delete"
                        method="POST">

                        <button type="submit">
                            Eliminar
                        </button>

                    </form>

                </div>

            </td>

        </tr>
        `;
    });

    html += `
        </table>

    </body>
    </html>
    `;

    res.send(html);
});

/*
 * CREAR
 */
app.post('/tasks', async (req, res) => {

    const { titulo, estado } = req.body;

    await pool.query(
        `
        INSERT INTO tasks (titulo, estado)
        VALUES ($1, $2)
        `,
        [titulo, estado]
    );

    res.redirect('/tasks');
});

/*
 * FORMULARIO EDITAR
 */
app.get('/tasks/:id/edit', async (req, res) => {

    const { id } = req.params;

    const resultado = await pool.query(
        'SELECT * FROM tasks WHERE id = $1',
        [id]
    );

    const task = resultado.rows[0];

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Editar tarea</title>
    </head>

    <body>

        <h1>Editar tarea</h1>

        <form
            action="/tasks/${task.id}/update"
            method="POST">

            <input
                type="text"
                name="titulo"
                value="${task.titulo}"
                required
            >

            <input
                type="text"
                name="estado"
                value="${task.estado}"
                required
            >

            <button type="submit">
                Actualizar
            </button>

        </form>

        <br>

        <a href="/tasks">
            Volver
        </a>

    </body>
    </html>
    `);
});

/*
 * ACTUALIZAR
 */
app.post('/tasks/:id/update', async (req, res) => {

    const { id } = req.params;
    const { titulo, estado } = req.body;

    await pool.query(
        `
        UPDATE tasks
        SET titulo = $1,
            estado = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [titulo, estado, id]
    );

    res.redirect('/tasks');
});

/*
 * ELIMINAR
 */
app.post('/tasks/:id/delete', async (req, res) => {

    const { id } = req.params;

    await pool.query(
        `
        DELETE FROM tasks
        WHERE id = $1
        `,
        [id]
    );

    res.redirect('/tasks');
});

/*
 * API REST
 */
app.get('/api/tasks', async (req, res) => {

    const resultado = await pool.query(
        'SELECT * FROM tasks ORDER BY id'
    );

    res.json(resultado.rows);
});

app.put('/api/tasks/:id', async (req, res) => {

    const { id } = req.params;
    const { titulo, estado } = req.body;

    const resultado = await pool.query(
        `
        UPDATE tasks
        SET titulo = $1,
            estado = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
        `,
        [titulo, estado, id]
    );

    res.json(resultado.rows[0]);
});

app.delete('/api/tasks/:id', async (req, res) => {

    const { id } = req.paramsaje;

    await pool.query(
        'DELETE FROM tasks WHERE id = $1',
        [id]
    );

    res.json({
        mensaje: 'Tarea eliminada correctamente'
    });
});

/*
 * PUERTO
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
