/**
 * Script para corrigir o device_id no Keychain do iOS
 *
 * Substitui o device_id atual pelo que está registrado no servidor
 */

// Device ID atual no servidor
const SERVER_DEVICE_ID = '0fae9c60-5cae-42c3-9aeb-0182cbc3aaee';

console.log('🔧 Substituindo device_id no Keychain...');
console.log('📱 Novo device_id:', SERVER_DEVICE_ID);

// Este código será executado no console do Safari Web Inspector
// Conecte o Safari ao iPhone e cole este código no console:

`
(async () => {
  try {
    const { AudioTriggerNative } = await import('./src/plugins/audioTriggerNative');

    // Substituir device_id no Keychain
    const result = await AudioTriggerNative.setDeviceId({
      deviceId: '${SERVER_DEVICE_ID}'
    });

    console.log('✅ Device ID atualizado:', result);

    // Verificar
    const check = await AudioTriggerNative.getDeviceId();
    console.log('✅ Verificação:', check.deviceId);

    alert('Device ID atualizado com sucesso! Faça logout e login novamente.');
  } catch (error) {
    console.error('❌ Erro:', error);
    alert('Erro ao atualizar device ID: ' + error.message);
  }
})();
`

console.log('\n📋 Copie o código acima e cole no Safari Web Inspector');
console.log('📱 Safari > Desenvolver > iPhone > App');
