import { addKeyword, utils } from '@builderbot/bot';

const text = [
  { body: '1. *Hogar*' },
  { body: '2. *Comercio*' },
  { body: '3. *Empresa*' },
];

export const soporteInternetFlow = addKeyword(
  utils.setEvent('TECNICA_INTERNET')
)
  .addAnswer(
    'Tipo de servicio:' + text.map((b) => `\n${b.body}`),
    { capture: true },
    async (ctx, { fallBack }) => {
      const opt = ctx.body.trim();
      if (!['1', '2', '3'].includes(opt))
        return fallBack('Por favor elegí 1, 2 o 3');
    }
  )
  .addAnswer(
    `¿De qué localidad sos?  
 Centenario  
2️⃣ Vista Alegre  
3️⃣ Lago Mari Menuco  
4️⃣ Senillosa  
5️⃣ Plottier  
6️⃣ Picún Leufú  
7️⃣ Cinco Saltos  
8️⃣ Contraalmirante Cordero  
9️⃣ Barda del Medio  
🔟 Villa Manzano  
11️⃣ Allen *  
12️⃣ Cipolletti *  
13️⃣ Cordón del Valle *`,
    { capture: true },
    async (ctx, { flowDynamic }) => {
      const opt = parseInt(ctx.body.trim(), 10);

      if (opt >= 11 && opt <= 13) {
        await flowDynamic(
          `📞 Servicio de *CACNET*  
Comunicate al WhatsApp 2984530580 o por mail a cacnet.oficina@gmail.com`
        );
        return;
      }

      await flowDynamic(
        `Perfecto 👍 Servicio de *CTC*.  
Por favor, indicá el número de teléfono, DNI o CUIT del titular de la línea.`
      );
    }
  )
  .addAnswer(
    `¿Qué tipo de inconveniente tenés?  
1️⃣ Cortes  
2️⃣ Lentitud  
3️⃣ Sin acceso a internet  
4️⃣ Otros (escribí tu caso)`,
    { capture: true },
    async (ctx, { endFlow }) => {
      return endFlow(
        `✅ ¡Perfecto! Uno de nuestros técnicos recibirá tu reclamo y seguirá curso para su pronta reparación.  
En caso de ser necesaria una visita, el plazo máximo es de *72hs hábiles*.`
      );
    }
  );
