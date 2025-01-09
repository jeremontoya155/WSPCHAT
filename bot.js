const venom = require('venom-bot');
const inquirer = require('inquirer');

// Inicia Venom Bot
venom
  .create({
    session: 'session-name',
    multidevice: true,
    autoClose: false, // Mantén la sesión abierta
    disableSpins: true, // Evita bloqueos visuales
  })
  .then((client) => start(client))
  .catch((err) => {
    console.error('Error al iniciar Venom:', err);
  });

async function start(client) {
  console.log('Cliente está listo.');

  // Obtener todos los chats
  const chats = await client.getAllChats();

  // Intentar filtrar grupos por posibles características
  const groups = chats.filter((chat) => {
    return (
      chat.name && // Debe tener un nombre
      chat.name.toLowerCase().includes(' ') // Los nombres de grupos suelen tener espacios
    );
  });

  if (groups.length === 0) {
    console.log('No se encontraron grupos. Asegúrate de que el número está en grupos activos.');
    return;
  }

  console.log('Grupos disponibles:');
  groups.forEach((group, index) => {
    console.log(`${index + 1}. ${group.name}`);
  });

  // Selección de grupo
  const { selectedGroupIndex } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedGroupIndex',
      message: 'Selecciona el grupo al que deseas enviar mensajes:',
      choices: groups.map((group, index) => ({
        name: group.name,
        value: index,
      })),
    },
  ]);

  const selectedGroup = groups[selectedGroupIndex];

  console.log(`Has seleccionado el grupo: ${selectedGroup.name}`);

  // Obtener los participantes del grupo seleccionado
  try {
    const participants = await client.getGroupMembers(selectedGroup.id._serialized);
    console.log(`Participantes del grupo "${selectedGroup.name}":`);
    participants.forEach((participant) => {
      console.log(`- ${participant.id.user}`);
    });

    // Confirmar si enviar mensajes
    const { confirmSend } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmSend',
        message: `¿Deseas enviar un mensaje a los ${participants.length} integrantes de este grupo?`,
      },
    ]);

    if (confirmSend) {
      await sendMessagesToParticipants(client, participants);
    }
  } catch (error) {
    console.error('Error al obtener participantes del grupo:', error);
  }
}

// Función para enviar mensajes a los participantes
async function sendMessagesToParticipants(client, participants) {
  for (let i = 0; i < participants.length; i++) {
    const participantId = participants[i].id._serialized;

    await client
      .sendText(participantId, 'request--Cargador TipoC')
      .then(() => {
        console.log(`Mensaje enviado a: ${participantId}`);
      })
      .catch((err) => {
        console.error(`Error al enviar mensaje a ${participantId}:`, err);
      });

    // Delay para evitar bloqueos
    await delay(1000); // Ajustar según necesidad
  }
  console.log('Todos los mensajes han sido enviados.');
}

// Función de delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
