const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const venom = require('venom-bot');

const app = express();
let venomClient = null; // Cliente de Venom
let qrCode = null; // QR Code en base64 para mostrar en la página

// Middleware de optimización
app.use(compression()); // Compresión para acelerar respuestas HTTP
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de Express y EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Ruta principal (Inicio)
app.get('/', (req, res) => {
  res.render('index', {
    status: venomClient ? 'Conectado' : 'Desconectado',
    qrCode: qrCode ? `data:image/png;base64,${qrCode}` : null, // Convertir QR en un formato válido para imágenes
  });
});

// Ruta para listar los grupos
app.get('/groups', async (req, res) => {
  if (!venomClient) {
    res.redirect('/');
    return;
  }

  try {
    const chats = await venomClient.getAllChats(); // Obtener todos los chats
    const groups = chats.filter((chat) => chat.isGroup || (chat.groupMetadata && chat.name)); // Filtrar grupos

    if (groups.length === 0) {
      return res.render('groups', { groups: null, message: 'No se encontraron grupos.' });
    }

    res.render('groups', { groups, message: null });
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).send('Error al obtener los grupos.');
  }
});

// Ruta para enviar mensajes a los participantes
app.post('/send', async (req, res) => {
  const groupId = req.body.groupId;
  const message = req.body.message;

  if (!venomClient) {
    res.status(500).json({ success: false, message: 'Bot no conectado.' });
    return;
  }

  try {
    console.log(`Obteniendo participantes del grupo con ID: ${groupId}`);
    const participants = await venomClient.getGroupMembers(groupId);

    console.log(`Participantes encontrados: ${participants.length}`);
    for (let participant of participants) {
      const participantName = participant.pushname || participant.notify || 'Amigo/a'; // Nombre o predeterminado
      const personalizedMessage = `Hola ${participantName}, ${message}`; // Mensaje personalizado
      console.log(`Enviando mensaje a: ${participantName} (${participant.id.user})`);

      await venomClient.sendText(participant.id._serialized, personalizedMessage);
    }

    res.json({ success: true, message: 'Mensajes enviados con éxito.' });
  } catch (error) {
    console.error('Error al enviar mensajes:', error);
    res.status(500).json({ success: false, message: 'Error al enviar mensajes.' });
  }
});

// Iniciar Venom
function initializeVenom() {
  venom
    .create(
      {
        session: 'session-name',
        multidevice: true,
        autoClose: false,
        disableSpins: true,
      },
      (base64Qr) => {
        qrCode = base64Qr; // Guardar el QR en base64 para mostrar en la web
        console.log('Código QR generado correctamente.');
      }
    )
    .then((client) => {
      venomClient = client;
      qrCode = null; // Limpiar el QR una vez conectada la sesión
      console.log('Bot conectado exitosamente.');
    })
    .catch((error) => {
      console.error('Error al iniciar Venom:', error);
    });
}

// Inicializar el servidor
app.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
  initializeVenom(); // Iniciar Venom después de iniciar el servidor
});
