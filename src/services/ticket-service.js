import { envs } from '../configuration/envs.js';

export const createTicket = async (ticketData) => {
  const dir = `${envs.ODOO_API}api/v1/soporte/solicitud`;

  try {
    const res = await fetch(dir, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        user: envs.ODOO_LOGIN,
        clave: envs.ODOO_PAS,
        'api-key': envs.ODOO_API_KEY_FINAL,
      },
      body: JSON.stringify(ticketData),
    });

    console.log(res);

    const data = await res.json();

    if (!res.ok) {
      console.error('❌ Error al crear ticket:', data);
      throw new Error(data.mensaje || 'Error al crear ticket');
    }

    console.log('✅ Ticket creado correctamente:', data);
    return data; // { status: "success", id_solicitud: 123 }
  } catch (err) {
    console.error('⚠️ Error al enviar ticket a Odoo:', err);
    return null;
  }
};
