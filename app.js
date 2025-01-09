const express = require('express');
const bodyParser = require('body-parser');
const venom = require('venom-bot');

const app = express();
let venomClient = null; // Cliente de Venom

// Configuración de Express y EJS
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta principal (Inicio)
app.get('/', (req, res) => {
  res.render('index', { status: venomClient ? 'Conectado' : 'Desconectado' });
});

// Ruta para listar los grupos
app.get('/groups', async (req, res) => {
  if (!venomClient) {
    res.redirect('/');
    return;
  }

  try {
    const chats = await venomClient.getAllChats(); // Obtener todos los chats
    console.log('Chats obtenidos:', chats); // Depuración: muestra todos los chats

    // Filtrar solo los grupos
    const groups = chats.filter(
      (chat) => chat.isGroup || (chat.groupMetadata && chat.name)
    );

    if (groups.length === 0) {
      return res.render('groups', { groups: null, message: 'No se encontraron grupos.' });
    }

    console.log('Grupos encontrados:', groups); // Depuración
    res.render('groups', { groups, message: null });
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).send('Error al obtener los grupos.');
  }
});

// Ruta para enviar mensajes a los participantes
// Ruta para enviar mensajes a los participantes
app.post('/send', async (req, res) => {
    const groupId = req.body.groupId;
    const message = req.body.message;
  
    if (!venomClient) {
      res.redirect('/');
      return;
    }
  
    try {
      console.log(`Obteniendo participantes del grupo con ID: ${groupId}`);
      const participants = await venomClient.getGroupMembers(groupId);
  
      console.log(`Participantes encontrados: ${participants.length}`);
      for (let participant of participants) {
        const participantName = participant.pushname || participant.notify || participant.id.user; // Nombre del participante o su número de teléfono
        const personalizedMessage = `Hola ${participantName}, ${message}`; // Mensaje personalizado
        console.log(`Enviando mensaje a: ${participantName} (${participant.id.user})`);
        
        await venomClient.sendText(participant.id._serialized, personalizedMessage);
      }
  
      res.send('Mensajes enviados con éxito.');
    } catch (error) {
      console.error('Error al enviar mensajes:', error);
      res.status(500).send('Error al enviar mensajes.');
    }
  });
  

// Ruta para enviar mensajes desde la consola (opcional)
app.get('/console', async (req, res) => {
  if (!venomClient) {
    res.redirect('/');
    return;
  }

  try {
    const chats = await venomClient.getAllChats();
    const groups = chats.filter(
      (chat) => chat.isGroup || (chat.groupMetadata && chat.name)
    );

    if (groups.length === 0) {
      console.log('No se encontraron grupos.');
      res.send('No se encontraron grupos.');
      return;
    }

    console.log('Grupos disponibles:');
    groups.forEach((group, index) => {
      console.log(`${index + 1}. ${group.name}`);
    });

    res.send('Los grupos están listados en la consola.');
  } catch (error) {
    console.error('Error al obtener grupos en la consola:', error);
    res.status(500).send('Error al obtener los grupos.');
  }
});

// Iniciar Venom y el servidor
venom
  .create({
    session: 'session-name',
    multidevice: true,
    autoClose: false,
    disableSpins: true,
  })
  .then((client) => {
    venomClient = client;
    app.listen(3000, () => {
      console.log('Servidor iniciado en http://localhost:3000');
    });
  })
  .catch((error) => {
    console.error('Error al iniciar Venom:', error);
  });
