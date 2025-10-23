import { addKeyword, utils } from '@builderbot/bot';

export const mainFacturaFlow = addKeyword(
  utils.setEvent('MAIN_FACTURA')
).addAnswer('', {}, async () => {});
