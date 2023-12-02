const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(bodyParser.json());

const sequelize = new Sequelize('social_network', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
});

                ///MODELO USUARIO
const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
}, {
    timestamps: false,
    underscored: true,
});


        ///MODDELO PUBLICACION
const Publicacion = sequelize.define(
    'Publicacion',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        titulo: {
            type: DataTypes.STRING,
        },
        contenido: {
            type: DataTypes.TEXT,
        },
        fechaCreacion: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        usuarioId: {
            type: DataTypes.INTEGER,
            references: {
                model: Usuario,
                key: 'id',
            },
        },
    },
    {
        tableName: 'publicaciones',
        timestamps: false,
        underscored: true,
    }
);

        //MODELO COMENTARIO
const Comentario = sequelize.define('Comentario', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    contenido: {
        type: Sequelize.TEXT,
    },
    fechaCreacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    publicacionId: {
        type: Sequelize.INTEGER,
        references: {
            model: Publicacion,
            key: 'id',
        },
    },
    usuarioId: {
        type: Sequelize.INTEGER,
        references: {
            model: Usuario,
            key: 'id',
        },
    },
}, {
    tableName: 'Comentarios',
    timestamps: false,
    underscored: true,
});




///////RUTAS USUARIOS///((()))

app.post('/usuarios', async (req, res) => {
    try {
        const { id, nombre, email } = req.body;

        const nuevoUsuario = await Usuario.create({
            id,
            nombre,
            email,
        });
        res.status(201).json(nuevoUsuario);
    } catch (error) {
        console.error('Error al crear un usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.get('/usuarios/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const usuarioEncontrado = await Usuario.findOne({
            where: {
                email,
            },
        });
        if (usuarioEncontrado) {
            res.json(usuarioEncontrado);
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al buscar usuario por email:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.delete('/usuarios/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const usuarioEliminado = await Usuario.destroy({
            where: {
                id: userId,
            },
        });
        if (usuarioEliminado) {
            res.json({ mensaje: 'Usuario eliminado correctamente' });
        } else {
            res.status(404).json({ error: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar usuario por ID:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

///////TERMINA RUTAS USUARIOS   ////////


///// RUTAS PUBLICACION ////////
app.post('/publicaciones', async (req, res) => {
    try {
        const { titulo, contenido, usuarioId } = req.body;
        const nuevaPublicacion = await Publicacion.create({
            titulo,
            contenido,
            usuarioId,
        });
        res.status(201).json(nuevaPublicacion);
    } catch (error) {
        console.error('Error al crear una publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.put('/publicaciones/:id', async (req, res) => {
    try {
        const publicacionId = req.params.id;
        const { contenido } = req.body;
        const publicacion = await Publicacion.findByPk(publicacionId);
        if (!publicacion) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        await publicacion.update({
            contenido,
        });
        res.json(publicacion);
    } catch (error) {
        console.error('Error al modificar el contenido de la publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.delete('/publicaciones/:id', async (req, res) => {
    try {
        const publicacionId = req.params.id;
        const publicacion = await Publicacion.findByPk(publicacionId);
        if (!publicacion) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        await publicacion.destroy();
        res.json({ mensaje: 'Publicación eliminada correctamente' });
    } catch (error) {
        console.error('Error al borrar la publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.get('/publicaciones/:id', async (req, res) => {
    try {
        const publicacionId = req.params.id;
        const publicacion = await Publicacion.findByPk(publicacionId, {
            include: [{ model: Usuario, attributes: ['id', 'nombre', 'email'] }],
        });
        if (!publicacion) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        res.json(publicacion);
    } catch (error) {
        console.error('Error al buscar la publicación por ID:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


/////TERMINA RUTA DE PUBLLICACIONES ////////


///EMPIEZA RUTAS DE COMENTARIOS /////////

app.post('/comentarios', async (req, res) => {
    try {
        const { contenido, publicacionId, usuarioId } = req.body;
        // Crear un nuevo comentario
        const nuevoComentario = await Comentario.create({
            contenido,
            publicacionId,
            usuarioId,
        });

        res.status(201).json(nuevoComentario);
    } catch (error) {
        console.error('Error al crear un comentario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/comentarios/publicacion/:publicacionId', async (req, res) => {
    try {
        const publicacionId = req.params.publicacionId;

        // Buscar comentarios por ID de publicación
        const comentarios = await Comentario.findAll({
            where: {
                publicacionId,
            },
            include: [{ model: Usuario, attributes: ['id', 'nombre', 'email'] }],
        });

        res.json(comentarios);
    } catch (error) {
        console.error('Error al obtener comentarios por ID de publicación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/comentarios/:id', async (req, res) => {
    try {
        const comentarioId = req.params.id;
        const { contenido } = req.body;

        // Buscar el comentario por ID
        const comentario = await Comentario.findByPk(comentarioId);

        if (!comentario) {
            return res.status(404).json({ error: 'Comentario no encontrado' });
        }

        // Actualizar el contenido del comentario
        await comentario.update({
            contenido,
        });

        res.json(comentario);
    } catch (error) {
        console.error('Error al modificar el comentario por ID:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});



app.delete('/comentarios/usuario/:usuarioId', async (req, res) => {
    try {
        const usuarioId = req.params.usuarioId;

        // Buscar todos los comentarios del usuario por su ID
        const comentarios = await Comentario.findAll({
            where: {
                usuarioId,
            },
        });

        if (comentarios.length === 0) {
            return res.status(404).json({ error: 'Comentarios no encontrados para el usuario' });
        }

        // Borrar todos los comentarios del usuario
        await Comentario.destroy({
            where: {
                usuarioId,
            },
        });

        res.json({ mensaje: 'Comentarios del usuario eliminados correctamente' });
    } catch (error) {
        console.error('Error al borrar los comentarios del usuario por ID:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


////TERMINA RUTAS DE COMENTARIOS

Usuario.hasMany(Publicacion);
Publicacion.belongsTo(Usuario);




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});



sequelize.sync()
    .then(() => {
        console.log('Base de datos sincronizada');
    })
    .catch((error) => {
        console.error('Error al sincronizar la base de datos:', error);
    });
